import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { PageShell, Surface } from '@/components/Surface';
import { useApplications } from '@/features/applications/queries';
import { STATUS_STYLE, STATUSES } from '@/features/applications/types';
import { useResumes } from '@/features/resumes/queries';
import { useCounterStats } from '@/features/stats/useCounterStats';
import { useDaysLeft } from '@/features/stats/useDaysLeft';
import { parseDay, todayISO } from '@/lib/format';
import { greetingFor } from '@/features/dashboard/greeting';
import { WeatherTile } from '@/features/dashboard/WeatherTile';
import { useCountUp } from '@/features/stats/useCountUp';
import { displayName } from '@/lib/userName';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { weeklyCounts } from '@/features/stats/weekly';
import { needsFollowUp } from '@/features/applications/followUp';

const label = 'font-mono text-[0.75rem] uppercase tracking-[0.04em] text-ink-2';
const num = 'font-mono text-[clamp(2.25rem,5vw,3.5rem)] leading-none tracking-[-0.02em] tabular-nums';

function Ring({ value }: { value: number }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36" role="img" aria-label={`${Math.round(value * 100)}% interview rate`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--surface-3))" strokeWidth="6" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--bordo-hi))" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 600ms var(--ease-out)' }} />
      <text x="60" y="68" textAnchor="middle" className="fill-cream font-mono" fontSize="26">{Math.round(value * 100)}%</text>
    </svg>
  );
}

