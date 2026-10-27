import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** The only keyboard shortcuts in the app: plain keys, no modifiers. */
export const SHORTCUT_ROUTES: Record<string, string> = {
  a: '/applications',
  h: '/dashboard',
  n: '/applications?new=1',
  r: '/resumes',
  s: '/settings',
  c: '/',
};

export const routeForKey = (key: string) => SHORTCUT_ROUTES[key.toLowerCase()] ?? null;

/** Ignored while typing or while a dialog is open. */
export function useShortcuts(enabled = true) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.repeat) return;
      const t = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable) return;
      if (document.querySelector('[role="dialog"], [role="menu"]')) return;
      const to = routeForKey(e.key);
      if (to) { e.preventDefault(); navigate(to); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, enabled]);
}
