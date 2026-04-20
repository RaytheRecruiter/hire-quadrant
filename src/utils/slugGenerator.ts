export const generateSlug = (title: string, company: string, id?: string): string => {
  const slugBase = `${title}-at-${company}`
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Add ID suffix for uniqueness (short 8-char version)
  if (id) {
    const shortId = id.substring(0, 8);
    return `${slugBase}-${shortId}`;
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
