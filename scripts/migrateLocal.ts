// scripts/migrateLocal.ts — One-time migration using a locally downloaded XML file
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { parseJobsXml } from '../src/utils/xmlParser';
import { deriveJobCategory } from '../src/utils/deriveJobCategory';

dotenv.config({ path: path.resolve(process.cwd(), 'supabaseapi.env') });

const getSupabaseClient = () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
    const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('Error: Missing Supabase env vars.');
        process.exit(1);
    }
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false },
    });
};

async function migrateFromLocal() {
    console.log('--- Local migration script started ---');
    const supabase = getSupabaseClient();

    const xmlPath = '/tmp/hirequadrant_jobs.xml';
    if (!fs.existsSync(xmlPath)) {
        console.error(`XML file not found at ${xmlPath}`);
        process.exit(1);
    }

    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    console.log(`Read ${xmlContent.length} bytes from ${xmlPath}`);

    const allJobs = parseJobsXml(xmlContent, 'hirequadrant.xml', 'hirequadrant.xml');
    console.log(`Parsed ${allJobs.length} jobs`);

    if (allJobs.length === 0) {
        console.log('No jobs parsed. Exiting.');
        return;
    }

    // Log a sample description to verify formatting
    console.log('\n--- Sample description (first job) ---');
    console.log(allJobs[0].description.substring(0, 500));
    console.log('--- End sample ---\n');

    const jobsToUpsert = allJobs.map(job => ({
        id: job.externalJobId,
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

    const { error } = await supabase
        .from('jobs')
        .upsert(jobsToUpsert, { onConflict: 'externalJobId' });

    if (error) {
        console.error('Supabase upsert error:', error);
    } else {
        console.log(`Successfully upserted ${jobsToUpsert.length} jobs.`);
    }

    console.log('--- Local migration script finished ---');
}

migrateFromLocal();
