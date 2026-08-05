import { describe, it, expect } from 'vitest';
import { jobSchema } from '@/lib/jobSchema';

const base = {
  company_name: 'Acme',
  job_title: 'Engineer',
  status: 'applied' as const,
};

describe('jobSchema', () => {
  it('accepts the minimal required fields', () => {
    const result = jobSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('rejects non-http(s) job URLs', () => {
    const result = jobSchema.safeParse({ ...base, job_url: 'javascript:alert(1)' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid https job URL', () => {
    const result = jobSchema.safeParse({ ...base, job_url: 'https://example.com/job/123' });
    expect(result.success).toBe(true);
  });

  it('requires company_name and job_title', () => {
    expect(jobSchema.safeParse({ ...base, company_name: '' }).success).toBe(false);
    expect(jobSchema.safeParse({ ...base, job_title: '' }).success).toBe(false);
  });
});
