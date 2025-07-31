// scripts/migrateJobs.ts

console.log('--- Script is running! ---');
console.log('Node version:', process.version);

// Load environment variables from supabaseapi.env file
import dotenv from 'dotenv';
import path from 'path';

console.log('--- Imports (dotenv, path) successful ---');

// Ensure dotenv.config() runs early to load environment variables
// It looks for 'supabaseapi.env' in the current working directory
dotenv.config({ path: path.resolve(process.cwd(), 'supabaseapi.env') });

console.log('--- dotenv.config() executed ---');

// Verify environment variables are loaded
console.log('Environment variables loaded:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'Not Set');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set');
console.log('VITE_SUPABASE_SERVICE_ROLE_KEY:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not Set');

// --- Supabase Client Setup ---
import { createClient } from '@supabase/supabase-js';
import { fetchAndParseJobsXmlWithSources, XmlSource } from '../src/utils/xmlParser';

// --- IMPORTANT: Job Type Definition ---
// If you already have a 'Job' interface defined in src/contexts/JobContext.ts
// or another shared file, UNCOMMENT and use that import instead.
// import { Job } from '../src/contexts/JobContext';
// Otherwise, keep this local definition:
interface Job {
    id?: string; // Optional: This is often the auto-generated primary key in Supabase
    title: string;
    description: string;
    externalJobId: string; // This is the UNIQUE ID from your XML feed (e.g., JobDiva's ID)
    externalUrl?: string;
    applicationDeadline?: Date;
    postedDate?: Date;
    sourceCompany: string; // e.g., 'Quadrant, Inc.'
    sourceXmlFile?: string; // e.g., 'talent.com-feed.xml'
    // Add any other fields that are part of your job schema in Supabase
    // Example: location?: string; jobType?: string; salaryRange?: string;
}


console.log('--- Importing createClient from @supabase/supabase-js successful ---');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

// Basic check for required environment variables
if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('ERROR: Supabase URL or Service Role Key is missing!');
    console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in your supabaseapi.env file.');
    process.exit(1);
}

// Using the service role key for migrations bypasses Row Level Security (RLS)
// and provides necessary permissions for direct database writes/deletes.
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

console.log('--- Supabase client initialized successfully (using Service Role Key) ---');


// --- Main Migration Function ---
async function migrateJobs() {
    console.log('--- Starting migrateJobs function ---');

    // Define your XML feed sources here
    const xmlSources: XmlSource[] = [
        { company: 'Quadrant, Inc.', path: 'https://www2.jobdiva.com/candidates/myjobs/getportaljobs.jsp?a=8qjdnwlgeotaoky5q41ubijuzzda7s01b888nuy8f5i3cleht1jpnrux24jg4ux8' },
        // Add more XML feed sources if you have them, e.g.:
        // { company: 'AnotherCompany', path: 'http://example.com/another_feed.xml' },
    ];

    let allJobs: Job[] = []; // Array to hold all parsed jobs

    // --- Fetching and Parsing Jobs ---
    try {
        console.log('--- Fetching and parsing jobs from XML sources ---');
        allJobs = await fetchAndParseJobsXmlWithSources(xmlSources);
        console.log(`--- Successfully fetched and parsed ${allJobs.length} jobs from XML sources ---`);
    } catch (error: any) {
        console.error('Error fetching or parsing XML jobs:', error);
        // It's usually wise to stop if data source parsing fails critically
        return;
    }

    if (allJobs.length === 0) {
        console.log('No jobs found in XML feeds to process. Exiting.');
        return;
    }

    // --- UPSERT SECTION: Insert or Update Jobs ---
    console.log('--- Attempting to upsert jobs to Supabase ---');
    try {
        // IMPORTANT: The 'externalJobId' column in your Supabase 'jobs' table
        // MUST be set as UNIQUE for 'onConflict' to work correctly.
        const { data: upsertResponseData, error: upsertError } = await supabase
            .from('jobs') // Your Supabase table name for jobs
            .upsert(allJobs, { onConflict: 'externalJobId', ignoreDuplicates: false }); // Use externalJobId for conflict resolution

        if (upsertError) {
            console.error('Supabase upsert error:', upsertError);
        } else {
            // Note: upsertResponseData might be null or an empty array if no rows were truly inserted/updated
            // (e.g., if all data was identical to existing rows)
            console.log(`Successfully upserted ${upsertResponseData ? upsertResponseData.length : 'some'} jobs to Supabase.`);
        }
    } catch (error: any) {
        console.error('An unexpected error occurred during Supabase upsert:', error);
        // Consider if you want to exit here, or continue to deletion even if upsert had issues
    }

    // --- DELETION SECTION: Remove Stale Jobs ---
    console.log('--- Attempting to identify and delete stale jobs ---');
    try {
        // 1. Get all unique externalJobIds from the CURRENTLY PARSED XML feeds
        const currentXmlJobIds = new Set(allJobs.map(job => job.externalJobId).filter(id => id !== undefined && id !== null));

        // 2. Get all externalJobIds currently stored in your Supabase 'jobs' table
        const { data: existingDbJobs, error: fetchError } = await supabase
            .from('jobs')
            .select('externalJobId'); // Fetch only the externalJobId for efficiency

        if (fetchError) {
            console.error('Error fetching existing jobs from Supabase for deletion check:', fetchError);
            // Don't stop the script here, as the upsert might have worked already
        } else {
            const existingDbJobIds = new Set(existingDbJobs.map(job => job.externalJobId).filter(id => id !== undefined && id !== null));

            // 3. Identify which jobs are in the DB but NOT in the current XML feed
            const jobIdsToDelete: string[] = [];
            for (const dbId of existingDbJobIds) {
                if (!currentXmlJobIds.has(dbId)) {
                    jobIdsToDelete.push(dbId);
                }
            }

            if (jobIdsToDelete.length > 0) {
                console.log(`Identified ${jobIdsToDelete.length} stale jobs to delete:`, jobIdsToDelete);
                // 4. Execute deletion in Supabase for the identified stale jobs
                const { error: deleteError } = await supabase
                    .from('jobs')
                    .delete()
                    .in('externalJobId', jobIdsToDelete); // Delete rows where externalJobId matches our list

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
    // --- END DELETION SECTION ---

    console.log('--- Migration script finished ---');
}

// Call the main migration function to start the process
migrateJobs();