import type { ReactNode } from 'react';

export const authInput =
  'w-full rounded-[var(--r-sm)] bg-surface-3 px-4 py-3 text-sm text-cream outline-none placeholder:text-ink-2 focus:ring-2 focus:ring-ring';
export const authButton =
  'w-full rounded-full bg-bordo px-6 py-3 text-sm font-medium text-cream transition-transform hover:bg-bordo-hi active:scale-[0.97] disabled:opacity-60';

/** Shared full-screen layout for sign-in / reset, matching the counter page. */
export function AuthShell({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 py-16">
      <h1 className="text-center font-display text-[clamp(2.25rem,7vw,5rem)] font-bold uppercase leading-[0.95] tracking-[-0.04em] text-cream">
        Job Application Counter
      </h1>
      <p className="mt-6 font-display text-xs font-semibold uppercase tracking-[0.04em] text-ink-2">{subtitle}</p>
      <div className="mt-10 w-full max-w-sm">{children}</div>
    </main>
  );
}
