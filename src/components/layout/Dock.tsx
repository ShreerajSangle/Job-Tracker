import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, FileText, LogOut, Plus, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApplications } from '@/features/applications/queries';
import { useResumes } from '@/features/resumes/queries';
import { useCounterStats } from '@/features/stats/useCounterStats';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const item = 'dock-item group relative flex h-14 min-w-14 items-center justify-center rounded-full text-ink-2 outline-none transition-[background-color,color] duration-150 hover:text-cream focus-visible:ring-2 focus-visible:ring-ring';
const tip = 'pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface-3 px-3 py-1 text-xs text-cream opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100';

/** Keyboard: g d / g a / g r / g c to jump, n for a new application. */
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
        const to = { d: '/dashboard', a: '/applications', r: '/resumes', c: '/' }[k];
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

/** Small count badge that pulses once whenever the number changes. */
function Badge({ n }: { n: number | undefined }) {
  const prev = useRef(n);
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (prev.current !== undefined && n !== undefined && prev.current !== n) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      prev.current = n;
      return () => clearTimeout(t);
    }
    prev.current = n;
  }, [n]);
  if (!n) return null;
  return (
    <span className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-bordo px-1 font-mono text-[0.65rem] leading-none text-cream ${pulse ? 'badge-pulse' : ''}`}>
      {n}
    </span>
  );
}

/** Floating, centered, Apple-style dock: live numbers, magnification, one-hop bounce on click. */
export function Dock() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const bar = useRef<HTMLElement>(null);
  const { data: stats } = useCounterStats();
  const { data: apps } = useApplications();
  const { data: resumes } = useResumes();
  useShortcuts();

  const interviewing = apps?.filter((a) => a.status === 'interviewing').length;

  useEffect(() => {
    const el = bar.current;
    const canMagnify = window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches;
    if (!el || !canMagnify) return;
    const nodes = () => [...el.querySelectorAll<HTMLElement>('.dock-item')];
    const move = (e: PointerEvent) => nodes().forEach((n) => {
      const r = n.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2));
      n.style.setProperty('--s', String(1 + 0.45 * Math.exp(-((d / 80) ** 2))));
    });
    const leave = () => nodes().forEach((n) => n.style.setProperty('--s', '1'));
    const hop = (e: Event) => {
      const n = (e.target as HTMLElement).closest<HTMLElement>('.dock-item');
      if (!n) return;
      n.classList.remove('dock-hop');
      void n.offsetWidth; // restart the animation
      n.classList.add('dock-hop');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('click', hop);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); el.removeEventListener('click', hop); };
  }, []);

  return (
    <nav
      ref={bar}
      aria-label="Main"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-end gap-1.5 rounded-full border border-cream/10 bg-surface-1/70 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl backdrop-saturate-150 [@media(prefers-reduced-transparency:reduce)]:bg-surface-1 [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none"
    >
      <NavLink to="/" end aria-label="Counter" className={({ isActive }) => `${item} px-4 ${isActive ? 'bg-surface-3 text-cream' : ''}`}>
        <span className={tip}>Counter · g c</span>
        <span className="flex flex-col items-center leading-none">
          <span className="font-mono text-xl tabular-nums text-green-ink">{stats ? stats.applied : '–'}</span>
          <span className="mt-1 text-[0.6rem] uppercase tracking-[0.06em]">applied</span>
        </span>
      </NavLink>

      <NavLink to="/applications" aria-label="Applications" className={({ isActive }) => `${item} w-14 ${isActive ? 'bg-surface-3 text-cream' : ''}`}>
        {({ isActive }) => (
          <>
            <span className={tip}>Applications · g a</span>
            <Briefcase className="h-6 w-6" />
            <Badge n={interviewing} />
            {isActive && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-green-ink" />}
          </>
        )}
      </NavLink>

      <button type="button" aria-label="New application" onClick={() => navigate('/applications?new=1')}
        className={`${item} w-16 bg-bordo text-cream hover:bg-bordo-hi`}>
        <span className={tip}>New · n</span>
        <Plus className="h-7 w-7" />
      </button>

      <NavLink to="/resumes" aria-label="Resumes" className={({ isActive }) => `${item} w-14 ${isActive ? 'bg-surface-3 text-cream' : ''}`}>
        {({ isActive }) => (
          <>
            <span className={tip}>Resumes · g r</span>
            <FileText className="h-6 w-6" />
            <Badge n={resumes?.length} />
            {isActive && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-green-ink" />}
          </>
        )}
      </NavLink>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Account" className={`${item} w-14 text-sm font-semibold ${pathname === '/settings' ? 'bg-surface-3 text-cream' : ''}`}>
            <span className={tip}>Account</span>
            {(user.email ?? 'JT').slice(0, 2).toUpperCase()}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={16} className="w-56">
            <p className="px-2 py-1.5 text-xs text-ink-2">{user.email}</p>
            <DropdownMenuItem onClick={() => navigate('/dashboard')}><Briefcase className="mr-2 h-4 w-4" />Dashboard</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={async () => { await signOut(); navigate('/login'); }}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}
