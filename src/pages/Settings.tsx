import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, User, Lock, Trash2, Moon, Sun } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: 'Error updating password', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordLoading(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      // Delete all user jobs first (cascade should handle notes/history, but be explicit)
      await supabase.from('jobs').delete().eq('user_id', user!.id);
      // Delete the auth user via Supabase admin or RPC if available;
      // fallback: sign out and show confirmation
      const { error } = await supabase.rpc('delete_user' as never);
      if (error) {
        // If no delete_user RPC, sign out and inform user to contact support
        await signOut();
        toast({
          title: 'Account data deleted',
          description: 'Your job data has been removed. Contact support to fully delete your auth account.',
        });
        window.location.href = '/';
        return;
      }
      await signOut();
      toast({ title: 'Account deleted successfully' });
      window.location.href = '/';
    } catch {
      toast({ title: 'Error deleting account', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        <div className="space-y-6">

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Appearance
              </CardTitle>
              <CardDescription>Toggle light / dark mode</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                <div>
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground">Currently {theme} mode</p>
                </div>
                <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
                  {theme === 'dark'
                    ? <><Sun className="h-4 w-4" /> Switch to Light</>
                    : <><Moon className="h-4 w-4" /> Switch to Dark</>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" /> Account
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm font-medium mt-0.5">{user?.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Account ID</Label>
                <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{user?.id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Member since</Label>
                <p className="text-sm mt-0.5">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" /> Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password" type="password" placeholder="••••••••"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6} required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password" type="password" placeholder="••••••••"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6} required
                  />
                </div>
                <Button type="submit" disabled={passwordLoading} className="gap-2">
                  {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Keyboard shortcuts reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Keyboard Shortcuts</CardTitle>
              <CardDescription>Power user shortcuts on the Dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {[
                  ['/','Focus search bar'],
                  ['Esc','Close detail sheet'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-muted border border-border/60 text-xs font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <Trash2 className="h-4 w-4" /> Danger Zone
              </CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                <div>
                  <p className="text-sm font-medium">Sign out</p>
                  <p className="text-xs text-muted-foreground">You will be logged out immediately</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>Sign Out</Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-3">
                <div>
                  <p className="text-sm font-medium">Delete account</p>
                  <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all job tracking data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Yes, delete my account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
