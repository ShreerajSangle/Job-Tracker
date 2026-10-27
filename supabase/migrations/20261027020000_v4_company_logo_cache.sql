-- Server-only cache of public company → domain/logo resolution (service role only; no user data).
create table public.company_logo_cache (
  company_key text primary key check (char_length(company_key) between 1 and 200),
  domain text,
  official_url text,
  logo_url text,
  resolver_model text,
  resolved_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index company_logo_cache_expires_idx on public.company_logo_cache (expires_at);
alter table public.company_logo_cache enable row level security;
revoke all on public.company_logo_cache from public, anon, authenticated;
