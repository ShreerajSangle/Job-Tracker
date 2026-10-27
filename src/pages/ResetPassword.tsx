import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { AuthShell, authButton, authInput } from '@/components/AuthShell';

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast({ title: 'Password too short', description: 'Use at least 8 characters.', variant: 'destructive' });
    if (password !== confirm) return toast({ title: 'Passwords do not match', variant: 'destructive' });
    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) {
      toast({ title: 'Could not set password', description: `${error.message} — the link may have expired. Request a new one from the sign-in page.`, variant: 'destructive' });
      return;
    }
    toast({ title: 'Password updated' });
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthShell subtitle="Choose a password">
      <form onSubmit={submit} className="space-y-3">
        <input type="password" required autoFocus autoComplete="new-password" placeholder="New password" aria-label="New password"
          value={password} onChange={(e) => setPassword(e.target.value)} className={authInput} />
        <input type="password" required autoComplete="new-password" placeholder="Confirm password" aria-label="Confirm password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} className={authInput} />
        <button type="submit" disabled={busy} className={authButton}>{busy ? 'Please wait…' : 'Save password'}</button>
      </form>
    </AuthShell>
  );
}
