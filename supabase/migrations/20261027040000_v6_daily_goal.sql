alter table public.user_settings
  add column if not exists daily_goal integer not null default 5
  check (daily_goal between 1 and 100);
