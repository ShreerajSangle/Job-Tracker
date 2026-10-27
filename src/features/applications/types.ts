import type { Database } from '@/integrations/supabase/types';

export type ApplicationStatus = Database['public']['Enums']['application_status'];
export type Application = Database['public']['Tables']['applications']['Row'];
export type ApplicationInput = Pick<
  Database['public']['Tables']['applications']['Insert'],
  'company' | 'role' | 'location' | 'url' | 'status' | 'applied_on' | 'notes' | 'resume_version_id' | 'source' | 'jd_text'
>;

export const STATUSES: ApplicationStatus[] = ['bookmarked', 'applied', 'interviewing', 'offer', 'rejected', 'ghosted'];

/** Pill colours come from tokens: [background, text]. */
export const STATUS_STYLE: Record<ApplicationStatus, { label: string; cls: string }> = {
  bookmarked:   { label: 'Bookmarked',   cls: 'bg-surface-3 text-cream-dim' },
  applied:      { label: 'Applied',      cls: 'bg-green text-green-ink' },
  interviewing: { label: 'Interviewing', cls: 'bg-cream text-green' },
  offer:        { label: 'Offer',        cls: 'bg-green-ink text-background' },
  rejected:     { label: 'Rejected',     cls: 'bg-bordo text-cream' },
  withdrawn:    { label: 'Withdrawn',    cls: 'bg-surface-3 text-ink-2' },
  ghosted:      { label: 'Ghosted',      cls: 'bg-surface-3 text-ink-2' },
};

export type StageState = 'pending' | 'current' | 'completed' | 'skipped' | 'rejected';
export type Stage = Database['public']['Tables']['application_stages']['Row'] & { state: StageState };
export type StageEvent = Database['public']['Tables']['application_stage_events']['Row'];

/** [id, label, stage_type] */
export const STAGE_PRESETS = [
  ['recruiter-screening', 'Recruiter Screening', 'screening'],
  ['hr-interview', 'HR Interview', 'interview'],
  ['phone-screen', 'Phone Screen', 'screening'],
  ['assessment', 'Assessment', 'assessment'],
  ['online-assessment', 'Online Assessment', 'assessment'],
  ['coding-assessment', 'Coding Assessment', 'coding'],
  ['technical-interview', 'Technical Interview', 'interview'],
  ['interview-round-1', 'Interview Round 1', 'interview'],
  ['interview-round-2', 'Interview Round 2', 'interview'],
  ['interview-round-3', 'Interview Round 3', 'interview'],
  ['hiring-manager', 'Hiring Manager Interview', 'interview'],
  ['behavioural', 'Behavioural Interview', 'interview'],
  ['system-design', 'System Design Interview', 'interview'],
  ['culture-fit', 'Culture Fit', 'interview'],
  ['final-interview', 'Final Interview', 'interview'],
  ['reference-check', 'Reference Check', 'verification'],
  ['background-check', 'Background Check', 'verification'],
  ['offer-discussion', 'Offer Discussion', 'offer'],
  ['custom', 'Custom stage', 'custom'],
] as const;
