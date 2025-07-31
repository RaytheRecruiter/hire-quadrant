// scripts/migrateJobs.ts

console.log('--- EXECUTING MIGRATE JOBS SCRIPT v2.0 ---'); // Add this line

// scripts/migrateJobs.ts
// Load environment variables from supabaseapi.env file
import dotenv from 'dotenv';
import path from 'path';

// Load the supabaseapi.env file - THIS MUST BE THE FIRST THING THAT HAPPENS
// in terms of environment variable loading for the Node.js process.
dotenv.config({ path: path.resolve(process.cwd(), 'supabaseapi.env') });

// Now that dotenv.config() has run, process.env should be populated.
// We can safely log and access the variables here.
console.log('Environment variables loaded:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'Not Set');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set');
console.log('VITE_SUPABASE_SERVICE_ROLE_KEY:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not Set');


// Import other modules *after* environment variables are loaded
import { fetchAndParseJobsXmlWithSources, XmlSource } from '../src/utils/xmlParser';
import { getSupabaseClient } from '../src/utils/supabaseClient'; // Now this function expects arguments
import { Job } from '../src/contexts/JobContext';

async function migrateJobs() {
  console.log('Starting job migration...');

  // Get environment variables directly from process.env *after* dotenv.config()
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  // Add more specific checks here
  if (!supabaseUrl) {
    console.error('VITE_SUPABASE_URL is not set. Cannot proceed with Supabase client initialization.');
    return;
  }
  if (!supabaseServiceRoleKey) {
    console.error('VITE_SUPABASE_SERVICE_ROLE_KEY is not set. Cannot proceed with Supabase client initialization.');
    return;
  }

  // Initialize Supabase client by passing the loaded environment variables
  const supabase = getSupabaseClient(supabaseUrl, supabaseServiceRoleKey);

  if (!supabase) {
    console.error('Failed to initialize Supabase client. Please check your environment variables and the getSupabaseClient function.');
    return;
  }

  console.log('Supabase client initialized successfully for migration.');

  let allJobs: Job[] = [];

  // ... rest of your migrateJobs function (no changes needed below this point) ...

  // Fetch from the specified remote URL
  const xmlSources: XmlSource[] = [
    { path: 'https://www2.jobdiva.com/candidates/myjobs/getportaljobs.jsp?a=t4jdnwtrvhrp7whbngaxrc4vr24k9x01b8hjdt9a1o9wgnbvpbmubd0bvi6lblsl', company: 'Quadrant, Inc.' },
  ];

  try {
    console.log('Attempting to fetch from remote XML source...');
    const jobs = await fetchAndParseJobsXmlWithSources(xmlSources);
    console.log(`Total jobs parsed from remote: ${jobs.length}`);
    allJobs.push(...jobs);
  } catch (error) {
    console.error('Error fetching from remote XML source:');
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Non-Error object caught:', typeof error);
      try {
        console.error('Error details:', JSON.stringify(error, null, 2));
      } catch (jsonError) {
        console.error('Could not stringify error object:', error);
      }
    }
  }

  console.log(`Total jobs parsed: ${allJobs.length}`);

  if (allJobs.length === 0) {
    console.log('No jobs parsed. Exiting migration.');
    return;
  }

  // Insert jobs into Supabase
  console.log('Attempting to insert jobs into Supabase...');
  try {
    const jobsToInsert = allJobs.map(job => {
      const postedDateISO = (job.postedDate instanceof Date && !isNaN(job.postedDate.getTime()))
        ? job.postedDate.toISOString()
        : new Date().toISOString();

      const applicationDeadlineISO = (job.applicationDeadline instanceof Date && !isNaN(job.applicationDeadline.getTime()))
        ? job.applicationDeadline.toISOString()
        : new Date().toISOString();

      const requirementsJSON = Array.isArray(job.requirements)
        ? job.requirements
        : [];

      const benefitsJSON = Array.isArray(job.benefits)
        ? job.benefits
        : [];

      const jobData = {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        salary: job.salary,
        description: job.description,
        requirements: requirementsJSON,
        benefits: benefitsJSON,
        posted_date: postedDateISO,
        application_deadline: applicationDeadlineISO,
        views: job.views,
        applications: job.applications,
        source_company: job.sourceCompany || null,
        source_xml_file: job.sourceXmlFile || null,
        external_job_id: job.externalJobId || null,
        external_url: job.externalUrl || null,
      };
      console.log('Prepared job for insertion:', jobData.id, jobData.title);
      return jobData;
    });

    console.log(`Attempting to upsert ${jobsToInsert.length} jobs.`);

   if (jobsToInsert.length > 0) {
     console.log('--- Inspecting first job object before upsert ---');
     const firstJob = jobsToInsert[0];
     for (const key in firstJob) {
       if (Object.prototype.hasOwnProperty.call(firstJob, key)) {
         const value = firstJob[key as keyof typeof firstJob];
         console.log(`  Field: ${key}`);
         console.log(`    Type: ${typeof value}`);
         // Safely log the value, converting objects to JSON string for inspection
         if (typeof value === 'object' && value !== null) {
             try {
                 console.log(`    Value: ${JSON.stringify(value)}`); // Safely stringify objects
             } catch (e) {
                 console.error(`    Value (JSON.stringify failed):`, value); // Log the object if stringify fails
                 console.error(`    JSON.stringify error:`, e);
             }
         } else {
             console.log(`    Value: ${value}`); // Log primitives directly
         }
       }
     }
     console.log('--- End inspection ---');
   }

    const { data, error } = await supabase
      .from('jobs')
      .upsert(jobsToInsert, { onConflict: 'id' });

    if (error) {
      console.error('Error inserting jobs into Supabase:', error);
      if (error.details) console.error('Error details:', error.details);
      if (error.hint) console.error('Error hint:', error.hint);
      if (error.message) console.error('Error message:', error.message);
      if (error.code) console.error('Error code:', error.code);
    } else {
      console.log(`Successfully inserted/updated ${jobsToInsert.length} jobs in Supabase.`);
    }
  } catch (e) {
    console.error('An unexpected error occurred during Supabase insertion:', e);
    if (e instanceof Error) {
      console.error('Error name:', e.name);
      console.error('Error message:', e.message);
      console.error('Error stack:', e.stack);
    }
  }
}

migrateJobs();