// SSRF-hardened outbound fetch: resolve DNS once, reject any private/reserved
// address, then connect to that exact IP (Host/SNI preserved) so DNS rebinding
// cannot swap the target. Redirects are followed manually and re-checked.
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request as httpRequest, type IncomingHttpHeaders, type IncomingMessage } from 'node:http';
import { request as httpsRequest } from 'node:https';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;

export function isPrivateIp(address: string): boolean {
  const a = address.toLowerCase();
  if (a === '::' || a === '::1' || a.startsWith('::ffff:')) return true;
  if (a.startsWith('fc') || a.startsWith('fd')) return true;
  if (/^fe[89abcdef]/.test(a) || a.startsWith('ff')) return true;
  if (a.startsWith('2001:db8:')) return true;
  const p = a.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [x, y, z] = p;
  return (
    x === 10 || x === 127 || x === 0 ||
    (x === 169 && y === 254) ||
    (x === 172 && y >= 16 && y <= 31) ||
    (x === 192 && y === 168) ||
    (x === 100 && y >= 64 && y <= 127) ||
    (x === 192 && y === 0 && (z === 0 || z === 2)) ||
    (x === 198 && (y === 18 || y === 19)) ||
    (x === 198 && y === 51 && z === 100) ||
    (x === 203 && y === 0 && z === 113) ||
    x >= 224
  );
}

export interface PublicTarget { url: URL; address: string; family: 4 | 6 }
export interface PinnedResponse { status: number; headers: IncomingHttpHeaders; body: Buffer; finalUrl: string }
export interface FetchOptions { maxBytes?: number; accept?: string; headers?: Record<string, string> }

export async function resolvePublicTarget(rawUrl: string): Promise<PublicTarget> {
  const url = new URL(rawUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Unsupported URL');
  const literal = isIP(url.hostname.replace(/^\[|\]$/g, ''));
  const addresses = literal
    ? [{ address: url.hostname.replace(/^\[|\]$/g, ''), family: literal }]
    : await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw new Error('Private address');
  const sel = addresses[0];
  if (sel.family !== 4 && sel.family !== 6) throw new Error('Unsupported address family');
  return { url, address: sel.address, family: sel.family as 4 | 6 };
}

export const headerValue = (h: IncomingHttpHeaders, name: string): string => {
  const v = h[name.toLowerCase()];
  return Array.isArray(v) ? v[0] ?? '' : v ?? '';
};

function requestPinned(target: PublicTarget, opts: FetchOptions = {}): Promise<Omit<PinnedResponse, 'finalUrl'>> {
  return new Promise((resolve, reject) => {
    const maxBytes = opts.maxBytes ?? 1_000_000;
    const common = {
      hostname: target.address,
      family: target.family,
      port: target.url.port || undefined,
      method: 'GET',
      path: `${target.url.pathname}${target.url.search}`,
      headers: {
        Host: target.url.host,
        'User-Agent': 'Mozilla/5.0 (compatible; JobTracker/1.0)',
        Accept: opts.accept ?? 'text/html,application/xhtml+xml,text/plain;q=0.8',
        'Accept-Language': 'en-US,en;q=0.8',
        ...opts.headers,
      },
    };
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    const fail = (e: Error) => { if (settled) return; settled = true; clearTimeout(timer); reject(e); };
    const onResponse = (res: IncomingMessage) => {
      const chunks: Buffer[] = [];
      let total = 0;
      res.on('data', (c: Buffer | string) => {
        const b = Buffer.isBuffer(c) ? c : Buffer.from(c);
        total += b.length;
        if (total > maxBytes) { res.destroy(); fail(new Error('Response too large')); return; }
        chunks.push(b);
      });
      res.on('end', () => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) });
      });
      res.on('error', fail);
    };
    const req = target.url.protocol === 'https:'
      ? httpsRequest({ ...common, servername: target.url.hostname }, onResponse)
      : httpRequest(common, onResponse);
    timer = setTimeout(() => req.destroy(new Error('Request timed out')), REQUEST_TIMEOUT_MS);
    req.on('error', fail);
    req.end();
  });
}

export async function fetchPinned(rawUrl: string, opts?: FetchOptions): Promise<PinnedResponse> {
  let current = await resolvePublicTarget(rawUrl);
  for (let hops = 0; hops <= MAX_REDIRECTS; hops += 1) {
    const res = await requestPinned(current, opts);
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = headerValue(res.headers, 'location');
      if (!loc || hops === MAX_REDIRECTS) throw new Error('Too many redirects');
      current = await resolvePublicTarget(new URL(loc, current.url).toString());
      continue;
    }
    if (res.status < 200 || res.status >= 300) throw new Error('Page could not be loaded');
    return { ...res, finalUrl: current.url.toString() };
  }
  throw new Error('Unable to fetch page');
}
