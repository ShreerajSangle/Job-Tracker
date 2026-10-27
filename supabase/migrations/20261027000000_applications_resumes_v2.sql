-- v2 schema: applications + resumes + resume_versions + user_settings.
-- Additive: the legacy jobs/job_* tables are left in place (dropped in a later migration).
-- Resume files stay in the existing private `job-documents` bucket (user-id-first paths,
-- 5 MB / PDF+DOCX limits and storage RLS already apply).

create type public.application_status as enum ('applied','interviewing','offer','rejected','withdrawn');

create table public.user_settings (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  search_ends_on   date,
  portfolio_public boolean not null default false,
  portfolio_slug   text unique check (portfolio_slug ~ '^[a-z0-9-]{3,40}$'),
  created_at       timestamptz not null default now()
);

create table public.resumes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (id, user_id)
);

create table public.resume_versions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resume_id  uuid not null,
  version    int  not null,
  file_path  text not null check (file_path like user_id::text || '/%'),
  file_name  text not null,
  file_size  int  not null check (file_size <= 5242880),
  created_at timestamptz not null default now(),
  unique (resume_id, version),
  unique (id, user_id),
  foreign key (resume_id, user_id) references public.resumes (id, user_id) on delete cascade
);

create table public.applications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company           text not null check (char_length(company) between 1 and 120),
  role              text not null check (char_length(role) between 1 and 160),
  location          text,
  url               text check (url is null or url ~* '^https?://'),
  status            public.application_status not null default 'applied',
  applied_on        date not null default current_date,
  resume_version_id uuid,
  notes             text,
  ever_interviewed  boolean not null default false,
  legacy_job_id     uuid unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  foreign key (resume_version_id, user_id)
    references public.resume_versions (id, user_id) on delete set null (resume_version_id)
);

create index applications_user_applied_idx on public.applications (user_id, applied_on desc, id desc);
create index applications_user_status_idx  on public.applications (user_id, status);
create index applications_resume_idx       on public.applications (resume_version_id) where resume_version_id is not null;
create index resume_versions_resume_idx    on public.resume_versions (resume_id, version desc);
create index resumes_user_idx              on public.resumes (user_id);

create function public.applications_before_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if new.status = 'interviewing' then new.ever_interviewed := true; end if;
  return new;
end $$;

create trigger applications_bw before insert or update on public.applications
  for each row execute function public.applications_before_write();

create function public.add_resume_version(p_resume uuid, p_path text, p_name text, p_size int)
returns public.resume_versions
language sql security invoker set search_path = '' as $$
  insert into public.resume_versions (resume_id, version, file_path, file_name, file_size)
  select p_resume, coalesce(max(version), 0) + 1, p_path, p_name, p_size
  from public.resume_versions where resume_id = p_resume
  returning *;
$$;

create view public.application_stats with (security_invoker = true) as
select user_id,
  count(*)                                    as applied,
  count(*) filter (where status = 'rejected') as rejections,
  count(*) filter (where ever_interviewed)    as interviews,
  count(*) filter (where status = 'offer')    as offers
from public.applications group by user_id;

alter table public.user_settings   enable row level security;
alter table public.resumes         enable row level security;
alter table public.resume_versions enable row level security;
alter table public.applications    enable row level security;

create policy own_rows on public.user_settings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_rows on public.resumes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_rows on public.applications for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- versions are immutable: no UPDATE policy
create policy own_select on public.resume_versions for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.resume_versions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.resume_versions for delete to authenticated using ((select auth.uid()) = user_id);

-- ── backfill from legacy tables (idempotent) ────────────────────────────────
-- one resume per distinct (user, file_name, file_size) among resume documents
insert into public.resumes (user_id, name)
select distinct d.user_id, regexp_replace(d.file_name, '\.[A-Za-z0-9]+$', '')
from public.job_documents d
where d.document_type = 'resume'
  and not exists (select 1 from public.resumes r where r.user_id = d.user_id
                  and r.name = regexp_replace(d.file_name, '\.[A-Za-z0-9]+$', ''));

insert into public.resume_versions (user_id, resume_id, version, file_path, file_name, file_size, created_at)
select d.user_id, r.id,
       row_number() over (partition by r.id order by d.uploaded_at),
       d.file_path, d.file_name, coalesce(d.file_size, 0), d.uploaded_at
from public.job_documents d
join public.resumes r on r.user_id = d.user_id
 and r.name = regexp_replace(d.file_name, '\.[A-Za-z0-9]+$', '')
where d.document_type = 'resume'
  and not exists (select 1 from public.resume_versions v where v.file_path = d.file_path);

insert into public.applications
  (user_id, company, role, location, url, status, applied_on, notes, ever_interviewed, legacy_job_id, created_at, resume_version_id)
select j.user_id, left(j.company_name,120), left(j.job_title,160), j.location, j.job_url,
  (case j.status when 'saved' then 'applied' when 'offered' then 'offer' when 'accepted' then 'offer'
     else j.status::text end)::public.application_status,
  coalesce(j.applied_date, j.created_at)::date,
  nullif(concat_ws(E'\n\n', nullif(j.notes,''),
     (select string_agg(n.content, E'\n' order by n.created_at) from public.job_notes n where n.job_id = j.id)), ''),
  j.status in ('interviewing','offered','accepted')
    or exists (select 1 from public.job_status_history h where h.job_id = j.id and h.to_status = 'interviewing'),
  j.id, j.created_at,
  (select v.id from public.job_documents d
     join public.resume_versions v on v.file_path = d.file_path
    where d.job_id = j.id and d.document_type = 'resume'
    order by d.uploaded_at desc limit 1)
from public.jobs j
where not exists (select 1 from public.applications a where a.legacy_job_id = j.id);

-- hardening applied right after (also recorded as migration v2_revoke_anon_and_helper_exec)
revoke all on public.applications, public.resumes, public.resume_versions, public.user_settings, public.application_stats from anon;
revoke execute on function public.add_resume_version(uuid,text,text,int) from anon, public;
grant execute on function public.add_resume_version(uuid,text,text,int) to authenticated;
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
