import { describe, it, expect } from 'vitest';
import { buildSnapshot, isLastUtcDayOfMonth, normalizeSource, aiPayload, type AnalysisJob } from '../../api/_lib/analysis';

const job = (o: Partial<AnalysisJob>): AnalysisJob => ({ id: Math.random().toString(36), role: 'Dev', company: 'Acme', status: 'applied',
  applied_on: '2026-10-01', created_at: '2026-10-01T00:00:00Z', location: 'Dublin', source: 'LinkedIn', rejected_stage_name: null, ...o });
const now = new Date('2026-10-31T12:00:00Z');

describe('analysis snapshot', () => {
  it('flags stale applied (>=21d) and interviewing (>=14d) only', () => {
    const s = buildSnapshot([job({ applied_on: '2026-10-01' }), job({ applied_on: '2026-10-20' }),
      job({ status: 'interviewing', applied_on: '2026-10-10', created_at: '2026-10-10T00:00:00Z' })], [], now);
    expect(s.stale).toBe(2);
  });
  it('excludes bookmarked from tracked and counts interview activity from stages', () => {
    const a = job({ id: 'a' });
    const s = buildSnapshot([a, job({ status: 'bookmarked' })],
      [{ application_id: 'a', name: 'Tech', stage_type: 'interview', position: 1, state: 'completed', started_at: null, completed_at: null, updated_at: null }], now);
    expect(s.tracked).toBe(1);
    expect(s.interviewActivity).toBe(1);
    expect(s.interviewRate).toBe(100);
  });
  it('normalises sources and rejection stages', () => {
    expect(normalizeSource('LinkedIn - Referred').label).toBe('LinkedIn');
    expect(normalizeSource('Referral - Employee').label).toBe('Referral');
    const s = buildSnapshot([job({ status: 'rejected', rejected_stage_name: 'Phone Screen' })], [], now);
    expect(s.rejectionStages).toEqual([{ stage: 'Phone Screen', count: 1 }]);
  });
  it('detects the last UTC day of the month', () => {
    expect(isLastUtcDayOfMonth(new Date('2026-10-31T18:00:00Z'))).toBe(true);
    expect(isLastUtcDayOfMonth(new Date('2026-10-30T18:00:00Z'))).toBe(false);
    expect(isLastUtcDayOfMonth(new Date('2028-02-29T18:00:00Z'))).toBe(true);
  });
  it('never puts company or location into the AI payload', () => {
    const p = JSON.stringify(aiPayload(buildSnapshot([job({ company: 'SecretCo', location: 'Hidden' })], [], now)));
    expect(p).not.toContain('SecretCo');
    expect(p).not.toContain('Hidden');
  });
});
