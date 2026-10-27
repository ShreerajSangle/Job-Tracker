// POST { lat, lon } | { city } → current weather + next 12 h from Open-Meteo (no API key).
// Proxied so the browser never contacts third parties and the CSP stays unchanged.
import { verifySupabaseUser, json } from './_lib/auth.js';
import { rateLimited } from './_lib/rateLimit.js';

export const config = { maxDuration: 15 };

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

async function getJson(url: string): Promise<Json> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return res.json();
}

export async function POST(request: Request): Promise<Response> {
  let user;
  try { user = await verifySupabaseUser(request.headers.get('authorization')); } catch { return json({ error: 'Unauthorized' }, 401); }
  if (rateLimited(`weather:${user.id}`, 120, 60 * 60 * 1000)) return json({ error: 'Too many requests' }, 429);

  const body = (await request.json().catch(() => null)) as { lat?: unknown; lon?: unknown; city?: unknown } | null;
  let lat = num(body?.lat), lon = num(body?.lon);
  let place = '';

  try {
    if (typeof body?.city === 'string' && body.city.trim()) {
      const g = await getJson(`https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&name=${encodeURIComponent(body.city.trim().slice(0, 80))}`);
      const hit = g?.results?.[0];
      if (!hit) return json({ error: 'City not found' }, 404);
      lat = hit.latitude; lon = hit.longitude;
      place = [hit.name, hit.country_code].filter(Boolean).join(', ');
    }
    if (lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) return json({ error: 'Location required' }, 400);
    lat = Math.round(lat * 100) / 100; lon = Math.round(lon * 100) / 100;

    const [w, rev] = await Promise.all([
      getJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m&hourly=temperature_2m&forecast_hours=12&timezone=auto`),
      place ? Promise.resolve(null) : getJson(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`).catch(() => null),
    ]);
    if (!place && rev) place = [rev.city || rev.locality, rev.countryCode].filter(Boolean).join(', ');

    return json({
      data: {
        place: place || 'Your location',
        lat, lon,
        temp: Math.round(w.current.temperature_2m),
        feels: Math.round(w.current.apparent_temperature),
        code: w.current.weather_code,
        isDay: w.current.is_day === 1,
        wind: Math.round(w.current.wind_speed_10m),
        hourly: (w.hourly?.temperature_2m ?? []).map((t: number) => Math.round(t)),
      },
    });
  } catch {
    return json({ error: 'Weather unavailable' }, 502);
  }
}
