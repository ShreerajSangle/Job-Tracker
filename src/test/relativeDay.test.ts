import { describe, it, expect } from 'vitest';
import { relativeDay } from '@/lib/format';

describe('relativeDay', () => {
  const today = '2026-10-27';
  it('labels recent days', () => {
    expect(relativeDay('2026-10-27', today)).toBe('Today');
    expect(relativeDay('2026-10-26', today)).toBe('Yesterday');
    expect(relativeDay('2026-10-24', today)).toBe('3d ago');
  });
  it('falls back to a short date after two weeks and for future dates', () => {
    expect(relativeDay('2026-10-01', today)).toBe('1 Oct');
    expect(relativeDay('2026-11-02', today)).toBe('2 Nov');
  });
});
