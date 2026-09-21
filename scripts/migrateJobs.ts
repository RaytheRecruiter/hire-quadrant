// scripts/migrateJobs.ts
//
// Rewritten 2026-09-21 to loop over multiple ingestion sources (JobDiva XML
// plus Greenhouse/Lever/Ashby/SmartRecruiters — see src/utils/jobSources/)
// instead of a single hardcoded XML feed. Each source is wrapped in its own
// try/catch so one platform being down/rate-limited never blocks the others.
//
// Also fixes two confirmed-live bugs while this file was being rewritten
// anyway (see supabase/migrations/20260921_consolidate_job_source_columns.sql):
//   1. This script now reads/writes the tracked snake_case columns
//      (source_company, source_xml_file, external_job_id, external_url,
//      posted_date) that CompanySourceManager.tsx/Admin.tsx/useAdminData.ts
//      actually read, instead of an untracked camelCase set nothing else
//      in the app ever consumed.
//   2. Company linkage now goes through resolveCompanyId() (case-insensitive
//      match + auto-create) instead of a case-sensitive exact match that
//      left ~90% of jobs with company_id = null.
//
// Stale-job deletion is now scoped per source (`source_xml_file = <id>`)
// rather than a single global sweep — syncing one platform can no longer
// delete another platform's jobs. jobs.id (PK) is namespaced per platform
// (`${platform}:${token}:${rawId}`) for the 4 new sources to make
// cross-platform ID collisions structurally impossible; JobDiva keeps its
// original unprefixed IDs unchanged for backward compatibility with
// existing links/bookmarks.

import dotenv from 'dotenv';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { deriveJobCategory } from '../src/utils/deriveJobCategory';
import { buildJobSourceAdapters } from '../src/utils/jobSources/sourceConfig';
import { resolveCompanyId, CompanyIdCache } from '../src/utils/jobSources/resolveCompany';
import { JobSourceAdapter, NormalizedJob } from '../src/utils/jobSources/types';

// Load environment variables from supabaseapi.env file
dotenv.config({ path: path.resolve(process.cwd(), 'supabaseapi.env') });
// VITE_MAPBOX_TOKEN lives in .env (the Vite app's env file), not
// supabaseapi.env — load it too so geocoding below has a token. dotenv
// doesn't override already-set vars, so this only fills in what's missing.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Best-effort geocoding for jobs.lat/lng, mirroring src/utils/geocode.ts
// (which is browser-only and can't be reused directly from this Node
// script). Added 2026-08-13 — the XML feed never geocoded on ingest,
// leaving 200+ jobs with no lat/lng and unable to participate in
// mile-radius / skills-match search. See
// supabase/migrations/20260813_backfill_job_geocoding.sql for the one-time
// backfill of jobs that were already imported before this existed.
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

function normalizeLocationForGeocode(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed || /^remote$/i.test(trimmed)) return null;
    // Feed locations come as "ST - City" (e.g. "VA - McLean"); reorder for
    // a much higher geocoding hit rate.
    const m = trimmed.match(/^([A-Za-z]{2})\s*-\s*(.+)$/);
    if (m) return `${m[2].trim()}, ${m[1].trim().toUpperCase()}, USA`;
    return `${trimmed}, USA`;
}

