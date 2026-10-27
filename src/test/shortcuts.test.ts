import { describe, it, expect } from 'vitest';
import { routeForKey, SHORTCUT_ROUTES } from '@/lib/shortcuts';
import { initialsFor } from '@/lib/userName';
import type { User } from '@supabase/supabase-js';

describe('shortcuts', () => {
  it('maps exactly the six allowed keys (case-insensitive)', () => {
    expect(Object.keys(SHORTCUT_ROUTES).sort()).toEqual(['a', 'c', 'h', 'n', 'r', 's']);
    expect(routeForKey('A')).toBe('/applications');
    expect(routeForKey('h')).toBe('/dashboard');
    expect(routeForKey('N')).toBe('/applications?new=1');
    expect(routeForKey('R')).toBe('/resumes');
    expect(routeForKey('S')).toBe('/settings');
    expect(routeForKey('c')).toBe('/');
  });
  it('ignores everything else', () => {
    for (const k of ['g', 'k', '/', 'Enter', 'x']) expect(routeForKey(k)).toBeNull();
  });
});

describe('initialsFor', () => {
  const u = (name?: string, email = 'shreeraj@example.com') => ({ email, user_metadata: name ? { full_name: name } : {} }) as unknown as User;
  it('uses the display name', () => expect(initialsFor(u('Shree Raj'))).toBe('SR'));
  it('single name → first two letters', () => expect(initialsFor(u('Shreeraj'))).toBe('SH'));
  it('falls back to the email', () => expect(initialsFor(u())).toBe('SH'));
});
