import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useJobStats } from '@/hooks/useJobStats';
import { Job } from '@/types/job';

function makeJob(overrides: Partial<Job>): Job {
  return {
    id: overrides.id ?? Math.random().toString(36),
    user_id: 'user-1',
    company_name: 'Acme',
    job_title: 'Engineer',
    status: 'saved',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('useJobStats', () => {
  it('excludes saved jobs from per-source success-rate denominators', () => {
    // 4 LinkedIn jobs: 1 saved (not yet submitted), 3 submitted, 1 of those offered.
    // Success rate should be computed over the 3 submitted, not all 4.
    const jobs: Job[] = [
      makeJob({ source: 'linkedin', status: 'saved' }),
      makeJob({ source: 'linkedin', status: 'applied' }),
      makeJob({ source: 'linkedin', status: 'rejected' }),
      makeJob({ source: 'linkedin', status: 'offered' }),
    ];
    const { result } = renderHook(() => useJobStats(jobs));
    expect(result.current.bySource.linkedin.total).toBe(4);
    expect(result.current.bySource.linkedin.submitted).toBe(3);
    expect(result.current.bestSource?.source).toBe('linkedin');
    expect(result.current.bestSource?.rate).toBeCloseTo((1 / 3) * 100);
  });

  it('counts a job that was interviewed then rejected in the interview rate', () => {
    const jobs: Job[] = [
      makeJob({ id: 'a', status: 'rejected' }), // was interviewed, later rejected
      makeJob({ id: 'b', status: 'applied' }),  // never interviewed
    ];
    const everInterviewedJobIds = new Set(['a']);

    const withHistory = renderHook(() => useJobStats(jobs, everInterviewedJobIds));
    expect(withHistory.result.current.interviewRate).toBeCloseTo(50);

    const withoutHistory = renderHook(() => useJobStats(jobs));
    expect(withoutHistory.result.current.interviewRate).toBe(0);
  });

  it('excludes future applied_date entries from the weekly velocity chart', () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const jobs: Job[] = [makeJob({ applied_date: future, status: 'applied' })];
    const { result } = renderHook(() => useJobStats(jobs));
    const totalBucketed = result.current.weeklyApplications.reduce((sum, w) => sum + w.count, 0);
    expect(totalBucketed).toBe(0);
  });
});
