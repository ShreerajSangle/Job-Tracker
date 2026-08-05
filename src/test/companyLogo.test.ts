import { describe, it, expect } from 'vitest';
import { domainFromJobUrl } from '@/components/jobs/CompanyLogo';

describe('domainFromJobUrl', () => {
  it('returns the bare domain for a direct company-site posting', () => {
    expect(domainFromJobUrl('https://www.acme.com/careers/123')).toBe('acme.com');
  });

  it('strips only a leading www.', () => {
    expect(domainFromJobUrl('https://jobs.acme.com/posting/1')).toBe('jobs.acme.com');
  });

  it('returns null for known job-board hosts (no company branding to show)', () => {
    expect(domainFromJobUrl('https://www.linkedin.com/jobs/view/123')).toBeNull();
    expect(domainFromJobUrl('https://boards.greenhouse.io/acme/jobs/123')).toBeNull();
    expect(domainFromJobUrl('https://jobs.lever.co/acme/123')).toBeNull();
  });

  it('returns null for missing or malformed URLs', () => {
    expect(domainFromJobUrl(null)).toBeNull();
    expect(domainFromJobUrl(undefined)).toBeNull();
    expect(domainFromJobUrl('not a url')).toBeNull();
  });
});
