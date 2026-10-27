import { callApi } from '@/lib/callApi';

export interface ImportedJob {
  job_title: string; company: string; location: string; source: string; notes: string; job_link: string; extraction_method: string;
}

export const isHttpUrl = (v: string) => {
  try { return ['http:', 'https:'].includes(new URL(v).protocol); } catch { return false; }
};

export const importJobFromUrl = (url: string) => callApi<ImportedJob>('/api/jobs/import', { url });
