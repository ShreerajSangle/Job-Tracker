// GET ?company=Name → the company's logo bytes (proxied from our origin), or 404.
import { verifySupabaseUser } from './_lib/auth.js';
import { findCompanyLogo } from './_lib/logo.js';
import { rateLimited } from './_lib/rateLimit.js';

export const config = { maxDuration: 30 };

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'private, no-store' } });

export async function GET(request: Request): Promise<Response> {
  let user;
  try { user = await verifySupabaseUser(request.headers.get('authorization')); } catch { return text('Unauthorized', 401); }
  if (rateLimited(`logo:${user.id}`, 120, 60 * 60 * 1000)) return text('Too many requests', 429);
  const company = new URL(request.url).searchParams.get('company')?.trim().slice(0, 200) ?? '';
  if (!company) return text('company is required', 400);
  const logo = await findCompanyLogo(company).catch(() => null);
  if (!logo) return text('Not found', 404);
  return new Response(new Uint8Array(logo.bytes), {
    headers: {
      'Content-Type': logo.type,
      'Cache-Control': 'private, max-age=604800, stale-while-revalidate=86400',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