export default function Dashboard() {
  const { data: apps = [] } = useApplications();
  const { data: stats } = useCounterStats();
  const { data: resumes = [] } = useResumes();
  const { daysLeft } = useDaysLeft();
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);
  const greeting = greetingFor(now, displayName(user));

  const today = todayISO();
  const todayCount = apps.filter((a) => a.applied_on === today).length;
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  const yesterdayCount = apps.filter((a) => parseDay(a.applied_on).getTime() === new Date(yd.getFullYear(), yd.getMonth(), yd.getDate()).getTime()).length;
  const animToday = useCountUp(todayCount);
  const animApplied = useCountUp(stats?.applied);
  const animRej = useCountUp(stats?.rejections);

  const weeks = weeklyCounts(apps.map((a) => parseDay(a.applied_on)), new Date(), 6);
  const thisWeekCount = weeks[weeks.length - 1].count;
  const diff = todayCount - yesterdayCount;
  const delta = diff === 0 ? 'same as yesterday' : `${diff > 0 ? '+' : ''}${diff} vs yesterday`;
  const maxWeek = Math.max(1, ...weeks.map((w) => w.count));

  const byStatus = STATUSES.map((s) => ({ s, n: apps.filter((a) => a.status === s).length }));
  const maxStatus = Math.max(1, ...byStatus.map((x) => x.n));
  const followUps = apps.filter((a) => needsFollowUp(a)).length;
  const rate = stats && stats.applied ? stats.interviews / stats.applied : 0;

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />
      <PageShell>
        <div className="mb-6">
          <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.02em] text-cream">{greeting}</h1>
          <p className="text-sm text-ink-2">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <Surface className="reveal flex min-h-[9rem] sm:min-h-[11rem] flex-col justify-between bg-green p-6 md:col-span-4">
            <p className={label}>Applied today</p>
            <div className="flex items-end justify-between">
              <span className={`${num} text-cream`}>{animToday}</span>
              <span className="text-right font-mono text-sm text-ink-2">{delta}<br />{daysLeft === null ? 'set end date on /' : `${daysLeft} days left`}</span>
            </div>
          </Surface>

          <Surface className="reveal flex min-h-[9rem] sm:min-h-[11rem] flex-col justify-between p-6 md:col-span-4">
            <p className={label}>Applied</p>
            <div className="flex items-end justify-between">
              <span className={`${num} text-green-ink`}>{stats ? animApplied : '–'}</span>
              <span className="text-right font-mono text-sm text-ink-2">{thisWeekCount} this week<br />{stats?.offers ?? 0} offers</span>
            </div>
          </Surface>

          <Surface className="reveal flex min-h-[9rem] sm:min-h-[11rem] flex-col justify-between p-6 md:col-span-4">
            <p className={label}>Rejections</p>
            <div className="flex items-end justify-between">
              <span className={`${num} text-bordo-ink`}>{stats ? animRej : '–'}</span>
              <span className="text-right font-mono text-sm text-ink-2">{stats?.interviews ?? 0} interviews</span>
            </div>
          </Surface>

          <Surface className="reveal p-6 md:col-span-7">
            <p className={label}>Applications per week</p>
            <div
              className="mt-6 flex h-40 items-stretch gap-3 border-b border-line"
              role="img"
              aria-label={`Applications per week: ${weeks.map((w) => `${w.label} ${w.count}`).join(', ')}`}
            >
              {weeks.map((w, i) => {
                const h = w.count === 0 ? 6 : Math.max(10, Math.round((w.count / maxWeek) * 112));
                const current = i === weeks.length - 1;
                return (
                  <div key={w.weekStart} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    {w.count > 0 && <span className="font-mono text-xs tabular-nums text-ink-2">{w.count}</span>}
                    <div
                      className={`w-full rounded-t-[6px] ${current ? 'bg-green-ink' : 'bg-surface-3'} ${w.count === 0 ? 'opacity-50' : ''}`}
                      style={{ height: `${h}px`, transition: 'height 600ms var(--ease-out)' }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-3" aria-hidden="true">
              {weeks.map((w) => (
                <span key={w.weekStart} className="flex-1 text-center font-mono text-[0.6875rem] text-ink-2">{w.label}</span>
              ))}
            </div>
          </Surface>

          <Surface className="reveal flex flex-col justify-between gap-4 p-6 md:col-span-5">
            <p className={label}>Interview rate</p>
            <div className="flex items-center justify-center"><Ring value={rate} /></div>
            <p className="text-center font-mono text-xs text-ink-2">{stats?.interviews ?? 0} interviews from {stats?.applied ?? 0} applications</p>
          </Surface>

          <Surface className="reveal p-6 md:col-span-4">
            <p className={label}>Pipeline</p>
            <ul className="mt-5 space-y-3">
              {byStatus.map(({ s: st, n }) => (
                <li key={st} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-cream">{STATUS_STYLE[st].label}</span>
                    <span className="font-mono tabular-nums text-ink-2">{n}</span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-surface-3">
                    <div className={`h-1 rounded-full ${STATUS_STYLE[st].cls.startsWith('bg-surface-3') ? 'bg-ink-2' : STATUS_STYLE[st].cls.split(' ')[0]}`}
                      style={{ width: `${n === 0 ? 0 : Math.max(4, (n / maxStatus) * 100)}%`, transition: 'width 600ms var(--ease-out)' }} />
                  </div>
                </li>
              ))}
            </ul>
            {followUps > 0 && <p className="mt-4 text-xs text-cream-dim">{followUps} to follow up</p>}
          </Surface>

          <WeatherTile />

          <div className="grid gap-3 md:col-span-4">
            <Link to="/" className="reveal group flex items-end justify-between rounded-[var(--r-md)] bg-cream-dim p-6 text-green transition-transform active:scale-[0.98]">
              <span className="font-display text-2xl font-semibold leading-tight tracking-[-0.01em]">Job Application Counter<br /><span className="font-mono text-sm font-normal">{stats?.applied ?? '–'} applied</span></span>
              <ArrowUpRight className="h-6 w-6 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link to="/resumes" className="reveal group flex items-end justify-between rounded-[var(--r-md)] bg-bordo p-6 text-cream transition-transform active:scale-[0.98]">
              <span className="font-display text-2xl font-semibold leading-tight tracking-[-0.01em]">Total Resumes<br /><span className="font-mono text-sm font-normal">{resumes.length}</span></span>
              <ArrowUpRight className="h-6 w-6 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </PageShell>
    </div>
  );
}
