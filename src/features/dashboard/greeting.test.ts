import { describe, expect, it } from 'vitest';
import { greetingFor, periodFor } from './greeting';

describe('greeting', () => {
  it('maps hours to periods', () => {
    expect([0, 4, 5, 9, 12, 17, 21, 23].map(periodFor)).toEqual(
      ['night', 'night', 'early', 'morning', 'afternoon', 'evening', 'late', 'late']);
  });
  it('is deterministic for the same hour and appends the first name', () => {
    const d = new Date(2026, 9, 27, 10, 30);
    expect(greetingFor(d)).toBe(greetingFor(new Date(2026, 9, 27, 10, 59)));
    expect(greetingFor(d, 'Shree Raj')).toMatch(/, Shree$/);
  });
  it('varies across hours/days', () => {
    const set = new Set([9, 10, 11].map((h) => greetingFor(new Date(2026, 9, 27, h))));
    expect(set.size).toBeGreaterThan(1);
  });
});
