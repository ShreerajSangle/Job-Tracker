import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { callApi } from '@/lib/callApi';

export interface Weather {
  place: string; lat: number; lon: number; temp: number; feels: number;
  code: number; isDay: boolean; wind: number; hourly: number[];
}
type Where = { lat: number; lon: number } | { city: string };

const KEY = 'jt-weather-where';
const read = (): Where | null => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; }
};
const write = (w: Where) => { try { localStorage.setItem(KEY, JSON.stringify(w)); } catch { /* storage unavailable */ } };

/** Location comes from the browser (once, remembered) or a typed city; data from /api/weather. */
export function useWeather() {
  const [where, setWhere] = useState<Where | null>(read);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (where) return;
    if (!('geolocation' in navigator)) { setDenied(true); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { const w = { lat: p.coords.latitude, lon: p.coords.longitude }; write(w); setWhere(w); },
      () => setDenied(true),
      { maximumAge: 30 * 60_000, timeout: 10_000 },
    );
  }, [where]);

  const setCity = useCallback((city: string) => { const w = { city }; write(w); setWhere(w); setDenied(false); }, []);

  const query = useQuery({
    queryKey: ['weather', where],
    enabled: !!where,
    staleTime: 10 * 60_000,
    retry: 1,
    queryFn: async () => {
      const r = await callApi<Weather>('/api/weather', where);
      if ('error' in r) throw new Error(r.error);
      return r.data;
    },
  });
  return { ...query, needsCity: !where && denied, setCity, error: query.error as Error | null };
}
