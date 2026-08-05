import { JobSource } from '@/types/job';

/** Maps Groq's free-text source guess (plus the URL itself) onto our fixed JobSource enum. */
export function guessSource(label: string | null, url: string): JobSource {
  const hay = `${label ?? ''} ${url}`.toLowerCase();
  if (hay.includes('linkedin')) return 'linkedin';
  if (hay.includes('indeed')) return 'indeed';
  if (hay.includes('referral')) return 'referral';
  if (hay.includes('recruiter')) return 'recruiter';
  if (hay.includes('greenhouse') || hay.includes('lever') || hay.includes('workday')
    || hay.includes('company') || hay.includes('career')) return 'company_site';
  return 'other';
}
