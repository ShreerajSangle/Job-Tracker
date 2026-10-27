import { useCallback, useState } from 'react';

const KEY = 'searchEndsOn';

function read(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

/** Days until the job-search end date (kept per-browser until the
 *  user_settings table is migrated). */
export function useDaysLeft() {
  const [endsOn, setEndsOnState] = useState<string | null>(read);
  const setEndsOn = useCallback((v: string) => {
    setEndsOnState(v || null);
    try {
      if (v) localStorage.setItem(KEY, v);
      else localStorage.removeItem(KEY);
    } catch { /* private mode */ }
  }, []);
  const daysLeft = endsOn
    ? Math.max(0, Math.ceil((new Date(endsOn + 'T23:59:59').getTime() - Date.now()) / 864e5))
    : null;
  return { endsOn, daysLeft, setEndsOn };
}