async function geocodeJobLocation(rawLocation: string | undefined): Promise<{ lat: number | null; lng: number | null }> {
    if (!rawLocation) return { lat: null, lng: null };
    const query = normalizeLocationForGeocode(rawLocation);
    if (!query) return { lat: null, lng: null }; // "Remote" or empty — never radius-filtered

    if (geocodeCache.has(rawLocation)) {
        const cached = geocodeCache.get(rawLocation)!;
        return cached ? cached : { lat: null, lng: null };
    }

    const token = process.env.VITE_MAPBOX_TOKEN;
    if (!token) {
        console.warn('VITE_MAPBOX_TOKEN not set — skipping geocoding for new jobs.');
        return { lat: null, lng: null };
    }

    try {
        // Restrict to place-level results (city/town) — an unrestricted
        // query sometimes matches an identically-named street in a totally
        // different state over the actual city (e.g. "Dulles, VA" without
        // this matched a street in Minnesota during the 2026-08-13 backfill).
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=us&limit=1&types=place&access_token=${token}`;
        // The Mapbox token is Referer-restricted to the production domain
        // in the Mapbox dashboard; this isn't a browser request, so it
        // must supply one to avoid a 403.
        const res = await fetch(url, { headers: { Referer: 'https://hirequadrant.com/' } });
        if (!res.ok) {
            geocodeCache.set(rawLocation, null);
            return { lat: null, lng: null };
        }
        const json = (await res.json()) as { features?: Array<{ center: [number, number] }> };
        const feature = json.features?.[0];
        if (!feature) {
            geocodeCache.set(rawLocation, null);
            return { lat: null, lng: null };
        }
        const [lng, lat] = feature.center;
        geocodeCache.set(rawLocation, { lat, lng });
        return { lat, lng };
    } catch (err) {
        console.warn(`Geocoding failed for "${rawLocation}":`, err);
        geocodeCache.set(rawLocation, null);
        return { lat: null, lng: null };
    }
}

// Function to get the Supabase client using the service role key
const getSupabaseClient = () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
    const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY environment variables are not set.');
        console.error('This script requires the service role key for write access.');
        process.exit(1);
    }
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            persistSession: false,
        },
    });
};

// JobDiva keeps its original unprefixed externalJobId as the PK, unchanged,
// for backward compatibility with existing links/bookmarks. The 4 new ATS
// sources get a namespaced PK so the same numeric/opaque ID from two
// different platforms can never collide.
function buildJobId(adapter: JobSourceAdapter, job: NormalizedJob): string {
    return adapter.platform === 'jobdiva' ? job.externalJobId : `${adapter.id}:${job.externalJobId}`;
}

async function processSource(
    supabase: SupabaseClient,
    adapter: JobSourceAdapter,
    existingGeoById: Map<string, { lat: number | null; lng: number | null }>,
    companyIdCache: CompanyIdCache,
) {
    console.log(`--- [${adapter.id}] Fetching jobs ---`);
    const jobs = await adapter.fetchJobs();
    console.log(`--- [${adapter.id}] Fetched ${jobs.length} jobs ---`);

    if (jobs.length === 0) {
        console.log(`--- [${adapter.id}] No jobs returned, skipping upsert and stale-delete ---`);
        return;
    }

    const rows = await Promise.all(jobs.map(async (job) => {
        const id = buildJobId(adapter, job);

        const existing = existingGeoById.get(id);
        const { lat, lng } = existing?.lat != null && existing?.lng != null
            ? { lat: existing.lat, lng: existing.lng }
            : await geocodeJobLocation(job.location);

        const company_id = job.company ? await resolveCompanyId(supabase, job.company, companyIdCache) : null;

        return {
            id,
            external_job_id: job.externalJobId,
            title: job.title,
            description: job.description,
            external_url: job.externalUrl,
            posted_date: job.postedDate,
            source_company: job.sourceCompany,
            source_xml_file: job.sourceXmlFile,
            company: job.company,
            company_id,
            location: job.location,
            lat,
            lng,
            type: job.type,
            salary: job.salary,
            category: deriveJobCategory(job.title),
        };
    }));

    const { error: upsertError } = await supabase
        .from('jobs')
        .upsert(rows, { onConflict: 'id' });

    if (upsertError) {
        console.error(`[${adapter.id}] Supabase upsert error:`, upsertError);
        return;
    }
    console.log(`[${adapter.id}] Successfully upserted ${rows.length} jobs.`);

    // Scoped stale-delete: only jobs previously ingested from THIS source
    // and no longer present in today's fetch are removed. Never touches
    // jobs from any other source.
    const { data: existingForSource, error: fetchError } = await supabase
        .from('jobs')
        .select('id')
        .eq('source_xml_file', adapter.id);

    if (fetchError) {
        console.error(`[${adapter.id}] Error fetching existing jobs for stale-delete:`, fetchError);
        return;
    }

    const currentIds = new Set(rows.map((r) => r.id));
    const staleIds = (existingForSource ?? [])
        .map((r) => r.id as string)
        .filter((id) => !currentIds.has(id));

    if (staleIds.length === 0) {
        console.log(`[${adapter.id}] No stale jobs to delete.`);
        return;
    }

    const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .in('id', staleIds);

    if (deleteError) {
        console.error(`[${adapter.id}] Supabase delete error:`, deleteError);
    } else {
        console.log(`[${adapter.id}] Deleted ${staleIds.length} stale jobs.`);
    }
}

async function migrateJobs() {
    console.log('--- Migration script started ---');
    const supabase = getSupabaseClient();

    // Only geocode jobs that don't already have lat/lng — skips the
    // Mapbox call entirely on repeat runs, and (just as importantly)
    // never clobbers a value that was manually corrected in the DB
    // (see 20260813_backfill_job_geocoding.sql). Loaded once up front and
    // shared across every source below.
    const { data: existingGeo } = await supabase
        .from('jobs')
        .select('id, lat, lng');
    const existingGeoById = new Map(
        ((existingGeo ?? []) as Array<{ id: string; lat: number | null; lng: number | null }>)
            .map((r) => [r.id, r]),
    );

    // Shared across all sources so the same company name (e.g. a repeat
    // employer posting on both Greenhouse and Lever) only round-trips to
    // the DB once per run.
    const companyIdCache: CompanyIdCache = new Map();

    const adapters = buildJobSourceAdapters();

    for (const adapter of adapters) {
        try {
            await processSource(supabase, adapter, existingGeoById, companyIdCache);
        } catch (error) {
            console.error(`[${adapter.id}] Unexpected error, skipping this source:`, error);
        }
    }

    console.log(`--- Geocoded ${geocodeCache.size} unique locations this run ---`);
    console.log('--- Migration script finished ---');
}

migrateJobs();
