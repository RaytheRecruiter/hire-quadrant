// Browser-side geocoding via Mapbox. Per Scott 2026-04-29 (#6).
// VITE_MAPBOX_TOKEN is a public token by design (it ships in the JS bundle).
// Protect against abuse via URL restrictions in the Mapbox dashboard.
//
// We cache results in localStorage by query string to avoid burning the
// (50k req/mo) free tier on duplicate lookups.

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const CACHE_PREFIX = 'hq_geocode_v1:';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface GeocodeResult {
  lat: number;
  lng: number;
  // Mapbox-formatted place name (e.g. "Fairfax, Virginia 22030, United States")
  place_name?: string;
}

interface CacheEntry {
  ts: number;
  result: GeocodeResult | null;
}

function readCache(key: string): GeocodeResult | null | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return undefined;
    }
    return parsed.result;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, result: GeocodeResult | null) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ ts: Date.now(), result } as CacheEntry),
    );
  } catch {
    // localStorage full or unavailable — fail silent, caller still gets the result.
  }
}

export function isGeocodeConfigured(): boolean {
  return Boolean(TOKEN && TOKEN.length > 10);
}

/**
 * Geocode a free-text address (ZIP, city, full address) to lat/lng.
 * Returns null if the lookup fails or no result is found.
 */
export async function geocode(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;
  if (!TOKEN) {
    console.warn('VITE_MAPBOX_TOKEN missing — geocoding skipped');
    return null;
  }

  const cacheKey = q.toLowerCase();
  const cached = readCache(cacheKey);
  if (cached !== undefined) return cached;

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
    `?country=us&limit=1&access_token=${TOKEN}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      writeCache(cacheKey, null);
      return null;
    }
    const json = (await res.json()) as {
      features?: Array<{ center: [number, number]; place_name?: string }>;
    };
    const feature = json.features?.[0];
    if (!feature) {
      writeCache(cacheKey, null);
      return null;
    }
    const [lng, lat] = feature.center;
    const result: GeocodeResult = { lat, lng, place_name: feature.place_name };
    writeCache(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

/**
 * Convenience: geocode a US ZIP code. Mapbox accepts plain ZIPs but anchoring
 * to "USA" gets us better results for short strings.
 */
export async function geocodeZip(zip: string): Promise<GeocodeResult | null> {
  const z = zip.trim().split('-')[0]; // ignore +4 if present
  if (!/^\d{5}$/.test(z)) return null;
  return geocode(`${z}, USA`);
}
