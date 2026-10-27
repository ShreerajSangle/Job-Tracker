// POST → emails the signed-in user a PDF analysis of their pipeline.
import { verifySupabaseUser, json } from './_lib/auth';
import { ReportSkip, rest, sendApplicationAnalysis } from './_lib/reportService';

export const config = { maxDuration: 45 };
const COOLDOWN_MS = 15 * 60 * 1000;
const pending = new Set<string>();

export async function POST(request: Request): Promise<Response> {
  let user;
  try { user = await verifySupabaseUser(request.headers.get('authorization')); } catch { return json({ error: 'Unauthorized.' }, 401); }
  if (!user.email || !user.email_confirmed_at) return json({ error: 'A confirmed account email is required.' }, 400);

  try {
    const [state] = await rest<{ last_report_at: string | null }[]>(`report_state?user_id=eq.${user.id}&select=last_report_at`);
    const last = state?.last_report_at ? new Date(state.last_report_at).getTime() : 0;
    if (last && Date.now() - last < COOLDOWN_MS) {
      const retry = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000);
      return new Response(JSON.stringify({ error: 'You requested a report recently. Please wait before requesting another.' }), {
        status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(retry) },
      });
    }
    if (pending.has(user.id)) return json({ error: 'Your analysis is already being generated.' }, 409);
    pending.add(user.id);
    try {
      await sendApplicationAnalysis(user, { idempotencyKey: `application-analysis-${user.id}-${Math.floor(Date.now() / COOLDOWN_MS)}` });
    } finally { pending.delete(user.id); }
    return json({ ok: true });
  } catch (e) {
    if (e instanceof ReportSkip) {
      return json({ error: e.code === 'no_applications' ? 'Add at least one application before generating a report.' : 'A confirmed account email is required.' }, 400);
    }
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return json({ error: msg.startsWith('AI analysis') || msg.startsWith('Email') ? msg : 'Could not generate the report.' }, 503);
  }
}
