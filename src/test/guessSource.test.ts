import { describe, it, expect } from 'vitest';
import { guessSource } from '@/lib/guessSource';

describe('guessSource', () => {
  it('detects linkedin from the label or the URL', () => {
    expect(guessSource('LinkedIn', 'https://acme.com/jobs/1')).toBe('linkedin');
    expect(guessSource(null, 'https://www.linkedin.com/jobs/view/1')).toBe('linkedin');
  });

  it('detects a company career site', () => {
    expect(guessSource('Company site', 'https://acme.com/careers/1')).toBe('company_site');
    expect(guessSource(null, 'https://boards.greenhouse.io/acme/jobs/1')).toBe('company_site');
  });

  it('falls back to "other" when nothing matches', () => {
    expect(guessSource(null, 'https://acme.com/postings/1')).toBe('other');
    expect(guessSource('Some random board', 'https://example.org/x')).toBe('other');
  });
});
