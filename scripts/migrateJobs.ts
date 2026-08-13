// scripts/migrateJobs.ts
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fetchAndParseJobsXmlWithSources, XmlSource } from '../src/utils/xmlParser';
import { deriveJobCategory } from '../src/utils/deriveJobCategory';

// Load environment variables from supabaseapi.env file
dotenv.config({ path: path.resolve(process.cwd(), 'supabaseapi.env') });
// VITE_MAPBOX_TOKEN lives in .env (the Vite app's env file), not
// supabaseapi.env — load it too so geocoding below has a token. dotenv
// doesn't override already-set vars, so this only fills in what's missing.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// --- IMPORTANT: Job Type Definition ---
interface Job {
    id: string; // This is the unique identifier for the job, to be used as the primary key
    title: string;
    description: string;
    externalJobId: string; // Original ID from the source XML
    externalUrl?: string; // Link to the original posting
    postedDate: string; // Supabase stores timestamps as strings
    sourceCompany: string; // Company that provided the job
    sourceXmlFile?: string; // Original XML file
    company?: string;
    location?: string;
    type?: string;
    salary?: string;
}

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

// Main function to fetch, parse, and migrate jobs
async function migrateJobs() {
    console.log('--- Migration script started ---');
    const supabase = getSupabaseClient();

    const xmlSources: XmlSource[] = [
        { url: 'https://www2.jobdiva.com/candidates/myjobs/getportaljobs.jsp?a=ecjdnwoxsqkabbr23rp3rqscjzk6vq01b8i9xsuraltku3dg8lqd5euflfugmd70', name: 'hirequadrant.xml' },
    ];

    let allJobs: Job[] = [];
    try {
        allJobs = await fetchAndParseJobsXmlWithSources(xmlSources);
        console.log(`Total jobs from all XML files: ${allJobs.length}`);
        console.log('--- Successfully fetched and parsed all jobs from XML sources ---');
    } catch (error) {
        console.error('Error fetching or parsing XML files:', error);
        return;
    }

    if (allJobs.length === 0) {
      console.log('No jobs found in XML files. Exiting migration.');
      return;
    }

    try {
        console.log('--- Attempting to upsert jobs to Supabase ---');

        // Map job.company (string) → companies.id so Browse Companies
        // counts include externally-ingested jobs. Without this each
        // JobDiva job lands with company_id = NULL and is invisible to
        // the public_company_directory view (Ray QA 2026-05-20).
        const distinctCompanyNames = Array.from(
            new Set(allJobs.map((j) => j.company?.trim()).filter(Boolean) as string[])
        );
        const companyIdByName = new Map<string, string>();
        if (distinctCompanyNames.length > 0) {
            const { data: companyRows, error: cErr } = await supabase
                .from('companies')
                .select('id, name')
                .in('name', distinctCompanyNames);
            if (cErr) console.error('Could not load companies for FK linkage:', cErr);
            else if (companyRows) {
                for (const c of companyRows as Array<{ id: string; name: string }>) {
                    companyIdByName.set(c.name.trim().toLowerCase(), c.id);
                }
            }
        }

        // Only geocode jobs that don't already have lat/lng — skips the
        // Mapbox call entirely on repeat runs, and (just as importantly)
        // never clobbers a value that was manually corrected in the DB
        // (see 20260813_backfill_job_geocoding.sql).
        const { data: existingGeo } = await supabase
            .from('jobs')
            .select('externalJobId, lat, lng');
        const existingGeoById = new Map(
            ((existingGeo ?? []) as Array<{ externalJobId: string; lat: number | null; lng: number | null }>)
                .map((r) => [r.externalJobId, r]),
        );

        console.log('--- Geocoding new job locations ---');
        const jobsToUpsert = await Promise.all(allJobs.map(async (job) => {
            const existing = existingGeoById.get(job.externalJobId);
            const { lat, lng } = existing?.lat != null && existing?.lng != null
                ? { lat: existing.lat, lng: existing.lng }
                : await geocodeJobLocation(job.location);
            return {
                id: job.externalJobId, // Use the externalJobId as the primary key
                externalJobId: job.externalJobId,
                title: job.title,
                description: job.description,
                externalUrl: job.externalUrl,
                postedDate: job.postedDate,
                sourceCompany: job.sourceCompany,
                sourceXmlFile: job.sourceXmlFile,
                company: job.company,
                company_id: job.company ? companyIdByName.get(job.company.trim().toLowerCase()) ?? null : null,
                location: job.location,
                lat,
                lng,
                type: job.type,
                salary: job.salary,
                category: deriveJobCategory(job.title),
            };
        }));
        console.log(`--- Geocoded ${geocodeCache.size} unique locations ---`);

        const { data, error } = await supabase
            .from('jobs')
            .upsert(jobsToUpsert, { onConflict: 'externalJobId' });

        if (error) {
            console.error('Supabase upsert error:', error);
        } else {
            console.log(`Successfully upserted ${jobsToUpsert.length} jobs to Supabase.`);
        }
    } catch (error: any) {
        console.error('An unexpected error occurred during the upsert process:', error);
    }

    try {
        console.log('--- Deleting stale jobs from Supabase ---');

        const { data: existingJobs, error: fetchError } = await supabase
            .from('jobs')
            .select('externalJobId');

        if (fetchError) {
            console.error('Error fetching existing jobs for deletion:', fetchError);
        } else if (existingJobs) {
            const existingDbJobIds = new Set(existingJobs.map(job => job.externalJobId));
            const currentXmlJobIds = new Set(allJobs.map(job => job.externalJobId));

            const jobIdsToDelete: string[] = [];
            for (const dbId of existingDbJobIds) {
                if (!currentXmlJobIds.has(dbId)) {
                    jobIdsToDelete.push(dbId);
                }
            }

            if (jobIdsToDelete.length > 0) {
                console.log(`Identified ${jobIdsToDelete.length} stale jobs to delete.`);
                const { error: deleteError } = await supabase
                    .from('jobs')
                    .delete()
                    .in('externalJobId', jobIdsToDelete);

                if (deleteError) {
                    console.error('Supabase delete error:', deleteError);
                } else {
                    console.log(`Successfully deleted ${jobIdsToDelete.length} stale jobs from Supabase.`);
                }
            } else {
                console.log('No stale jobs found to delete. Database is synchronized.');
            }
        }
    } catch (error: any) {
        console.error('An unexpected error occurred during job deletion process:', error);
    }

    console.log('--- Migration script finished ---');
}

migrateJobs();