import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate   = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 600);
    }
  };

  return (
    <div className="min-h-screen flex bg-[hsl(228,14%,7%)] overflow-hidden">

      {/* ── Left brand panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 relative overflow-hidden p-10">
        {/* Animated mesh background */}
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
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, hsl(200,60%,50%) 0%, transparent 70%)', animation: 'drift3 20s ease-in-out infinite alternate' }}
          />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(hsl(220,13%,83%) 1px,transparent 1px),linear-gradient(90deg,hsl(220,13%,83%) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-label="JobTracker logo">
              <rect width="36" height="36" rx="10" fill="hsl(220,55%,55%)" fillOpacity="0.15" />
              <rect x="1" y="1" width="34" height="34" rx="9" stroke="hsl(220,55%,55%)" strokeOpacity="0.3" strokeWidth="1" />
              <path d="M10 24 L14 14 L18 20 L22 12 L26 24" stroke="hsl(220,55%,65%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="26" cy="12" r="2.5" fill="hsl(220,55%,65%)" />
              <path d="M10 27 H26" stroke="hsl(220,55%,55%)" strokeOpacity="0.4" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span className="text-[hsl(220,13%,83%)] font-semibold text-lg tracking-tight">JobTracker</span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Track every
              <span className="block" style={{ background: 'linear-gradient(135deg, hsl(220,55%,72%) 0%, hsl(260,50%,72%) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                opportunity.
              </span>
            </h1>
            <p className="text-[hsl(220,13%,55%)] text-sm leading-relaxed max-w-xs">
              Stay on top of every application, interview, and offer — all in one clean, focused dashboard.
            </p>
          </div>

          {/* Stat counters */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '100%', label: 'Free forever' },
              { value: '∞',    label: 'Applications' },
              { value: '1',    label: 'Click to add' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border border-[hsl(225,10%,18%)] bg-[hsl(228,13%,10%)/60] backdrop-blur p-3 text-center">
                <p className="text-xl font-bold text-[hsl(220,55%,65%)]">{stat.value}</p>
                <p className="text-[10px] text-[hsl(220,10%,45%)] mt-0.5 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="relative z-10 text-[11px] text-[hsl(220,10%,35%)]">
          Built for job seekers who mean business.
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
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

          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-[hsl(220,13%,90%)] tracking-tight">Welcome back</h2>
            <p className="text-sm text-[hsl(220,10%,48%)]">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-[hsl(220,55%,65%)] hover:text-[hsl(220,55%,72%)] transition-colors font-medium">
                Sign up free
              </Link>
            </p>
          </div>

          {/* Form */}
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

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-[hsl(220,10%,55%)] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
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
            </div>

            {/* Submit */}
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
                Sign In <ArrowRight className="h-4 w-4" />
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

          <p className="text-center text-[11px] text-[hsl(220,10%,32%)]">
            By signing in you agree to our terms of service.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes drift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,60px) scale(1.15); } }
        @keyframes drift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-50px,-40px) scale(1.2); } }
        @keyframes drift3 { from { transform: translate(-50%,-50%) scale(1); } to { transform: translate(-50%,-50%) scale(1.3) rotate(30deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
