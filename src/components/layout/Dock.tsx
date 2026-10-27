import { useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Plus, Settings, FileText, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/applications', label: 'Applications', Icon: Briefcase },
  { to: '/resumes', label: 'Resumes', Icon: FileText },
] as const;

const item = 'dock-item group relative flex h-11 w-11 items-center justify-center rounded-full text-ink-2 outline-none transition-[background-color,color] duration-150 hover:text-cream focus-visible:ring-2 focus-visible:ring-ring';
const tip = 'pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface-3 px-2.5 py-1 text-[0.7rem] text-cream opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100';

/** Keyboard: g d / g a / g r to jump, n for a new application. */
function useShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    let armed = 0;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable) return;
      if (document.querySelector('[role="dialog"]')) return;
      const k = e.key.toLowerCase();
      if (armed && Date.now() - armed < 1000) {
        const to = { d: '/dashboard', a: '/applications', r: '/resumes' }[k];
        armed = 0;
        if (to) { e.preventDefault(); navigate(to); return; }
      }
      if (k === 'g') armed = Date.now();
      else if (k === 'n') { e.preventDefault(); navigate('/applications?new=1'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);
}

/** Floating, centered, Apple-style dock with pointer-driven magnification. */
export function Dock() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const bar = useRef<HTMLElement>(null);
  useShortcuts();

  useEffect(() => {
    const el = bar.current;
    const canMagnify = window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches;
    if (!el || !canMagnify) return;
    const nodes = () => [...el.querySelectorAll<HTMLElement>('.dock-item')];
    const move = (e: PointerEvent) => nodes().forEach((n) => {
      const r = n.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2));
      n.style.setProperty('--s', String(1 + 0.4 * Math.exp(-((d / 64) ** 2))));
    });
    const leave = () => nodes().forEach((n) => n.style.setProperty('--s', '1'));
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, []);

  return (
    <nav
      ref={bar}
      aria-label="Main"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex -translate-x-1/2 items-end gap-1 rounded-full border border-cream/10 bg-surface-1/70 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl backdrop-saturate-150 [@media(prefers-reduced-transparency:reduce)]:bg-surface-1 [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none"
    >
      {ITEMS.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} aria-label={label}
          className={({ isActive }) => `${item} ${isActive ? 'bg-surface-3 text-cream' : ''}`}>
          {({ isActive }) => (
            <>
              <span className={tip}>{label}</span>
              <Icon className="h-5 w-5" />
              {isActive && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-green-ink" />}
            </>
          )}
        </NavLink>
      ))}
      <span className="mx-1 h-6 w-px self-center bg-cream/10" />
      <button type="button" aria-label="New application" onClick={() => navigate('/applications?new=1')}
        className={`${item} bg-bordo text-cream hover:bg-bordo-hi`}>
        <span className={tip}>New · n</span>
        <Plus className="h-5 w-5" />
      </button>
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Account" className={`${item} text-xs font-semibold ${pathname === '/settings' ? 'bg-surface-3 text-cream' : ''}`}>
            <span className={tip}>Account</span>
            {(user.email ?? 'JT').slice(0, 2).toUpperCase()}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={14} className="w-56">
            <p className="px-2 py-1.5 text-xs text-ink-2">{user.email}</p>
            <DropdownMenuItem onClick={() => navigate('/settings')}><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={async () => { await signOut(); navigate('/login'); }}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}
