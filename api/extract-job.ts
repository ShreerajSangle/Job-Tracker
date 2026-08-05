// Vercel Edge Function: given a job posting URL, fetches the page
// server-side (avoids browser CORS entirely) and asks Groq to extract
// structured fields for the "Add Job" form. The frontend always treats the
// result as a pre-fill suggestion — the user reviews/edits before saving,
// nothing is auto-saved from here.
import { verifySupabaseUser, json, corsHeaders } from './_lib/auth';
import { assertPublicHttpUrl, fetchPageText, extractWithGroq } from './_lib/extractJob';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    await verifySupabaseUser(req.headers.get('authorization'));

    const { url: rawUrl } = await req.json();
    if (!rawUrl || typeof rawUrl !== 'string') throw new Error('Missing "url" in request body');

    const url = assertPublicHttpUrl(rawUrl);
    const pageText = await fetchPageText(url);
    if (!pageText.trim()) throw new Error('Could not read any content from that page');

    const extracted = await extractWithGroq(pageText, url.hostname);
    return json({ data: extracted });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 400);
  }
}
