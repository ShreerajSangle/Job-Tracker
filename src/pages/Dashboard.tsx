import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { PageShell, Surface } from '@/components/Surface';
import { useApplications } from '@/features/applications/queries';
import { STATUS_STYLE, STATUSES } from '@/features/applications/types';
import { useResumes } from '@/features/resumes/queries';
import { usageByResume } from '@/features/resumes/usage';
import { useCounterStats } from '@/features/stats/useCounterStats';
import { useDaysLeft } from '@/features/stats/useDaysLeft';
import { parseDay, todayISO } from '@/lib/format';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { needsFollowUp } from '@/features/applications/followUp';

const label = 'font-mono text-[0.75rem] uppercase tracking-[0.04em] text-ink-2';
const num = 'font-mono text-[clamp(2.25rem,5vw,3.5rem)] leading-none tracking-[-0.02em] tabular-nums';

function weekStart(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.getTime();
}

function Ring({ value }: { value: number }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36" role="img" aria-label={`${Math.round(value * 100)}% interview rate`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--surface-3))" strokeWidth="6" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--bordo-hi))" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 600ms var(--ease-out)' }} />
      <text x="60" y="62" textAnchor="middle" className="fill-cream font-mono" fontSize="24">{Math.round(value * 100)}%</text>
      <text x="60" y="80" textAnchor="middle" className="fill-ink-2 font-mono" fontSize="8" letterSpacing="0.5">INTERVIEW RATE</text>
    </svg>
  );
}

export default function Dashboard() {
  const { data: apps = [] } = useApplications();
  const { data: stats } = useCounterStats();
  const { data: resumes = [] } = useResumes();
  const { daysLeft } = useDaysLeft();
  useDocumentTitle('Dashboard');
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const today = todayISO();
  const todayCount = apps.filter((a) => a.applied_on === today).length;

  const thisWeek = weekStart(new Date());
  const weeks = Array.from({ length: 5 }, (_, i) => thisWeek - (4 - i) * 7 * 864e5);
  const weekly = weeks.map((w) => apps.filter((a) => weekStart(parseDay(a.applied_on)) === w).length);
  const maxWeek = Math.max(1, ...weekly);

  const byStatus = STATUSES.map((s) => ({ s, n: apps.filter((a) => a.status === s).length }));
  const followUps = apps.filter((a) => needsFollowUp(a)).length;
  const rate = stats && stats.applied ? stats.interviews / stats.applied : 0;

  const usage = usageByResume(resumes, apps);
  const topResumes = resumes
    .map((r) => ({ r, u: usage.get(r.id) ?? { sent: 0, interviews: 0 } }))
    .sort((a, b) => b.u.sent - a.u.sent)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageShell>
        <div className="mb-6">
          <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.02em] text-cream">{greeting}</h1>
          <p className="text-sm text-ink-2">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <Surface className="reveal flex min-h-[11rem] flex-col justify-between bg-green p-6 md:col-span-4">
            <p className={label}>Applied today</p>
            <div className="flex items-end justify-between">
              <span className={`${num} text-cream`}>{todayCount}</span>
              <span className="font-mono text-sm text-ink-2">{daysLeft === null ? 'set end date on /' : `${daysLeft} days left`}</span>
            </div>
          </Surface>

          <Surface className="reveal flex min-h-[11rem] flex-col justify-between p-6 md:col-span-4">
            <p className={label}>Applied</p>
            <div className="flex items-end justify-between">
              <span className={`${num} text-green-ink`}>{stats?.applied ?? '–'}</span>
              <span className="font-mono text-sm text-ink-2">{stats?.offers ?? 0} offers</span>
            </div>
          </Surface>

          <Surface className="reveal flex min-h-[11rem] flex-col justify-between p-6 md:col-span-4">
            <p className={label}>Rejections</p>
            <div className="flex items-end justify-between">
              <span className={`${num} text-bordo-ink`}>{stats?.rejections ?? '–'}</span>
              <span className="font-mono text-sm text-ink-2">{stats?.interviews ?? 0} interviews</span>
            </div>
          </Surface>

          <Surface className="reveal p-6 md:col-span-7">
            <p className={label}>Applications per week</p>
            <div className="mt-6 flex h-40 items-end gap-3" role="img" aria-label={`Applications per week: ${weekly.join(', ')}`}>
              {weekly.map((n, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <span className="font-mono text-xs text-ink-2">{n}</span>
                  <div
                    className={`w-full rounded-t-[6px] ${i === weekly.length - 1 ? 'bg-green-ink' : 'bg-surface-3'}`}
                    style={{ height: `${Math.max(4, (n / maxWeek) * 100)}%`, transition: 'height 600ms var(--ease-out)' }}
                  />
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="reveal flex items-center justify-center p-6 md:col-span-5">
            <Ring value={rate} />
          </Surface>

          <Surface className="reveal p-6 md:col-span-4">
            <p className={label}>Pipeline</p>
            <ul className="mt-5 space-y-3">
              {byStatus.map(({ s, n }) => (
                <li key={s} className="flex items-center justify-between text-sm">
                  <span className="text-cream">{STATUS_STYLE[s].label}</span>
                  <span className="font-mono tabular-nums text-ink-2">{n}</span>
                </li>
              ))}
            </ul>
            {followUps > 0 && <p className="mt-4 text-xs text-cream-dim">{followUps} to follow up</p>}
          </Surface>

          <Surface className="reveal p-6 md:col-span-4">
            <p className={label}>Resume performance</p>
            {topResumes.length === 0 ? (
              <p className="mt-5 text-sm text-ink-2">Link a resume to an application to see results.</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {topResumes.map(({ r, u }) => (
                  <li key={r.id} className="text-sm">
                    <div className="flex justify-between"><span className="truncate text-cream">{r.name}</span>
                      <span className="font-mono tabular-nums text-ink-2">{u.interviews}/{u.sent}</span></div>
                    <div className="mt-1.5 h-1 rounded-full bg-surface-3">
                      <div className="h-1 rounded-full bg-bordo-hi" style={{ width: `${u.sent ? (u.interviews / u.sent) * 100 : 0}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Surface>

          <div className="grid gap-3 md:col-span-4">
            <Link to="/applications" className="reveal group flex items-end justify-between rounded-[var(--r-md)] bg-cream-dim p-6 text-green transition-transform active:scale-[0.98]">
              <span className="font-display text-2xl font-semibold leading-tight tracking-[-0.01em]">Applications<br /><span className="font-mono text-sm font-normal">{apps.length} total</span></span>
              <ArrowUpRight className="h-6 w-6 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link to="/resumes" className="reveal group flex items-end justify-between rounded-[var(--r-md)] bg-bordo p-6 text-cream transition-transform active:scale-[0.98]">
              <span className="font-display text-2xl font-semibold leading-tight tracking-[-0.01em]">Resumes<br /><span className="font-mono text-sm font-normal">{resumes.length} on file</span></span>
              <ArrowUpRight className="h-6 w-6 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </PageShell>
    </div>
  );
}
