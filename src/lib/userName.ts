import type { User } from '@supabase/supabase-js';

export const displayName = (u: User | null | undefined): string => {
  const n = u?.user_metadata?.full_name;
  return typeof n === 'string' ? n.trim() : '';
};

/** "Shree Raj" → "SR"; single names use the first two letters; falls back to the email. */
export function initialsFor(u: User | null | undefined): string {
  const name = displayName(u);
  const source = name || (u?.email ?? 'JT').split('@')[0];
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const out = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return out.toUpperCase();
}
