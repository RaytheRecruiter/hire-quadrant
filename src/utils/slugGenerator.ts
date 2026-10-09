export const generateSlug = (title: string, company: string, id?: string): string => {
  const slugBase = `${title}-at-${company}`
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Add the full ID as a suffix for uniqueness. Previously truncated to the
  // first 8 characters, which worked when every ID was a short, distinct
  // string (JobDiva's "26-02208" etc.) but broke once multi-ATS ingestion
  // introduced namespaced IDs like "greenhouse:stripe:8227563" -- EVERY job
  // from the same platform shares the same first 8 characters ("greenhou"
  // for all ~700 Greenhouse jobs), so same-titled postings collided onto
  // the identical slug and JobDetails.tsx's prefix lookup could resolve to
  // the wrong job. Confirmed 2026-10-09 via audit N11. The full ID has no
  // such collision, and JobDetails.tsx's lookup cascade already handles
  // longer/hyphen-containing suffixes correctly (it's how "ui-{uuid}" ids
  // already worked before this fix).
  if (id) {
    return `${slugBase}-${id}`;
  }

  return slugBase;
};

export const extractIdFromSlug = (slug: string): string => {
  // Extract the last segment after the last hyphen (assuming it's the ID)
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];

  // Check if last part looks like a short ID (alphanumeric, 8 chars or less)
  if (lastPart && lastPart.length <= 8 && /^[a-z0-9]+$/.test(lastPart)) {
    return lastPart;
  }

  // Fallback: return the whole slug as ID (for migration)
  return slug;
};

export const isUuid = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};
