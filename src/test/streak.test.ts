import { describe, it, expect } from 'vitest';
import { computeStreak } from '@/features/stats/streak';
import { needsFollowUp } from '@/features/applications/followUp';

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-10-27', '2026-10-26', '2026-10-25', '2026-10-23'], '2026-10-27')).toBe(3);
  });
  it('keeps the streak alive if today has none yet', () => {
    expect(computeStreak(['2026-10-26', '2026-10-25'], '2026-10-27')).toBe(2);
  });
  it('is 0 after a missed day, and handles month boundaries', () => {
    expect(computeStreak(['2026-10-24'], '2026-10-27')).toBe(0);
    expect(computeStreak(['2026-11-01', '2026-10-31'], '2026-11-01')).toBe(2);
  });
});

describe('needsFollowUp', () => {
  const now = new Date('2026-10-27T12:00:00');
  const base = { applied_on: '2026-10-15', updated_at: '2026-10-15T09:00:00Z' };
  it('flags applied rows with 7+ quiet days', () => expect(needsFollowUp({ ...base, status: 'applied' }, now)).toBe(true));
  it('ignores recent activity and other statuses', () => {
    expect(needsFollowUp({ ...base, status: 'applied', updated_at: '2026-10-25T09:00:00Z' }, now)).toBe(false);
    expect(needsFollowUp({ ...base, status: 'interviewing' }, now)).toBe(false);
  });
});
