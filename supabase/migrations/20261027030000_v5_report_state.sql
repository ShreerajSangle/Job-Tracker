-- Server-only bookkeeping for AI analysis emails (cooldown + once-per-month). Service role only,
-- so users cannot reset their own cooldown.
create table public.report_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_report_at timestamptz,
  monthly_last_period text check (monthly_last_period is null or monthly_last_period ~ '^[0-9]{4}-[0-9]{2}$'),
  monthly_last_sent_at timestamptz
);
alter table public.report_state enable row level security;
revoke all on public.report_state from public, anon, authenticated;
