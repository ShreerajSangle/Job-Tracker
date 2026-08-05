import { describe, it, expect } from 'vitest';
import { jobSchema } from '@/components/jobs/QuickAddJobForm';

const base = {
  company_name: 'Acme',
  job_title: 'Engineer',
  status: 'applied' as const,
};

describe('jobSchema', () => {
  it('treats an empty salary string as absent rather than coercing to 0', () => {
    const result = jobSchema.safeParse({ ...base, salary_min: '', salary_max: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.salary_min).toBeUndefined();
      expect(result.data.salary_max).toBeUndefined();
    }
  });

  it('rejects salary_max below salary_min', () => {
    const result = jobSchema.safeParse({ ...base, salary_min: '100000', salary_max: '50000' });
    expect(result.success).toBe(false);
  });

  it('accepts salary_max equal to or above salary_min', () => {
    const result = jobSchema.safeParse({ ...base, salary_min: '50000', salary_max: '100000' });
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
});
