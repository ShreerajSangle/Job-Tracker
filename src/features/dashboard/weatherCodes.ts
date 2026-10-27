export type WeatherKind = 'clear' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm';

/** WMO weather interpretation codes (Open-Meteo). */
export function describeWeather(code: number): { label: string; kind: WeatherKind } {
  if (code === 0) return { label: 'Clear sky', kind: 'clear' };
  if (code <= 2) return { label: 'Partly cloudy', kind: 'cloud' };
  if (code === 3) return { label: 'Overcast', kind: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Foggy', kind: 'fog' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', kind: 'rain' };
  if (code >= 61 && code <= 67) return { label: 'Rain', kind: 'rain' };
  if (code >= 71 && code <= 77) return { label: 'Snow', kind: 'snow' };
  if (code >= 80 && code <= 82) return { label: 'Showers', kind: 'rain' };
  if (code === 85 || code === 86) return { label: 'Snow showers', kind: 'snow' };
  if (code >= 95) return { label: 'Thunderstorm', kind: 'storm' };
  return { label: 'Unsettled', kind: 'cloud' };
}
