// scripts/backfillJobGeocodes.ts
//
// One-shot script: geocode every job that currently has lat IS NULL via
// Mapbox, then write lat/lng back to the row. Required after PR #93
// (mile-radius search) so legacy listings show up in radius-filtered
// results.
//
// Idempotent: re-running only touches rows still missing coords.
// Skips Remote-only jobs (workplace_type='Remote') by default since
// those don't participate in radius search anyway.
//
// Run: npm run backfill:geocodes
//
// Requires:
//   supabaseapi.env: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY
//   .env:           VITE_MAPBOX_TOKEN
//
// Mapbox free tier = 100k requests/mo. We cap to MAX_PER_RUN to avoid
// burning the whole quota in one go on huge datasets — bump it up if
// you need to.

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load both env files. .env first so VITE_MAPBOX_TOKEN is picked up;
// supabaseapi.env wins for the service-role key.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'supabaseapi.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in supabaseapi.env');
  process.exit(1);
}
if (!MAPBOX_TOKEN) {
  console.error('Missing VITE_MAPBOX_TOKEN in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MAX_PER_RUN = Number(process.env.MAX_PER_RUN || 1000);
const REQUESTS_PER_SECOND = 8; // ~30k/hour; well below Mapbox's 600/min

interface JobRow {
  id: string;
  location: string | null;
  workplace_type: string | null;
}

interface GeocodeResult {
  lat: number;
  lng: number;
}

async function geocode(query: string): Promise<GeocodeResult | null> {
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?country=us&limit=1&access_token=${MAPBOX_TOKEN}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ! Mapbox ${res.status} for "${query}"`);
      return null;
    }
    const json = (await res.json()) as { features?: Array<{ center: [number, number] }> };
    const feature = json.features?.[0];
    if (!feature) return null;
    const [lng, lat] = feature.center;
    return { lat, lng };
  } catch (err) {
    console.warn(`  ! geocode error for "${query}":`, err);
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log('Backfilling job geocodes...');
  console.log(`MAX_PER_RUN = ${MAX_PER_RUN}, RPS = ${REQUESTS_PER_SECOND}`);

  // Pull every job missing coords, that has a location text and isn't
  // marked Remote. Order by created_at so newest jobs get coords first.
  const { data, error } = await supabase
    .from('jobs')
    .select('id, location, workplace_type')
    .is('lat', null)
    .not('location', 'is', null)
    .neq('workplace_type', 'Remote')
    .order('created_at', { ascending: false })
    .limit(MAX_PER_RUN);

  if (error) {
    console.error('Failed to load jobs:', error);
    process.exit(1);
  }

  const jobs = (data || []) as JobRow[];
  console.log(`Found ${jobs.length} job(s) missing lat/lng.`);

  let geocoded = 0;
  let skipped = 0;
  let failed = 0;
  const interval = 1000 / REQUESTS_PER_SECOND;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const loc = (job.location || '').trim();
    if (!loc) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${i + 1}/${jobs.length}] ${job.id} → "${loc}" ... `);
    const result = await geocode(loc);
    if (!result) {
      console.log('no match');
      failed++;
      await sleep(interval);
      continue;
    }

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ lat: result.lat, lng: result.lng })
      .eq('id', job.id);

    if (updateError) {
      console.log('update failed:', updateError.message);
      failed++;
    } else {
      console.log(`ok (${result.lat.toFixed(3)}, ${result.lng.toFixed(3)})`);
      geocoded++;
    }
    await sleep(interval);
  }

  console.log('\n─────────────────────────────────');
  console.log(`Done.  geocoded=${geocoded}  failed=${failed}  skipped=${skipped}`);
  console.log('Re-run safely — only rows still missing coords will be touched.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
