import { describe, expect, it } from 'vitest';
import { weeklyCounts } from './weekly';

describe('weeklyCounts', () => {
  const today = new Date(2026, 9, 27); // Tue 27 Oct 2026
  it('buckets by Monday-based week, oldest first', () => {
    const r = weeklyCounts(
      [new Date(2026, 9, 26), new Date(2026, 9, 25), new Date(2026, 9, 19), new Date(2026, 8, 1)],
      today,
      3,
    );
    expect(r.map((b) => b.count)).toEqual([0, 2, 1]);
    expect(r[2].label).toBe('This wk');
  });
  it('returns n buckets', () => {
    expect(weeklyCounts([], today)).toHaveLength(6);
  });
});
