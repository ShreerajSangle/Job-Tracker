import type { Database } from '@/integrations/supabase/types';

export type ApplicationStatus = Database['public']['Enums']['application_status'];
export type Application = Database['public']['Tables']['applications']['Row'];
export type ApplicationInput = Pick<
  Database['public']['Tables']['applications']['Insert'],
  'company' | 'role' | 'location' | 'url' | 'status' | 'applied_on' | 'notes' | 'resume_version_id'
>;

export const STATUSES: ApplicationStatus[] = ['applied', 'interviewing', 'offer', 'rejected', 'withdrawn'];

/** Pill colours come from tokens: [background, text]. */
export const STATUS_STYLE: Record<ApplicationStatus, { label: string; cls: string }> = {
  applied:      { label: 'Applied',      cls: 'bg-green text-green-ink' },
  interviewing: { label: 'Interviewing', cls: 'bg-cream text-green' },
  offer:        { label: 'Offer',        cls: 'bg-green-ink text-background' },
  rejected:     { label: 'Rejected',     cls: 'bg-bordo text-cream' },
  withdrawn:    { label: 'Withdrawn',    cls: 'bg-surface-3 text-ink-2' },
};
