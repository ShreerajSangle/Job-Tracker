-- v3: lifecycle stages + append-only history (modelled on AryanKedare/job-application-tracker).
update public.applications set status = 'ghosted' where status = 'withdrawn';

alter table public.applications
  add column if not exists source text check (source is null or char_length(source) <= 80),
  add column if not exists jd_text text,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejected_stage_name text;

alter table public.user_settings
  add column if not exists monthly_analysis_enabled boolean not null default false;

create table public.application_stages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 200),
  stage_type text not null default 'custom' check (char_length(stage_type) between 1 and 80),
  position integer not null default 0 check (position >= 0),
  state text not null default 'pending' check (state in ('pending','current','completed','skipped','rejected')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index application_stages_app_pos_idx on public.application_stages (application_id, position, created_at);
create index application_stages_user_idx on public.application_stages (user_id);
create unique index application_stages_one_current_idx on public.application_stages (application_id) where state = 'current';
alter table public.application_stages enable row level security;
create policy own_rows on public.application_stages for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid()))
  );

create table public.application_stage_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  stage_id uuid references public.application_stages(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 1 and 80),
  stage_name_snapshot text,
  from_status text,
  to_status text,
  notes text,
  occurred_at timestamptz not null default now()
);
create index application_stage_events_app_time_idx on public.application_stage_events (application_id, occurred_at desc);
create index application_stage_events_user_idx on public.application_stage_events (user_id);
alter table public.application_stage_events enable row level security;
revoke all on public.application_stage_events from public, anon, authenticated;
grant select on public.application_stage_events to authenticated;
create policy read_own on public.application_stage_events for select to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.application_stages from anon;

create function public.set_application_stage_updated_at() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at := now(); return new; end $$;
create trigger application_stage_updated_at before update on public.application_stages
  for each row execute function public.set_application_stage_updated_at();

create function public.log_application_stage_event() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_event text;
begin
  if tg_op = 'INSERT' then v_event := 'stage_added';
  elsif old.name is distinct from new.name then
    insert into public.application_stage_events (application_id, stage_id, user_id, event_type, stage_name_snapshot, notes)
    values (new.application_id, new.id, new.user_id, 'stage_renamed', new.name, 'Renamed from "' || old.name || '"');
  end if;
  if tg_op = 'UPDATE' and old.state is distinct from new.state then
    v_event := case new.state when 'current' then 'stage_started' when 'completed' then 'stage_completed'
      when 'skipped' then 'stage_skipped' when 'rejected' then 'stage_rejected' else 'stage_reset' end;
  end if;
  if v_event is not null then
    insert into public.application_stage_events (application_id, stage_id, user_id, event_type, stage_name_snapshot)
    values (new.application_id, new.id, new.user_id, v_event, new.name);
  end if;
  return new;
end $$;
revoke execute on function public.log_application_stage_event() from public, anon, authenticated;
create trigger application_stage_event_log after insert or update on public.application_stages
  for each row execute function public.log_application_stage_event();

create function public.sync_application_from_stage() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' or old.state is distinct from new.state then
    if new.state = 'current' then
      update public.applications set status = 'interviewing'
      where id = new.application_id and user_id = new.user_id and status not in ('offer','rejected','ghosted');
    elsif new.state = 'rejected' then
      update public.applications set status = 'rejected',
        rejected_at = coalesce(new.completed_at, now()), rejected_stage_name = new.name
      where id = new.application_id and user_id = new.user_id;
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.sync_application_from_stage() from public, anon, authenticated;
create trigger application_stage_status_sync after insert or update on public.application_stages
  for each row execute function public.sync_application_from_stage();

create function public.log_application_status_event() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_stage_id uuid; v_stage_name text;
begin
  if tg_op = 'INSERT' then
    insert into public.application_stage_events (application_id, user_id, event_type, to_status, occurred_at)
    values (new.id, new.user_id, 'application_created', new.status::text, coalesce(new.created_at, now()));
    return new;
  end if;
  if old.status is distinct from new.status then
    select s.id, s.name into v_stage_id, v_stage_name from public.application_stages s
    where s.application_id = new.id and s.state in ('current','rejected')
    order by case when s.state = 'rejected' then 0 else 1 end, s.position desc limit 1;
    insert into public.application_stage_events (application_id, stage_id, user_id, event_type, stage_name_snapshot, from_status, to_status)
    values (new.id, v_stage_id, new.user_id, 'status_changed', v_stage_name, old.status::text, new.status::text);
  end if;
  return new;
end $$;
revoke execute on function public.log_application_status_event() from public, anon, authenticated;
create trigger application_status_event_log_insert after insert on public.applications
  for each row execute function public.log_application_status_event();
create trigger application_status_event_log_update after update of status on public.applications
  for each row execute function public.log_application_status_event();

-- Applied = anything past bookmarked
create or replace view public.application_stats with (security_invoker = true) as
select user_id,
  count(*) filter (where status <> 'bookmarked') as applied,
  count(*) filter (where status = 'rejected')    as rejections,
  count(*) filter (where ever_interviewed)       as interviews,
  count(*) filter (where status = 'offer')       as offers
from public.applications group by user_id;
