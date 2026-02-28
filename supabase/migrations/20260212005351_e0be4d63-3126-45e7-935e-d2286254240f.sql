
-- Add job_description column to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS job_description text;

-- Create storage bucket for job documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-documents', 'job-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for job-documents bucket
CREATE POLICY "Users can upload their own job documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'job-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own job documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own job documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'job-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
