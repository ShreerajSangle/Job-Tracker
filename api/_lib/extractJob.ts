const FETCH_TIMEOUT_MS = 8_000;
const MAX_HTML_BYTES = 2_000_000; // 2 MB — plenty for a job posting page
const MAX_TEXT_CHARS = 4_000; // keeps the Groq prompt small and fast — a job posting rarely needs more
// Small + fast model: job postings are short and the schema is simple, so
// the extra quality of the 70B model isn't worth several extra seconds of
// latency for this use case.
const GROQ_MODEL = 'llama-3.1-8b-instant';

export interface ExtractedJob {
  job_title: string | null;
  company_name: string | null;
  location: string | null;
  job_description: string | null;
  salary_range: string | null;
  source: string | null;
}

/**
 * Best-effort SSRF guard: this function fetches a user-supplied URL
 * server-side, so it must not be usable to reach internal/private network
 * targets (loopback, link-local / cloud metadata, RFC1918 ranges, and their
 * IPv6 equivalents). This is a hostname-level check, not a DNS-resolution
 * check, so it won't catch DNS rebinding — acceptable for this app's threat
 * model, but worth knowing.
 */
function isPrivateIpv4(ip: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!match) return false;
  const [a, b] = [Number(match[1]), Number(match[2])];
  return (
    a === 127 || // loopback
    a === 10 || // 10.0.0.0/8
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) || // 192.168.0.0/16
    (a === 169 && b === 254) || // link-local / cloud metadata
    a === 0
  );
}

function isPrivateOrReservedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (['localhost', 'metadata.google.internal'].includes(host)) return true;
  if (host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (isPrivateIpv4(host)) return true;

  // IPv6 literals are bracketed by the URL parser, e.g. "[::1]" — strip
  // the brackets before checking.
  if (host.startsWith('[') && host.endsWith(']')) {
    const ip = host.slice(1, -1);
    if (ip === '::1' || ip === '::') return true; // loopback / unspecified

    // IPv4-mapped IPv6 (::ffff:a.b.c.d or ::ffff:HHHH:HHHH) — unwrap and
    // re-check as an IPv4 address.
    const mappedDotted = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(ip);
    if (mappedDotted) return isPrivateIpv4(mappedDotted[1]);
    const mappedHex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(ip);
    if (mappedHex) {
      const hi = parseInt(mappedHex[1], 16);
      const lo = parseInt(mappedHex[2], 16);
      const dotted = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
      return isPrivateIpv4(dotted);
    }

    const firstGroup = ip.split(':')[0];
    if (/^f[cd][0-9a-f]{2}$/.test(firstGroup)) return true; // fc00::/7 unique local
    if (/^fe[89ab][0-9a-f]$/.test(firstGroup)) return true; // fe80::/10 link-local
  }
  return false;
}

export function assertPublicHttpUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('URL must use http or https');
  }
  if (isPrivateOrReservedHost(url.hostname)) {
    throw new Error('That URL is not allowed');
  }
  return url;
}

/** Strips a job posting page down to plain, readable text for the LLM prompt. */
export function htmlToReadableText(html: string): string {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(withoutNoise);
  const title = titleMatch ? titleMatch[1] : '';

  const text = withoutNoise
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return `${title}\n\n${text}`.slice(0, MAX_TEXT_CHARS);
}

export async function fetchPageText(url: URL): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobTrackerBot/1.0; +https://github.com)',
        Accept: 'text/html',
      },
    });
    if (!res.ok) throw new Error(`Page returned ${res.status}`);

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error('URL did not return an HTML page');
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Empty response body');
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_HTML_BYTES) { reader.cancel(); break; }
      chunks.push(value);
    }
    const html = new TextDecoder().decode(
      chunks.reduce((acc, c) => new Uint8Array([...acc, ...c]), new Uint8Array()),
    );
    return htmlToReadableText(html);
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractWithGroq(pageText: string, sourceHost: string): Promise<ExtractedJob> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error('AI extraction is not configured (missing GROQ_API_KEY)');

  const prompt = `You extract structured job-posting details from raw page text. Respond with ONLY a JSON object (no markdown, no commentary) matching exactly this shape:
{"job_title": string|null, "company_name": string|null, "location": string|null, "job_description": string|null, "salary_range": string|null, "source": string|null}

Rules:
- job_description: a short 2-4 sentence summary of the role, not the full posting.
- salary_range: a short string like "$120,000 - $150,000" if mentioned, otherwise null.
- source: infer a short label for where this was posted (e.g. "LinkedIn", "Greenhouse", "Company site") from the page content/domain "${sourceHost}".
- Use null for any field you cannot confidently determine. Never invent details that aren't in the text.

Page text:
"""
${pageText}
"""`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Groq request failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned an empty response');

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Could not parse the extracted job details');
  }

  const p = parsed as Record<string, unknown>;
  const asStringOrNull = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  return {
    job_title: asStringOrNull(p.job_title),
    company_name: asStringOrNull(p.company_name),
    location: asStringOrNull(p.location),
    job_description: asStringOrNull(p.job_description),
    salary_range: asStringOrNull(p.salary_range),
    source: asStringOrNull(p.source),
  };
}
