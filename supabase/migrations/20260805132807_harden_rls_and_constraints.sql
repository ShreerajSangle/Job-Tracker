-- Security/integrity hardening pass:
--   1. Child-table RLS policies previously only checked `user_id = auth.uid()`
--      without verifying that `job_id` actually belongs to that user. This
--      allowed inserting/updating rows against a job UUID the user doesn't
--      own (as long as they also set user_id to their own id), producing
--      invalid cross-tenant relationships in job_notes, job_status_history
--      and job_documents.
--   2. Weak database integrity: job_url had no scheme restriction and
--      salary_max was never checked against salary_min.
--   3. The job-documents Storage bucket had no size/MIME limits configured.

-- ── job_notes: enforce parent job ownership ────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own notes" ON public.job_notes;
CREATE POLICY "Users can insert their own notes" ON public.job_notes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own notes" ON public.job_notes;
CREATE POLICY "Users can update their own notes" ON public.job_notes
  FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.user_id = auth.uid())
  );

-- ── job_status_history: enforce parent job ownership ───────────────────────
DROP POLICY IF EXISTS "Users can insert their own status history" ON public.job_status_history;
CREATE POLICY "Users can insert their own status history" ON public.job_status_history
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.user_id = auth.uid())
  );

-- ── job_documents: enforce parent job ownership ────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.job_documents;
CREATE POLICY "Users can insert their own documents" ON public.job_documents
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own documents" ON public.job_documents;
CREATE POLICY "Users can update their own documents" ON public.job_documents
  FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.user_id = auth.uid())
  );

-- ── job_documents: file_path integrity — must live under the owner's folder ─
ALTER TABLE public.job_documents
  ADD CONSTRAINT job_documents_file_path_scoped_check
  CHECK (file_path LIKE user_id::text || '/%');

-- ── jobs: restrict job_url to http(s) and validate salary range ────────────
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_job_url_scheme_check
  CHECK (job_url IS NULL OR job_url ~* '^https?://');

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_salary_range_check
  CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min);

-- ── job-documents bucket: enforce size/MIME limits server-side too ────────
UPDATE storage.buckets
SET
  file_size_limit = 5242880, -- 5 MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
WHERE id = 'job-documents';
