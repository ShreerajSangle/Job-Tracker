import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, ArrowRight, Mail, RotateCcw } from 'lucide-react';

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
        {[1,2,3,4].map(i => (
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

export default function SignupPage() {
  const { signUp } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Use at least 6 characters.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const { error } = await signUp(email, password);
    if (error) {
      toast({ title: 'Could not resend', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email resent!' });
      setResendCooldown(60);
      const t = setInterval(() => {
        setResendCooldown(prev => { if (prev <= 1) { clearInterval(t); return 0; } return prev - 1; });
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex bg-[hsl(228,14%,7%)] overflow-hidden">

      {/* ── Left brand panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 relative overflow-hidden p-10">
        <div className="absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-[hsl(228,14%,9%)]" />
          <div
            className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, hsl(220,55%,55%) 0%, transparent 70%)', animation: 'drift1 12s ease-in-out infinite alternate' }}
          />
          <div
            className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, hsl(260,50%,55%) 0%, transparent 70%)', animation: 'drift2 16s ease-in-out infinite alternate' }}
          />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(hsl(220,13%,83%) 1px,transparent 1px),linear-gradient(90deg,hsl(220,13%,83%) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-label="JobTracker logo">
            <rect width="36" height="36" rx="10" fill="hsl(220,55%,55%)" fillOpacity="0.15" />
            <rect x="1" y="1" width="34" height="34" rx="9" stroke="hsl(220,55%,55%)" strokeOpacity="0.3" strokeWidth="1" />
            <path d="M10 24 L14 14 L18 20 L22 12 L26 24" stroke="hsl(220,55%,65%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="26" cy="12" r="2.5" fill="hsl(220,55%,65%)" />
            <path d="M10 27 H26" stroke="hsl(220,55%,55%)" strokeOpacity="0.4" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <span className="text-[hsl(220,13%,83%)] font-semibold text-lg tracking-tight">JobTracker</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Your job search,
              <span className="block" style={{ background: 'linear-gradient(135deg, hsl(220,55%,72%) 0%, hsl(260,50%,72%) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                organised.
              </span>
            </h1>
            <p className="text-[hsl(220,13%,55%)] text-sm leading-relaxed max-w-xs">
              Track applications, monitor deadlines, and get insights — all for free, forever.
            </p>
          </div>
          <ul className="space-y-2.5">
            {[
              'One-click job logging',
              'Automatic status tracking',
              'Deadline & interview reminders',
              'Insights on your search progress',
            ].map(item => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-[hsl(220,13%,60%)]">
                <div className="h-1.5 w-1.5 rounded-full bg-[hsl(220,55%,60%)] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[11px] text-[hsl(220,10%,35%)]">
          No credit card. No limits. Just your job search.
        </p>
      </div>

      {/* ── Right form / confirmation panel ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">

        {sent ? (
          /* ── Email confirmation screen ────────────────────────────── */
          <div
            className="w-full max-w-sm text-center space-y-6"
            style={{ animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
          >
            {/* Animated mail icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[hsl(225,10%,18%)] bg-[hsl(228,13%,10%)]" style={{ boxShadow: '0 0 40px hsl(220,55%,55%,0.15)' }}>
              <Mail className="h-9 w-9 text-[hsl(220,55%,65%)]" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[hsl(220,13%,90%)] tracking-tight">Check your inbox</h2>
              <p className="text-sm text-[hsl(220,10%,48%)] leading-relaxed">
                We sent a confirmation link to
              </p>
              <p className="text-sm font-semibold text-[hsl(220,55%,65%)] break-all">{email}</p>
              <p className="text-sm text-[hsl(220,10%,48%)]">
                Click the link in the email to activate your account.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-[hsl(225,10%,18%)] bg-[hsl(228,13%,10%)] text-sm text-[hsl(220,13%,70%)] hover:border-[hsl(220,55%,40%)] hover:text-[hsl(220,55%,65%)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend confirmation email'}
              </button>

              <p className="text-xs text-[hsl(220,10%,35%)]">
                Wrong email?{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-[hsl(220,55%,60%)] hover:text-[hsl(220,55%,72%)] transition-colors underline"
                >
                  Go back
                </button>
              </p>
            </div>

            <div className="rounded-xl border border-[hsl(225,10%,16%)] bg-[hsl(228,13%,9%)] p-4 text-left space-y-1">
              <p className="text-xs font-medium text-[hsl(220,10%,55%)]">📧 Didn’t receive it?</p>
              <ul className="text-[11px] text-[hsl(220,10%,38%)] space-y-0.5">
                <li>• Check your spam / junk folder</li>
                <li>• Make sure you typed your email correctly</li>
                <li>• Wait a minute and try resending</li>
              </ul>
            </div>
          </div>
        ) : (
          /* ── Sign up form ───────────────────────────────────────── */
          <div
            className="w-full max-w-sm space-y-8"
            style={{ animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
          >
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2.5 justify-center">
              <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="hsl(220,55%,55%)" fillOpacity="0.15" />
                <path d="M10 24 L14 14 L18 20 L22 12 L26 24" stroke="hsl(220,55%,65%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <circle cx="26" cy="12" r="2.5" fill="hsl(220,55%,65%)" />
              </svg>
              <span className="font-semibold text-[hsl(220,13%,83%)] tracking-tight">JobTracker</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-[hsl(220,13%,90%)] tracking-tight">Create your account</h2>
              <p className="text-sm text-[hsl(220,10%,48%)]">
                Already have one?{' '}
                <Link to="/login" className="text-[hsl(220,55%,65%)] hover:text-[hsl(220,55%,72%)] transition-colors font-medium">
                  Sign in
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-[hsl(220,10%,55%)] uppercase tracking-wider">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 rounded-lg border border-[hsl(225,10%,18%)] bg-[hsl(228,13%,10%)] px-3.5 text-sm text-[hsl(220,13%,83%)] placeholder:text-[hsl(220,10%,32%)] outline-none transition-all focus:border-[hsl(220,55%,55%)] focus:ring-2 focus:ring-[hsl(220,55%,55%)]/20"
                />
              </div>

              {/* Password + strength */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-[hsl(220,10%,55%)] uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full h-11 rounded-lg font-medium text-sm transition-all overflow-hidden mt-2"
                style={{
                  background: 'linear-gradient(135deg, hsl(220,55%,52%) 0%, hsl(240,50%,58%) 100%)',
                  color: 'hsl(220,20%,96%)',
                  boxShadow: '0 0 24px hsl(220,55%,55%,0.25), inset 0 1px 0 hsl(220,55%,70%,0.2)',
                }}
              >
                <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${
                  loading ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
                }`}>
                  Create Account <ArrowRight className="h-4 w-4" />
                </span>
                {loading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </span>
                )}
              </button>
            </form>

            <p className="text-center text-[11px] text-[hsl(220,10%,32%)]">
              By creating an account you agree to our terms of service.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes drift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,60px) scale(1.15); } }
        @keyframes drift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-50px,-40px) scale(1.2); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity:1; } 50% { transform: scale(1.08); opacity:0.8; } }
      `}</style>
    </div>
  );
}
