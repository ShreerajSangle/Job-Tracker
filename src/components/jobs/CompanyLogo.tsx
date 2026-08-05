import { useMemo, useState } from 'react';

interface CompanyLogoProps {
  companyName: string;
  jobUrl?: string | null;
  size?: number;
  className?: string;
}

/** Extracts a bare domain (no scheme, no "www.") from a job posting URL. */
export function domainFromJobUrl(jobUrl?: string | null): string | null {
  if (!jobUrl) return null;
  try {
    const host = new URL(jobUrl).hostname.replace(/^www\./, '');
    // Job-board hosts (LinkedIn, Indeed, Greenhouse, Lever, ...) don't have the
    // hiring company's own branding — showing their logo would be misleading.
    const jobBoardHosts = [
      'linkedin.com', 'indeed.com', 'greenhouse.io', 'lever.co', 'workday.com',
      'myworkdayjobs.com', 'ashbyhq.com', 'smartrecruiters.com', 'ziprecruiter.com',
      'ycombinator.com', 'ycombinator.io', 'glassdoor.com', 'ashby.hq.com',
    ];
    if (jobBoardHosts.some((h) => host === h || host.endsWith(`.${h}`))) return null;
    return host;
  } catch {
    return null;
  }
}

const AVATAR_COLORS = [
  'bg-indigo-500/20 text-indigo-300',
  'bg-sky-500/20 text-sky-300',
  'bg-emerald-500/20 text-emerald-300',
  'bg-amber-500/20 text-amber-300',
  'bg-rose-500/20 text-rose-300',
  'bg-violet-500/20 text-violet-300',
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/**
 * Renders a company's logo (via a logo-by-domain service) with a graceful
 * fallback to a colored initials avatar when there's no usable domain or the
 * image fails to load (private companies, ATS-only postings, etc).
 */
export function CompanyLogo({ companyName, jobUrl, size = 32, className = '' }: CompanyLogoProps) {
  const domain = useMemo(() => domainFromJobUrl(jobUrl), [jobUrl]);
  const [imgFailed, setImgFailed] = useState(false);

  const initial = companyName.trim().charAt(0).toUpperCase() || '?';

  if (!domain || imgFailed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg font-semibold ${colorFor(companyName)} ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.42 }}
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={`https://logo.tomba.io/${domain}`}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-lg object-contain bg-white/5 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setImgFailed(true)}
      loading="lazy"
    />
  );
}
