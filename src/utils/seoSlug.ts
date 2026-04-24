// Slug helpers for programmatic SEO pages — industries, cities/regions,
// etc. Kept lossy on purpose: we round-trip via case-insensitive match
// on the source column, so "New York, NY" -> "new-york-ny" and back
// works even if someone types "new-york-ny" or "New York, NY".

export function toSeoSlug(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function prettyFromSlug(slug: string | null | undefined): string {
  if (!slug) return '';
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
