import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, FileText, Home, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApplications } from '@/features/applications/queries';
import { useResumes } from '@/features/resumes/queries';
import { initialsFor } from '@/lib/userName';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const item = 'dock-item group relative flex h-14 min-w-14 items-center justify-center rounded-full text-ink-2 outline-none transition-[background-color,color] duration-150 hover:text-cream focus-visible:ring-2 focus-visible:ring-ring';
const tip = 'pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface-3 px-3 py-1 text-xs text-cream opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100';

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
  const { data: apps } = useApplications();
  const { data: resumes } = useResumes();

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
      <NavLink to="/dashboard" aria-label="Home" className={({ isActive }) => `${item} w-14 ${isActive ? 'bg-surface-3 text-cream' : ''}`}>
        {({ isActive }) => (
          <>
            <span className={tip}>Home</span>
            <Home className="h-6 w-6" />
            {isActive && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-green-ink" />}
          </>
        )}
      </NavLink>

      <NavLink to="/applications" aria-label="Applications" className={({ isActive }) => `${item} w-14 ${isActive ? 'bg-surface-3 text-cream' : ''}`}>
        {({ isActive }) => (
          <>
            <span className={tip}>Applications</span>
            <Briefcase className="h-6 w-6" />
            <Badge n={interviewing} />
            {isActive && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-green-ink" />}
          </>
        )}
      </NavLink>

      <button type="button" aria-label="New application" onClick={() => navigate('/applications?new=1')}
        className={`${item} w-16 bg-bordo text-cream hover:bg-bordo-hi`}>
        <span className={tip}>New</span>
        <Plus className="h-7 w-7" />
      </button>

      <NavLink to="/resumes" aria-label="Resumes" className={({ isActive }) => `${item} w-14 ${isActive ? 'bg-surface-3 text-cream' : ''}`}>
        {({ isActive }) => (
          <>
            <span className={tip}>Resumes</span>
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
            {initialsFor(user)}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={16} className="w-44">
            <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={async () => { await signOut(); navigate('/login'); }}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}
