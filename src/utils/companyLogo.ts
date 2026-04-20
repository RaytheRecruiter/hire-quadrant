// Company logo resolver — uses Logo.dev's free API (no key needed for basic use)
// Falls back to a colored initial avatar if no domain/logo is found.

export function resolveLogoUrl(company?: string | null, explicitLogo?: string | null): string | null {
  if (explicitLogo) return explicitLogo;
  if (!company) return null;

  // Best-effort: strip common suffixes and guess domain
  const clean = company
    .toLowerCase()
    .replace(/\b(inc|llc|corp|ltd|co|group|technologies|tech|systems)\.?\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  if (!clean) return null;

  // Logo.dev free tier: https://logo.dev
  return `https://img.logo.dev/${clean}.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=128&format=png`;
}

export function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('');
}

// Consistent color from a string — used for initial-avatar backgrounds
export function colorFromString(str: string): string {
  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-indigo-100 text-indigo-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700',
    'bg-orange-100 text-orange-700',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}
