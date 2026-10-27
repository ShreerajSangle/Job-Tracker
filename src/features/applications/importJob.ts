import { callApi } from '@/lib/callApi';

export interface ImportedJob {
  job_title: string; company: string; location: string; source: string; notes: string; job_link: string; extraction_method: string;
}

export const isHttpUrl = (v: string) => {
  try { return ['http:', 'https:'].includes(new URL(v).protocol); } catch { return false; }
};

export async function importJobFromUrl(url: string) {
  const res = await callApi<ImportedJob>('/api/jobs/import', { url });
  if ('error' in res) return res;
  // Guard against an unexpected response shape instead of crashing the dialog.
  return res.data && typeof res.data === 'object' ? res : { error: 'The import returned no details. Enter them manually.' };
}
