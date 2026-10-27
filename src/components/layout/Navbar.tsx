import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/applications', label: 'Applications' },
  { to: '/resumes', label: 'Resumes' },
];

/** Translucent top bar: content scrolls underneath (single translucent layer). */
export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 w-full border-t border-cream/10 bg-background/60 backdrop-blur-xl backdrop-saturate-150 [@media(prefers-reduced-transparency:reduce)]:bg-surface-1 [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link to="/" className="font-display text-sm font-semibold tracking-tight text-cream">JobTracker</Link>
          <nav className="flex items-center gap-1 text-sm">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 transition-colors active:scale-[0.97] ${isActive ? 'bg-surface-3 text-cream' : 'text-ink-2 hover:text-cream'}`}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-8 w-8 items-center justify-center rounded-full bg-bordo text-xs font-medium text-cream outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Account"
            >
              {(user.email ?? 'JT').slice(0, 2).toUpperCase()}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <p className="px-2 py-1.5 text-xs text-ink-2">{user.email}</p>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => { await signOut(); navigate('/login'); }}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
