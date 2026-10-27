import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PALETTE = ['bg-green text-green-ink', 'bg-bordo text-cream', 'bg-surface-3 text-cream-dim', 'bg-cream-dim text-green',
  'bg-surface-2 text-green-ink', 'bg-bordo-hi text-cream', 'bg-green-ink text-background', 'bg-surface-3 text-bordo-ink'];

// De-duplicate lookups across rows/renders; null = no logo found.
const cache = new Map<string, Promise<string | null>>();

function loadLogo(company: string): Promise<string | null> {
  const key = company.toLowerCase().trim();
  if (!cache.has(key)) {
    cache.set(key, (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        const res = await fetch(`/api/company-icon?company=${encodeURIComponent(company)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) return null;
        return URL.createObjectURL(await res.blob());
      } catch { return null; }
    })());
  }
  return cache.get(key)!;
}

export function CompanyAvatar({ company, size = 32 }: { company: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadLogo(company).then((u) => live && setSrc(u));
    return () => { live = false; };
  }, [company]);
  const initials = company.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';
  const tone = PALETTE[(company.trim().toLowerCase().charCodeAt(0) || 0) % PALETTE.length];
  return (
    <span style={{ width: size, height: size }} className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] text-xs font-semibold ${tone}`}>
      {initials}
      {src && <img src={src} alt="" onError={() => setSrc(null)} className="absolute inset-0 h-full w-full bg-white object-contain p-0.5" />}
    </span>
  );
}
