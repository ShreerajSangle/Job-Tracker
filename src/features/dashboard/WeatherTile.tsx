import { useState } from 'react';
import { Cloud, CloudFog, CloudLightning, CloudRain, Moon, Snowflake, Sun, type LucideIcon } from 'lucide-react';
import { Surface } from '@/components/Surface';
import { describeWeather, type WeatherKind } from './weatherCodes';
import { useWeather } from './useWeather';

const label = 'font-mono text-[0.75rem] uppercase tracking-[0.04em] text-ink-2';
const ICONS: Record<WeatherKind, LucideIcon> = {
  clear: Sun, cloud: Cloud, fog: CloudFog, rain: CloudRain, snow: Snowflake, storm: CloudLightning,
};

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values), span = Math.max(1, max - min);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24}`).join(' ');
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full" role="img" aria-label={`Next 12 hours: ${min}° to ${max}°`}>
      <polyline points={pts} fill="none" stroke="hsl(var(--green-ink))" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WeatherTile() {
  const { data, isLoading, error, needsCity, setCity } = useWeather();
  const [city, setCityText] = useState('');
  const askCity = needsCity || (error && /not found/i.test(error.message));

  return (
    <Surface className="reveal flex min-h-[15rem] flex-col justify-between p-6 md:col-span-4">
      <p className={label}>Weather{data ? ` · ${data.place}` : ''}</p>
      {data ? (() => {
        const d = describeWeather(data.code);
        const Icon = data.isDay || d.kind !== 'clear' ? ICONS[d.kind] : Moon;
        return (
          <>
            <div className="flex items-end justify-between">
              <span className="font-mono text-[clamp(2.25rem,5vw,3.5rem)] leading-none tracking-[-0.02em] tabular-nums text-cream">{data.temp}°</span>
              <Icon className="h-10 w-10 text-green-ink" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-cream">{d.label}</p>
              <p className="mb-3 font-mono text-xs text-ink-2">Feels {data.feels}° · wind {data.wind} km/h</p>
              <Spark values={data.hourly} />
              <p className="mt-1 font-mono text-[0.6875rem] text-ink-2">Next 12 hours</p>
            </div>
          </>
        );
      })() : askCity ? (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (city.trim()) setCity(city.trim()); }}>
          <p className="text-sm text-ink-2">Location is off. Enter a city to see the weather.</p>
          <input value={city} onChange={(e) => setCityText(e.target.value)} placeholder="e.g. Mumbai" aria-label="City"
            className="h-10 w-full rounded-[var(--r-sm)] bg-surface-3 px-3 text-sm text-cream placeholder:text-ink-2" />
          <button type="submit" className="rounded-full bg-bordo px-4 py-2 text-sm text-cream active:scale-[0.97]">Show weather</button>
        </form>
      ) : error ? (
        <p className="text-sm text-ink-2">Weather unavailable right now.</p>
      ) : (
        <div className="space-y-3" aria-busy={isLoading}>
          <div className="h-12 w-28 animate-pulse rounded-[var(--r-sm)] bg-surface-3" />
          <div className="h-8 w-full animate-pulse rounded-[var(--r-sm)] bg-surface-3" />
        </div>
      )}
    </Surface>
  );
}
