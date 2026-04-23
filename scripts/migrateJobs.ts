// scripts/migrateJobs.ts
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fetchAndParseJobsXmlWithSources, XmlSource } from '../src/utils/xmlParser';
import { deriveJobCategory } from '../src/utils/deriveJobCategory';

// Load environment variables from supabaseapi.env file
dotenv.config({ path: path.resolve(process.cwd(), 'supabaseapi.env') });

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

        const jobsToUpsert = allJobs.map(job => ({
            id: job.externalJobId, // Use the externalJobId as the primary key
            externalJobId: job.externalJobId,
            title: job.title,
            description: job.description,
            externalUrl: job.externalUrl,
            postedDate: job.postedDate,
            sourceCompany: job.sourceCompany,
            sourceXmlFile: job.sourceXmlFile,
            company: job.company,
            location: job.location,
            type: job.type,
            salary: job.salary,
            category: deriveJobCategory(job.title),
        }));

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