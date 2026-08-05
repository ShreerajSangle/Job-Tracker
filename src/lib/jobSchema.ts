import { z } from 'zod';

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
  location:        z.string().max(255).optional(),
  applied_date:    z.string().optional(),
  notes:           z.string().max(2000).optional(),
});

export type JobFormData = z.infer<typeof jobSchema>;
