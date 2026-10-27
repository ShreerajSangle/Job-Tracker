import { describe, it, expect } from 'vitest';
import { isPrivateIp } from '../../api/_lib/ssrf';
import { extractStructuredJob, formatNotes, normalizeList, extractEmbeddedJobData } from '../../api/_lib/extractJob';

describe('isPrivateIp', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '198.18.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:7f00:1', '224.0.0.1'])('blocks %s', (ip) => {
    expect(isPrivateIp(ip)).toBe(true);
  });
  it.each(['8.8.8.8', '93.184.216.34', '2606:4700:4700::1111'])('allows %s', (ip) => {
    expect(isPrivateIp(ip)).toBe(false);
  });
});

describe('extractStructuredJob', () => {
  it('reads JSON-LD JobPosting incl. @graph', () => {
    const html = `<script type="application/ld+json">{"@graph":[{"@type":"JobPosting","title":"Backend Engineer","hiringOrganization":{"name":"Acme"},"jobLocation":{"address":{"addressLocality":"Dublin","addressCountry":"IE"}},"description":"<p>Build things</p>"}]}</script>`;
    const j = extractStructuredJob(html, 'https://jobs.acme.com/1');
    expect(j).toMatchObject({ job_title: 'Backend Engineer', company: 'Acme', location: 'Dublin, IE', source: 'jobs.acme.com' });
    expect(j.notes).toContain('Build things');
  });
  it('falls back to meta tags', () => {
    const j = extractStructuredJob('<meta property="og:title" content="Dev"><meta property="og:site_name" content="Foo">', 'https://x.io/a');
    expect(j).toMatchObject({ job_title: 'Dev', company: 'Foo' });
  });
});

describe('notes + lists', () => {
  it('normalises bullets and strings', () => {
    expect(normalizeList('• a\n- b;3) c')).toEqual(['a', 'b', 'c']);
  });
  it('formats sections', () => {
    const n = formatNotes({ job_summary: 'S', responsibilities: ['r1'], required_qualifications: ['q1'], preferred_skills: [] });
    expect(n).toBe('JOB SUMMARY\nS\n\nRESPONSIBILITIES\n• r1\n\nREQUIRED QUALIFICATIONS\n• q1');
  });
  it('keeps job-related embedded scripts only', () => {
    const html = '<script id="__NEXT_DATA__">{"jobTitle":"x"}</script><script>var a=1</script>';
    expect(extractEmbeddedJobData(html)).toContain('jobTitle');
    expect(extractEmbeddedJobData(html)).not.toContain('var a');
  });
});
