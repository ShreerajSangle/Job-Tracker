-- Legacy tables are no longer used by the app: close them to API roles (data is kept).
revoke all on public.jobs, public.job_notes, public.job_status_history, public.job_documents from anon, authenticated;

alter function public.update_updated_at_column() set search_path = '';

-- Cover foreign keys flagged by the performance advisor.
create index if not exists applications_resume_version_idx on public.applications (resume_version_id, user_id);
create index if not exists resume_versions_resume_user_idx on public.resume_versions (resume_id, user_id);
create index if not exists resume_versions_user_idx on public.resume_versions (user_id);
create index if not exists application_stage_events_stage_idx on public.application_stage_events (stage_id);
