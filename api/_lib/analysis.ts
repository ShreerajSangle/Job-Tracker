// Deterministic pipeline metrics (no AI). Mirrors the reference tracker's definitions.
export type Status = 'bookmarked' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'ghosted' | 'withdrawn';
export interface AnalysisJob {
  id: string; role: string; company: string | null; status: Status; applied_on: string | null; created_at: string | null;
  location: string | null; source: string | null; rejected_stage_name: string | null;
}
export interface AnalysisStage {
  application_id: string; name: string; stage_type: string; position: number; state: string;
  started_at: string | null; completed_at: string | null; updated_at: string | null;
}
export interface Snapshot {
  total: number; tracked: number; active: number; interviewActivity: number; offers: number; stale: number; last30: number;
  interviewRate: number; offerRate: number; statusCounts: Record<string, number>;
  sources: { source: string; total: number; interviewActivity: number; offers: number }[];
  rejectionStages: { stage: string; count: number }[];
  monthly: { month: string; applications: number }[];
  recent: { role: string; company: string; status: Status; appliedAt: string | null; source: string; daysSinceActivity: number | null; stages: { name: string; state: string }[] }[];
}

const DAY = 86_400_000;
const STATUSES = ['bookmarked', 'applied', 'interviewing', 'offer', 'rejected', 'ghosted', 'withdrawn'];
const CANON: [string, RegExp][] = [
  ['LinkedIn', /^linked\s*in(?:\b|\.com)/i], ['Indeed', /^indeed(?:\b|\.)/i], ['Glassdoor', /^glass\s*door(?:\b|\.)/i],
  ['IrishJobs', /^irish\s*jobs?(?:\b|\.ie)/i], ['Jobs.ie', /^jobs?\.ie\b/i], ['RecruitIreland', /^recruit\s*ireland(?:\b|\.)/i],
];

const date = (v?: string | null) => { if (!v) return null; const d = new Date(v.length === 10 ? `${v}T00:00:00Z` : v); return Number.isNaN(d.getTime()) ? null : d; };
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
export const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
export const isLastUtcDayOfMonth = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).getUTCDate() === 1;

export function normalizeSource(v?: string | null) {
  const raw = v?.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (!raw) return { key: 'unknown', label: 'Unknown' };
  for (const [label, re] of CANON) if (re.test(raw)) return { key: label.toLowerCase(), label };
  const base = raw.split(/\s+(?:-|–|—|\|)\s+/, 1)[0]?.trim() || raw;
  return { key: base.toLocaleLowerCase('en').replace(/\s+/g, ' '), label: base };
}

export function buildSnapshot(jobs: AnalysisJob[], stages: AnalysisStage[], now = new Date()): Snapshot {
  const statusCounts: Record<string, number> = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const byApp = new Map<string, AnalysisStage[]>();
  stages.forEach((s) => byApp.set(s.application_id, [...(byApp.get(s.application_id) ?? []), s]));
  const months = new Map<string, number>();
  for (let i = 5; i >= 0; i -= 1) months.set(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))), 0);
  const sources = new Map<string, { source: string; total: number; interviewActivity: number; offers: number }>();
  const rej = new Map<string, number>();
  let interviewActivity = 0, stale = 0, last30 = 0;

  const prepared = jobs.map((j) => {
    statusCounts[j.status] = (statusCounts[j.status] ?? 0) + 1;
    const js = (byApp.get(j.id) ?? []).sort((a, b) => a.position - b.position);
    const hasInterview = j.status === 'interviewing' || j.status === 'offer' ||
      js.some((s) => s.position > 0 && s.stage_type !== 'application' && !['pending', 'skipped'].includes(s.state));
    if (hasInterview) interviewActivity += 1;
    const last = [j.applied_on, j.created_at, ...js.flatMap((s) => [s.started_at, s.completed_at, s.updated_at])]
      .map(date).filter((d): d is Date => !!d).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const since = last ? Math.max(0, Math.floor((now.getTime() - last.getTime()) / DAY)) : null;
    if ((j.status === 'applied' && since !== null && since >= 21) || (j.status === 'interviewing' && since !== null && since >= 14)) stale += 1;
    const applied = date(j.applied_on) ?? date(j.created_at);
    if (applied && now.getTime() - applied.getTime() <= 30 * DAY) last30 += 1;
    if (applied && months.has(monthKey(applied))) months.set(monthKey(applied), (months.get(monthKey(applied)) ?? 0) + 1);
    const src = normalizeSource(j.source);
    const row = sources.get(src.key) ?? { source: src.label, total: 0, interviewActivity: 0, offers: 0 };
    row.total += 1; if (hasInterview) row.interviewActivity += 1; if (j.status === 'offer') row.offers += 1;
    sources.set(src.key, row);
    const rs = j.rejected_stage_name?.trim() || js.find((s) => s.state === 'rejected')?.name?.trim();
    if (j.status === 'rejected' && rs) rej.set(rs, (rej.get(rs) ?? 0) + 1);
    return { role: j.role || 'Untitled role', company: j.company?.trim() || 'Unknown company', status: j.status, appliedAt: j.applied_on,
      source: src.label, daysSinceActivity: since, stages: js.map((s) => ({ name: s.name, state: s.state })), sort: applied?.getTime() ?? 0 };
  });

  const tracked = jobs.filter((j) => j.status !== 'bookmarked').length;
  return {
    total: jobs.length, tracked, active: statusCounts.applied + statusCounts.interviewing, interviewActivity,
    offers: statusCounts.offer, stale, last30, interviewRate: pct(interviewActivity, tracked), offerRate: pct(statusCounts.offer, interviewActivity),
    statusCounts,
    sources: [...sources.values()].sort((a, b) => b.total - a.total || b.interviewActivity - a.interviewActivity).slice(0, 8),
    rejectionStages: [...rej.entries()].map(([stage, count]) => ({ stage, count })).sort((a, b) => b.count - a.count).slice(0, 8),
    monthly: [...months.entries()].map(([month, applications]) => ({ month, applications })),
    recent: prepared.sort((a, b) => b.sort - a.sort).slice(0, 100).map(({ sort: _s, ...r }) => r),
  };
}

/** What the model may see: no email, resumes, JD text, notes, company or location. */
export function aiPayload(s: Snapshot) {
  return {
    metrics: { total: s.total, tracked: s.tracked, active: s.active, interviewActivity: s.interviewActivity, offers: s.offers, stale: s.stale,
      last30: s.last30, interviewRatePct: s.interviewRate, offerFromInterviewPct: s.offerRate },
    statusCounts: s.statusCounts, sources: s.sources, rejectionStages: s.rejectionStages, monthly: s.monthly,
    recent: s.recent.slice(0, 20).map((r) => ({ role: r.role.slice(0, 140), status: r.status, appliedAt: r.appliedAt, source: r.source,
      daysSinceActivity: r.daysSinceActivity, stages: r.stages.slice(0, 8) })),
  };
}
