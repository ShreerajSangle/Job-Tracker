import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QuickAddJobForm } from '@/components/jobs/QuickAddJobForm';
import { useAuth } from '@/hooks/useAuth';
import { Briefcase, LogOut, LayoutDashboard, BarChart3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

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
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={location.pathname === '/dashboard'
                ? 'text-foreground bg-muted/50'
                : 'text-muted-foreground hover:text-foreground'}
            >
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={location.pathname === '/insights'
                ? 'text-foreground bg-muted/50'
                : 'text-muted-foreground hover:text-foreground'}
            >
              <Link to="/insights">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Insights
              </Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <QuickAddJobForm />
          
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
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
