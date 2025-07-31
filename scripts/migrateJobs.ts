// scripts/migrateJobs.ts

console.log('--- Script is running! ---');
console.log('Node version:', process.version);

// Load environment variables from supabaseapi.env file
import dotenv from 'dotenv';
import path from 'path';

console.log('--- Imports (dotenv, path) successful ---');

// Load the supabaseapi.env file
dotenv.config({ path: path.resolve(process.cwd(), 'supabaseapi.env') });

console.log('--- dotenv.config() executed ---');

// Now that dotenv.config() has run, process.env should be populated.
// We can safely log and access the variables here.
console.log('Environment variables loaded:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'Not Set');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set');
console.log('VITE_SUPABASE_SERVICE_ROLE_KEY:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not Set');

// Re-introduce Supabase client imports and initialization
import { createClient } from '@supabase/supabase-js';
import { fetchAndParseJobsXmlWithSources, XmlSource } from '../src/utils/xmlParser';
// Assuming you have a getSupabaseClient.ts in src/utils
import { getSupabaseClient } from '../src/utils/supabaseClient'; // UNCOMMENT THIS LINE if you use it

// You will also need the Job type for type safety, uncomment if needed
// import { Job } from '../src/contexts/JobContext'; // Assuming Job type is in JobContext.ts

console.log('--- Importing createClient from @supabase/supabase-js successful ---');

// Initialize Supabase client directly in the script
const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string; // You might use this for migrations

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) { // Added service role key check
  console.error('ERROR: Supabase URL, Anon Key, or Service Role Key is missing!');
  process.exit(1);
}

// For migrations, it's safer to use the service role key as it bypasses Row Level Security (RLS)
// and has elevated permissions for direct DB writes.
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey); // <--- Changed to use service role key here

console.log('--- Supabase client initialized successfully (using Service Role Key) ---');


// <--- UNCOMMENT THE WHOLE migrateJobs ASYNC FUNCTION BELOW and its call --->

async function migrateJobs() {
    console.log('--- Starting migrateJobs function ---');

    const xmlSources: XmlSource[] = [
        // Using the Talent.com feed, as it's confirmed XML
        { company: 'Quadrant, Inc.', path: 'https://www2.jobdiva.com/candidates/myjobs/getportaljobs.jsp?a=8qjdnwlgeotaoky5q41ubijuzzda7s01b888nuy8f5i3cleht1jpnrux24jg4ux8' },
        // Add other XML sources here if you have them.
        // For JSON feeds like ZipRecruiter or Jobicy, you'd need a separate parser function.
        // { name: 'ZipRecruiter', url: 'https://www.ziprecruiter.com/jobs-feed/json' }, // This is JSON
        // { name: 'Jobicy', url: 'https://jobicy.com/api/v2/jobs?count=10&ts=1708442400' } // This is JSON
    ];

    let allJobs: any[] = []; // Use 'any' for now to avoid strict type issues with Job until confirmed

    try {
        console.log('--- Fetching and parsing jobs from XML sources ---');
        allJobs = await fetchAndParseJobsXmlWithSources(xmlSources);
        console.log(`--- Successfully fetched and parsed ${allJobs.length} jobs from XML sources ---`);
        // console.log('Sample of parsed jobs:', allJobs.slice(0, 2)); // Log first 2 jobs for inspection
    } catch (error: any) {
        console.error('Error fetching or parsing XML jobs:', error);
        return; // Exit if parsing fails
    }

    if (allJobs.length === 0) {
        console.log('No jobs to migrate. Exiting.');
        return;
    }

    console.log('--- Attempting to upsert jobs to Supabase ---');
    // Upserting jobs (insert or update if primary key conflict)
    // Make sure your Supabase table 'jobs' exists and has a primary key (e.g., 'id' or 'job_id')
    // that matches a unique identifier in your parsed job objects.
    // Assuming 'job_id' is your unique identifier for a job.
    try {
        const { data, error } = await supabase
            .from('jobs') // Replace 'jobs' with your actual table name
            .upsert(allJobs, { onConflict: 'id', ignoreDuplicates: false }); // Replace 'job_id' with your actual unique identifier column

        if (error) {
            console.error('Supabase upsert error:', error);
        } else {
            console.log(`Successfully upserted ${data ? data.length : 0} jobs to Supabase.`);
            // console.log('Supabase upsert response data:', data); // Log the response data
        }
    } catch (error: any) {
        console.error('An unexpected error occurred during Supabase upsert:', error);
    }

    console.log('--- Migration script finished ---');
}

// Call the main migration function
migrateJobs();