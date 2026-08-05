export type JobStatus = 'saved' | 'applied' | 'interviewing' | 'offered' | 'accepted' | 'rejected' | 'withdrawn';
export type JobSource = 'linkedin' | 'indeed' | 'referral' | 'company_site' | 'recruiter' | 'other';
export type NoteCategory = 'general' | 'call' | 'email' | 'feedback' | 'reminder';
export type DocumentType = 'resume' | 'cover_letter' | 'offer_letter' | 'assessment' | 'feedback' | 'other';

export interface Job {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_url?: string | null;
  status: JobStatus;
  source?: JobSource | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  location?: string | null;
  applied_date?: string | null;
  deadline_date?: string | null;
  notes?: string | null;
  job_description?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface JobNote {
  id: string;
  job_id: string;
  user_id: string;
  content: string;
  category: NoteCategory;
  created_at: string;
  updated_at?: string | null;
}

export interface JobStatusHistory {
  id: string;
  job_id: string;
  user_id: string;
  from_status: JobStatus | null;
  to_status: JobStatus;
  changed_at: string;
  reason?: string | null;
}

export interface JobDocument {
  id: string;
  job_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size?: number | null;
  document_type: DocumentType;
  is_primary?: boolean | null;
  uploaded_at: string;
}

export const STATUS_CONFIG: Record<JobStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  saved:        { label: 'Saved',        color: 'text-white', bgColor: 'bg-[hsl(var(--status-saved))]',        borderColor: 'border-transparent', icon: 'saved' },
  applied:      { label: 'Applied',      color: 'text-white', bgColor: 'bg-[hsl(var(--status-applied))]',      borderColor: 'border-transparent', icon: 'applied' },
  interviewing: { label: 'Interviewing', color: 'text-white', bgColor: 'bg-[hsl(var(--status-interviewing))]', borderColor: 'border-transparent', icon: 'interviewing' },
  offered:      { label: 'Offered',      color: 'text-white', bgColor: 'bg-[hsl(var(--status-offered))]',      borderColor: 'border-transparent', icon: 'offered' },
  accepted:     { label: 'Accepted',     color: 'text-white', bgColor: 'bg-[hsl(var(--status-accepted))]',     borderColor: 'border-transparent', icon: 'accepted' },
  rejected:     { label: 'Rejected',     color: 'text-white', bgColor: 'bg-[hsl(var(--status-rejected))]',     borderColor: 'border-transparent', icon: 'rejected' },
  withdrawn:    { label: 'Withdrawn',    color: 'text-white', bgColor: 'bg-[hsl(var(--status-withdrawn))]',    borderColor: 'border-transparent', icon: 'withdrawn' },
};

export const SOURCE_CONFIG: Record<JobSource, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  linkedin:     { label: 'LinkedIn',     color: 'text-[hsl(201,70%,68%)]', bgColor: 'bg-[hsl(201,45%,20%)]' },
  indeed:       { label: 'Indeed',       color: 'text-[hsl(234,60%,75%)]', bgColor: 'bg-[hsl(234,40%,20%)]' },
  referral:     { label: 'Referral',     color: 'text-[hsl(152,55%,65%)]', bgColor: 'bg-[hsl(152,40%,18%)]' },
  company_site: { label: 'Company Site', color: 'text-[hsl(260,60%,75%)]', bgColor: 'bg-[hsl(260,40%,20%)]' },
  recruiter:    { label: 'Recruiter',    color: 'text-[hsl(38,70%,65%)]',  bgColor: 'bg-[hsl(38,45%,18%)]' },
  other:        { label: 'Other',        color: 'text-muted-foreground',    bgColor: 'bg-muted' },
};

export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  saved:        ['applied', 'rejected', 'withdrawn'],
  applied:      ['interviewing', 'rejected', 'withdrawn'],
  interviewing: ['offered', 'rejected', 'withdrawn'],
  offered:      ['accepted', 'rejected', 'withdrawn'],
  accepted:     [],
  rejected:     ['applied'],
  withdrawn:    ['applied'],
};

export const NOTE_CATEGORY_CONFIG: Record<NoteCategory, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  general:  { label: 'General',  color: 'text-muted-foreground',           bgColor: 'bg-muted',                    icon: 'note' },
  call:     { label: 'Call',     color: 'text-[hsl(215,55%,65%)]',         bgColor: 'bg-[hsl(215,40%,15%)]',       icon: 'call' },
  email:    { label: 'Email',    color: 'text-[hsl(260,45%,70%)]',         bgColor: 'bg-[hsl(260,30%,15%)]',       icon: 'email' },
  feedback: { label: 'Feedback', color: 'text-[hsl(30,45%,60%)]',          bgColor: 'bg-[hsl(30,25%,14%)]',        icon: 'feedback' },
  reminder: { label: 'Reminder', color: 'text-[hsl(0,45%,62%)]',           bgColor: 'bg-[hsl(0,30%,14%)]',         icon: 'reminder' },
};
