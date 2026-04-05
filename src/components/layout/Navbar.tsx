import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QuickAddJobForm } from '@/components/jobs/QuickAddJobForm';
import { useAuth } from '@/hooks/useAuth';
import { Briefcase, LogOut, LayoutDashboard, BarChart3, Settings, Moon, Sun } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    // Apply stored theme on mount
    const stored = localStorage.getItem('theme');
    if (stored) {
      const dark = stored === 'dark';
      document.documentElement.classList.toggle('dark', dark);
      setIsDark(dark);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  const getInitials  = (email: string) => email.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm hidden sm:block text-foreground tracking-tight">JobTracker</span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            <Button variant="ghost" size="sm" asChild
              className={location.pathname === '/dashboard' ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:text-foreground'}>
              <Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-1.5" />Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild
              className={location.pathname === '/insights' ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:text-foreground'}>
              <Link to="/insights"><BarChart3 className="h-4 w-4 mr-1.5" />Insights</Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <QuickAddJobForm />

          {/* Dark mode toggle */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleTheme} title={isDark ? 'Switch to light' : 'Switch to dark'}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-medium">
                      {getInitials(user.email || '')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-0.5 leading-none">
                    <p className="font-medium text-sm">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
