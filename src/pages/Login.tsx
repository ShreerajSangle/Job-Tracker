import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { AuthShell, authButton, authInput } from '@/components/AuthShell';

type Mode = 'signin' | 'forgot' | 'sent';

export default function Login() {
  const { signIn, resetPasswordForEmail } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === 'signin') {
      const { error } = await signIn(email.trim(), password);
      if (error) toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
      else navigate('/', { replace: true });
    } else {
      const { error } = await resetPasswordForEmail(email.trim());
      if (error) toast({ title: 'Could not send reset email', description: error.message, variant: 'destructive' });
      else setMode('sent');
    }
    setBusy(false);
  };

  if (mode === 'sent') {
    return (
      <AuthShell subtitle="Check your email">
        <p className="text-center text-sm text-ink-2">If an account exists for {email}, a reset link is on its way.</p>
        <button onClick={() => setMode('signin')} className="mt-6 w-full text-center text-sm text-cream-dim hover:underline">Back to sign in</button>
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle={mode === 'signin' ? 'Sign in' : 'Reset password'}>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" required autoFocus autoComplete="email" placeholder="Email" aria-label="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} className={authInput} />
        {mode === 'signin' && (
          <input type="password" required autoComplete="current-password" placeholder="Password" aria-label="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} className={authInput} />
        )}
        <button type="submit" disabled={busy} className={authButton}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Send reset link'}
        </button>
      </form>
      <button onClick={() => setMode(mode === 'signin' ? 'forgot' : 'signin')}
        className="mt-5 w-full text-center text-sm text-ink-2 hover:text-cream">
        {mode === 'signin' ? 'Forgot password?' : 'Back to sign in'}
      </button>
    </AuthShell>
  );
}
