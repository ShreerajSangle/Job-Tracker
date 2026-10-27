import type { HTMLAttributes } from 'react';

/** Tile/card on surface-1. Elevation comes from the surface step, not shadow. */
export function Surface({ className = '', ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-[var(--r-md)] bg-surface-1 ${className}`} {...p} />;
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6">{children}</main>;
}
