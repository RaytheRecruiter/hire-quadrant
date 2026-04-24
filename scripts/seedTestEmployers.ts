// scripts/seedTestEmployers.ts
//
// Creates two ready-to-log-in test employer accounts:
//   test-employer-1@hirequadrant-test.com / TestBiz123!
//   test-employer-2@hirequadrant-test.com / TestBiz123!
//
// Each gets a freshly-claimed company (Test Business One/Two) and
// is wired in as a company_admin so /company-dashboard works.
//
// Idempotent: safe to re-run.
//
// Run: npm run seed:test-employers

import dotenv from 'dotenv';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), 'supabaseapi.env') });

const PASSWORD = 'TestBiz123!';

const TEST_EMPLOYERS: Array<{
  email: string;
  name: string;
  company: { name: string; slug: string; industry: string; size: string; location: string; description: string };
}> = [
  {
    email: 'test-employer-1@hirequadrant-test.com',
    name: 'Test Employer One',
    company: {
      name: 'Test Business One',
      slug: 'test-business-one',
      industry: 'Technology',
      size: '11-50',
      location: 'Remote',
      description: 'A test company for exploring HireQuadrant employer features.',
    },
  },
  {
    email: 'test-employer-2@hirequadrant-test.com',
    name: 'Test Employer Two',
    company: {
      name: 'Test Business Two',
      slug: 'test-business-two',
      industry: 'Finance',
      size: '51-200',
      location: 'New York, NY',
      description: 'A second test company to compare employer flows.',
    },
  },
];

function getClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in supabaseapi.env');
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function findUserByEmail(supabase: SupabaseClient, email: string): Promise<string | null> {
  const target = email.toLowerCase();
  let page = 1;
  while (page <= 50) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    const users = data?.users ?? [];
    const hit = users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit.id;
    if (users.length < 1000) return null;
    page++;
  }
  return null;
}

async function ensureAuthUser(supabase: SupabaseClient, email: string, name: string): Promise<string> {
  const existing = await findUserByEmail(supabase, email);
  if (existing) return existing;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'company', name },
  });
  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes('already been registered')) {
      const retry = await findUserByEmail(supabase, email);
      if (retry) return retry;
    }
    throw new Error(`createUser(${email}): ${error?.message}`);
  }
  return data.user.id;
}

async function main() {
  const supabase = getClient();
  console.log('Seeding test employer accounts...\n');

  for (const te of TEST_EMPLOYERS) {
    const uid = await ensureAuthUser(supabase, te.email, te.name);
    console.log(`  ✓ auth user ${te.email} (id: ${uid.slice(0, 8)}...)`);

    // Upsert the company
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', te.company.slug)
      .maybeSingle();

    let companyId: string;
    if (existing) {
      companyId = existing.id;
      await supabase
        .from('companies')
        .update({
          claimed_at: new Date().toISOString(),
          email_domain: 'hirequadrant-test.com',
          contact_email: te.email,
          is_active: true,
        })
        .eq('id', companyId);
    } else {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: te.company.name,
          display_name: te.company.name,
          slug: te.company.slug,
          industry: te.company.industry,
          size: te.company.size,
          location: te.company.location,
          description: te.company.description,
          email_domain: 'hirequadrant-test.com',
          contact_email: te.email,
          is_active: true,
          claimed_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (error || !data) throw new Error(`insert company ${te.company.slug}: ${error?.message}`);
      companyId = data.id;
    }
    console.log(`  ✓ company ${te.company.slug}`);

    // Company admin link
    await supabase
      .from('company_admins')
      .upsert({ company_id: companyId, user_id: uid, role: 'owner' }, { onConflict: 'company_id,user_id' });

    // user_profiles: role=company + company_id
    await supabase
      .from('user_profiles')
      .upsert(
        { id: uid, name: te.name, role: 'company', company_id: companyId, is_approved: true },
        { onConflict: 'id' },
      );

    console.log(`  ✓ linked as admin + profile updated\n`);
  }

  console.log('────────────────────────────────────────────────');
  console.log('TEST EMPLOYER CREDENTIALS (password: ' + PASSWORD + ')');
  console.log('────────────────────────────────────────────────');
  TEST_EMPLOYERS.forEach((t) => console.log(`  ${t.email}  →  ${t.company.name}`));
  console.log('────────────────────────────────────────────────');
  console.log('\nLog in at /login, you will land on /company-dashboard.');
}

main().catch((e) => {
  console.error('Test employer seed failed:', e);
  process.exit(1);
});
