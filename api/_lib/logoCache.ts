// Persistent company → logo resolution cache (service-role only table).
const POSITIVE_TTL = 30 * 24 * 60 * 60 * 1000;
const NEGATIVE_TTL = 12 * 60 * 60 * 1000;

export interface LogoCacheRow { domain: string | null; official_url: string | null; logo_url: string | null; resolver_model: string | null }

function conf() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } } : null;
}

export const companyKey = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 200);

export async function readLogoCache(key: string): Promise<LogoCacheRow | null> {
  const c = conf();
  if (!c) return null;
  try {
    const q = `${c.url}/rest/v1/company_logo_cache?company_key=eq.${encodeURIComponent(key)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=domain,official_url,logo_url,resolver_model`;
    const res = await fetch(q, { headers: c.headers, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return ((await res.json()) as LogoCacheRow[])[0] ?? null;
  } catch { return null; }
}

export async function writeLogoCache(key: string, row: Partial<LogoCacheRow>): Promise<void> {
  const c = conf();
  if (!c) return;
  const positive = !!(row.domain || row.official_url || row.logo_url);
  try {
    await fetch(`${c.url}/rest/v1/company_logo_cache?on_conflict=company_key`, {
      method: 'POST',
      headers: { ...c.headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
      signal: AbortSignal.timeout(4000),
      body: JSON.stringify({
        company_key: key, ...row, resolved_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (positive ? POSITIVE_TTL : NEGATIVE_TTL)).toISOString(),
      }),
    });
  } catch { /* cache is best-effort */ }
}
