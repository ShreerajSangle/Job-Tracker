import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['', 'hsl(0,50%,52%)', 'hsl(38,50%,52%)', 'hsl(38,50%,52%)', 'hsl(152,45%,45%)'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : 'hsl(225,10%,18%)' }}
          />
        ))}
      </div>
      <p className="text-[11px]" style={{ color: colors[score] }}>{labels[score]}</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword]  = useState('');
  const [showPw,          setShowPw]           = useState(false);
  const [loading,         setLoading]          = useState(false);
  const [success,         setSuccess]          = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: 'Password too short', description: 'Use at least 8 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      toast({
        title: 'Could not reset password',
        description: `${error.message} — the reset link may have expired. Request a new one from the sign-in page.`,
        variant: 'destructive',
      });
    } else {
      setSuccess(true);
      toast({ title: 'Password updated' });
      setTimeout(() => navigate('/dashboard'), 800);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(228,14%,7%)] p-6">
      <div className="w-full max-w-sm space-y-8" style={{ animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
        <div className="flex items-center gap-2.5 justify-center">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="hsl(220,55%,55%)" fillOpacity="0.15" />
            <path d="M10 24 L14 14 L18 20 L22 12 L26 24" stroke="hsl(220,55%,65%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="26" cy="12" r="2.5" fill="hsl(220,55%,65%)" />
          </svg>
          <span className="font-semibold text-[hsl(220,13%,83%)] tracking-tight">JobTracker</span>
        </div>

        <div className="space-y-1.5 text-center">
          <h2 className="text-2xl font-bold text-[hsl(220,13%,90%)] tracking-tight">Choose a new password</h2>
          <p className="text-sm text-[hsl(220,10%,48%)]">
            Enter and confirm your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-xs font-medium text-[hsl(220,10%,55%)] uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full h-11 rounded-lg border border-[hsl(225,10%,18%)] bg-[hsl(228,13%,10%)] px-3.5 pr-10 text-sm text-[hsl(220,13%,83%)] placeholder:text-[hsl(220,10%,32%)] outline-none transition-all focus:border-[hsl(220,55%,55%)] focus:ring-2 focus:ring-[hsl(220,55%,55%)]/20"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(220,10%,40%)] hover:text-[hsl(220,10%,60%)] transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-xs font-medium text-[hsl(220,10%,55%)] uppercase tracking-wider">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className="w-full h-11 rounded-lg border border-[hsl(225,10%,18%)] bg-[hsl(228,13%,10%)] px-3.5 text-sm text-[hsl(220,13%,83%)] placeholder:text-[hsl(220,10%,32%)] outline-none transition-all focus:border-[hsl(220,55%,55%)] focus:ring-2 focus:ring-[hsl(220,55%,55%)]/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="relative w-full h-11 rounded-lg font-medium text-sm transition-all overflow-hidden"
            style={{
              background: success
                ? 'hsl(152,45%,35%)'
                : 'linear-gradient(135deg, hsl(220,55%,52%) 0%, hsl(240,50%,58%) 100%)',
              color: 'hsl(220,20%,96%)',
              boxShadow: success ? 'none' : '0 0 24px hsl(220,55%,55%,0.25), inset 0 1px 0 hsl(220,55%,70%,0.2)',
            }}
          >
            <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${
              loading || success ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
            }`}>
              Update Password <ArrowRight className="h-4 w-4" />
            </span>
            {loading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </span>
            )}
            {success && (
              <span className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              </span>
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
