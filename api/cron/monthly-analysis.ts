// Vercel Cron (0 18 28-31 * *): sends only on the real last UTC day of the month,
// once per user per month, to confirmed users who opted in.
import { timingSafeEqual } from 'node:crypto';
import { isLastUtcDayOfMonth, monthKey } from '../_lib/analysis';
import { admin, ReportSkip, rest, sendApplicationAnalysis, type ReportUser } from '../_lib/reportService';

export const config = { maxDuration: 300 };

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return reply({ error: 'CRON_SECRET is not configured.' }, 503);
  if (!same(request.headers.get('authorization') ?? '', `Bearer ${secret}`)) return reply({ error: 'Unauthorized' }, 401);

  const now = new Date();
  if (!isLastUtcDayOfMonth(now)) return reply({ skipped: 'not_last_day' });
  const period = monthKey(now);

  const opted = await rest<{ user_id: string }[]>('user_settings?monthly_analysis_enabled=eq.true&select=user_id');
  const done = new Set((await rest<{ user_id: string }[]>(`report_state?monthly_last_period=eq.${period}&select=user_id`)).map((r) => r.user_id));
  const todo = opted.map((o) => o.user_id).filter((id) => !done.has(id));

  const { url, headers } = admin();
  const out = { sent: 0, skipped: 0, failed: [] as string[] };
  const queue = [...todo];
  const worker = async () => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      try {
        const res = await fetch(`${url}/auth/v1/admin/users/${id}`, { headers });
        if (!res.ok) throw new Error('user lookup failed');
        const user = (await res.json()) as ReportUser;
        await sendApplicationAnalysis({ ...user, id }, { period, idempotencyKey: `monthly-application-analysis-${id}-${period}` });
        out.sent += 1;
      } catch (e) {
        if (e instanceof ReportSkip) out.skipped += 1; else if (out.failed.length < 20) out.failed.push(id);
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return reply({ period, ...out }, out.failed.length ? 207 : 200);
}
