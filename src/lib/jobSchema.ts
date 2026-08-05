import { z } from 'zod';

// Empty-string form inputs shouldn't coerce to 0 — treat them as "not provided".
const optionalNonNegativeNumber = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.coerce.number().nonnegative().optional(),
);

export const jobSchema = z.object({
  company_name:    z.string().min(1, 'Company name is required').max(255, 'Too long'),
  job_title:       z.string().min(1, 'Job title is required').max(255, 'Too long'),
  status:          z.enum(['saved', 'applied', 'interviewing', 'offered', 'accepted', 'rejected', 'withdrawn']),
  source:          z.enum(['linkedin', 'indeed', 'referral', 'company_site', 'recruiter', 'other']).optional(),
  job_url:         z.string()
                     .url('Must be a valid URL')
                     .refine((url) => /^https?:\/\//i.test(url), 'URL must start with http:// or https://')
                     .optional()
                     .or(z.literal('')),
  job_description: z.string().max(10000).optional(),
  salary_min:      optionalNonNegativeNumber,
  salary_max:      optionalNonNegativeNumber,
  applied_date:    z.string().optional(),
  notes:           z.string().max(2000).optional(),
}).refine(
  (data) => data.salary_min == null || data.salary_max == null || data.salary_max >= data.salary_min,
  { message: 'Max salary must be greater than or equal to min salary', path: ['salary_max'] },
);

export type JobFormData = z.infer<typeof jobSchema>;
