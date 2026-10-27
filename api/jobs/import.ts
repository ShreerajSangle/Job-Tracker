// POST { url } → structured job details for pre-filling the application form.
// Nothing is saved here; the client always shows the result for review.
import { verifySupabaseUser, json } from '../_lib/auth';
import { importJob } from '../_lib/extractJob';
import { rateLimited } from '../_lib/rateLimit';

export const config = { maxDuration: 30 };

export async function POST(request: Request): Promise<Response> {
  let user;
  try {
    user = await verifySupabaseUser(request.headers.get('authorization'));
  } catch {
    return json({ error: 'Unauthorized' }, 401);
  }
  const wait = rateLimited(`import:${user.id}`, 20, 60 * 60 * 1000);
  if (wait) return json({ error: 'Too many imports. Try again later.' }, 429);

  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const rawUrl = typeof body?.url === 'string' ? body.url.trim() : '';
  if (!rawUrl || rawUrl.length > 2048) return json({ error: 'A valid job URL is required.' }, 400);

  try {
    const result = await importJob(rawUrl);
    if (!result) return json({ error: 'Could not identify the job details from this page.' }, 422);
    return json(result);
  } catch {
    return json({ error: 'Could not import this job. Enter the details manually.' }, 422);
  }
}
