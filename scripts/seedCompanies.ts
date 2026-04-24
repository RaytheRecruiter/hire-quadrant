// scripts/seedCompanies.ts
//
// Phase 5 seed: creates 25 fake companies across 5 industries with
// 5-15 approved reviews each, 2 pending reviews for moderation queue,
// 1 super admin (two emails), 2 employer accounts that each claim a
// seeded company. Passwords are printed to console at the end.
//
// Idempotent by email + slug — running twice won't duplicate.
//
// Requires: VITE_SUPABASE_URL + VITE_SUPABASE_SERVICE_ROLE_KEY in
// supabaseapi.env (same env file migrateJobs.ts reads).
//
// Run: npm run seed:companies

import dotenv from 'dotenv';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

dotenv.config({ path: path.resolve(process.cwd(), 'supabaseapi.env') });

const SUPER_ADMIN_EMAILS = [
  'rafael.maldonado.sr@gmail.com',
  'rrainet19138@gmail.com',
];

const INDUSTRIES: Array<{ name: string; sizes: string[]; titles: string[] }> = [
  {
    name: 'Technology',
    sizes: ['11-50', '51-200', '201-500', '501-1000', '1001-5000'],
    titles: ['Software Engineer', 'Product Manager', 'DevOps Engineer', 'Data Scientist', 'UX Designer'],
  },
  {
    name: 'Healthcare',
    sizes: ['51-200', '201-500', '501-1000', '1001-5000', '5000+'],
    titles: ['Registered Nurse', 'Medical Assistant', 'Clinical Coordinator', 'Healthcare Analyst', 'Physical Therapist'],
  },
  {
    name: 'Finance',
    sizes: ['51-200', '201-500', '501-1000', '1001-5000', '5000+'],
    titles: ['Financial Analyst', 'Account Executive', 'Portfolio Manager', 'Compliance Officer', 'Controller'],
  },
  {
    name: 'Retail',
    sizes: ['201-500', '501-1000', '1001-5000', '5000+'],
    titles: ['Store Manager', 'Merchandise Planner', 'Buyer', 'Sales Associate', 'Operations Lead'],
  },
  {
    name: 'Manufacturing',
    sizes: ['51-200', '201-500', '501-1000', '1001-5000'],
    titles: ['Production Supervisor', 'Quality Engineer', 'Supply Chain Analyst', 'Operations Manager', 'Safety Coordinator'],
  },
];

const DEFAULT_PASSWORD = 'TestPass123!';

// Curated US-English strings — replaces faker.lorem (which emits Latin).
const EN_DESCRIPTIONS = [
  'A growing team focused on delivering practical software that solves real problems for customers. We believe in craft, transparency, and sustainable pace.',
  'We build tools that help businesses operate more efficiently. Our culture prioritizes clear communication, deep work, and respect for each other\'s time.',
  'A product-led organization that invests in engineering excellence and healthy team dynamics. We ship regularly and iterate based on customer feedback.',
  'Mission-driven company dedicated to improving outcomes through technology. We partner closely with customers and treat feedback as a gift.',
  'We combine domain expertise with modern engineering to deliver reliable products. Our team is distributed, inclusive, and proud of what we ship.',
  'An established player in our space, known for rigorous quality standards and long-term customer relationships. We invest in our people and our infrastructure.',
];
const EN_TITLES = [
  'Great place to grow early in your career', 'Solid compensation, rigid management',
  'Steady work, decent benefits, slow pace', 'Real impact, real long hours',
  'Good team, bureaucratic process', 'Healthy culture but flat career path',
  'Strong mentorship from senior engineers', 'Fun product, disorganized execution',
  'Excellent leadership, thin staffing', 'Fair pay, great work-life balance',
  'Mission-driven team but tight budgets', 'Interesting problems, limited upward mobility',
  'Friendly coworkers, inconsistent management', 'Fast-paced, supportive, worth the ride',
  'Respectful environment, outdated tooling', 'Remote-friendly with real ownership',
  'High expectations, high rewards', 'Decent starting role, limited long-term growth',
  'Steep learning curve, real investment in people', 'Fair review cycles, good benefits package',
];
const EN_PROS = [
  'Competitive pay and strong benefits. Health, dental, and 401(k) match are all above market.',
  'Flexible hours and legitimate remote work. Core hours are respected and the culture trusts you to manage your own time.',
  'Smart, supportive coworkers. Most problems get solved by a quick Slack ping and the team genuinely celebrates wins.',
  'Real learning and growth opportunities, including a generous education stipend and paid conferences.',
  'Great leadership that communicates clearly. Leadership shares strategy openly in all-hands and actually answers tough questions.',
  'Meaningful work that helps real customers. You can see the impact of what you ship in user feedback.',
  'Modern tech stack and the budget to upgrade tooling as needed.',
  'Reasonable workload, PTO is respected, and on-call is handled fairly.',
  'Inclusive culture with active ERGs and visible investment in DEI.',
  'Strong onboarding — buddy system, shadowing, and clear 30/60/90 goals.',
  'Healthy feedback culture. Performance reviews are specific and actionable, not a surprise.',
  'Generous parental leave and family support.',
  'Transparent compensation bands — levels and salaries are documented internally.',
  'Good balance of autonomy and support. You drive your own work but never feel abandoned.',
  'Reasonable meeting load — async-first where it makes sense.',
];
const EN_CONS = [
  'Salary bands compress after a few years — raises do not keep up with promotions.',
  'Legacy systems still running in production; migrations get deprioritized each quarter.',
  'Promotion criteria can feel opaque and vary by manager.',
  'Some teams are understaffed; on-call rotation feels heavy.',
  'Reorgs happen frequently and can disrupt momentum mid-project.',
  'Cross-team communication is slower than it should be at this size.',
  'Benefits are good but office perks have been trimmed post-pandemic.',
  'Performance reviews are thorough but time-consuming.',
  'Tight deadlines occasionally lead to late nights near launches.',
  'Remote employees sometimes feel out of the loop on decisions made in the office.',
  'Documentation is inconsistent — tribal knowledge still dominates.',
  'Hiring bar is high which slows team growth.',
  'Some tooling investments trail industry peers.',
  'Office locations are limited for hybrid employees.',
  'Career ladders for specialists are less developed than for generalists.',
];

function getClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in supabaseapi.env');
    process.exit(1);
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function randBetween(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function ensureAuthUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  meta: Record<string, unknown>,
): Promise<string> {
  // Paginate through all users to find a match (listUsers caps at ~1000/page)
  const target = email.toLowerCase();
  const findByEmail = async (): Promise<string | null> => {
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage });
      const users = data?.users ?? [];
      const hit = users.find((u) => u.email?.toLowerCase() === target);
      if (hit) return hit.id;
      if (users.length < perPage) return null; // last page
      page++;
      if (page > 50) return null; // safety cap at 50k users
    }
  };

  const existingId = await findByEmail();
  if (existingId) return existingId;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error || !data.user) {
    // If createUser rejects as duplicate, the user exists but was missed
    // on the first pagination sweep (racy insert between pages). Re-scan.
    if (error?.message?.toLowerCase().includes('already been registered')) {
      const retryId = await findByEmail();
      if (retryId) return retryId;
    }
    console.error(`  createUser(${email}) failed. Full error:`, JSON.stringify(error, null, 2));
    throw new Error(`createUser(${email}): ${error?.message}`);
  }
  return data.user.id;
}

async function setUserRole(supabase: SupabaseClient, userId: string, role: string, companyId: string | null = null) {
  // Upsert by primary key (user_profiles.id = auth.users.id)
  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      { id: userId, role, company_id: companyId, is_approved: true, name: role },
      { onConflict: 'id' },
    );
  if (error) throw new Error(`setUserRole(${userId}, ${role}): ${error.message}`);
}

async function seedCompanies(supabase: SupabaseClient): Promise<Array<{ id: string; slug: string; industry: string; name: string; emailDomain: string }>> {
  const created: Array<{ id: string; slug: string; industry: string; name: string; emailDomain: string }> = [];

  for (const industry of INDUSTRIES) {
    for (let i = 0; i < 5; i++) {
      const name = faker.company.name().replace(/[",]/g, '').slice(0, 60);
      const slug = slugify(name);
      const emailDomain = `${slug}.example.com`;

      // Skip if slug already exists
      const { data: existing } = await supabase
        .from('companies')
        .select('id, slug, industry, name, email_domain')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        created.push({
          id: existing.id,
          slug: existing.slug,
          industry: existing.industry || industry.name,
          name: existing.name,
          emailDomain: existing.email_domain || emailDomain,
        });
        continue;
      }

      const { data, error } = await supabase
        .from('companies')
        .insert({
          name,
          display_name: name,
          slug,
          description: pick(EN_DESCRIPTIONS),
          industry: industry.name,
          size: pick(industry.sizes),
          location: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
          website: `https://${slug}.example.com`,
          logo: null,
          email_domain: emailDomain,
          socials: {
            linkedin: `https://linkedin.com/company/${slug}`,
            twitter: `https://x.com/${slug.replace(/-/g, '')}`,
          },
          is_active: true,
          contact_email: `hr@${emailDomain}`,
        })
        .select('id, slug, industry, name, email_domain')
        .single();

      if (error || !data) {
        console.warn(`  skip ${name}: ${error?.message}`);
        continue;
      }

      created.push({
        id: data.id,
        slug: data.slug,
        industry: data.industry || industry.name,
        name: data.name,
        emailDomain: data.email_domain || emailDomain,
      });
    }
  }

  return created;
}

async function seedReviewerUsers(supabase: SupabaseClient, count: number): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const email = `seed-reviewer-${i + 1}@hirequadrant-seed.test`;
    const id = await ensureAuthUser(supabase, email, DEFAULT_PASSWORD, {
      name: faker.person.fullName(),
      role: 'candidate',
    });
    await setUserRole(supabase, id, 'candidate');
    ids.push(id);
  }
  return ids;
}

async function seedReviewsFor(
  supabase: SupabaseClient,
  company: { id: string; industry: string },
  reviewerIds: string[],
  forcePending = 0,
) {
  const industry = INDUSTRIES.find((i) => i.name === company.industry) ?? INDUSTRIES[0];
  const target = randBetween(5, 15);

  // Dedup reviewers per company (unique constraint)
  const pool = [...reviewerIds].sort(() => Math.random() - 0.5).slice(0, Math.min(target, reviewerIds.length));

  for (let i = 0; i < pool.length; i++) {
    const authorId = pool[i];
    const status: 'pending' | 'approved' = i < forcePending ? 'pending' : 'approved';

    const overall = randBetween(2, 5);
    const within = (base: number) => Math.max(1, Math.min(5, base + randBetween(-1, 1)));

    // Skip if this reviewer already reviewed this company
    const { data: existing } = await supabase
      .from('company_reviews')
      .select('id')
      .eq('company_id', company.id)
      .eq('author_id', authorId)
      .maybeSingle();
    if (existing) continue;

    const { error } = await supabase.from('company_reviews').insert({
      company_id: company.id,
      author_id: authorId,
      rating_overall: overall,
      rating_work_life: within(overall),
      rating_compensation: within(overall),
      rating_management: within(overall),
      rating_culture: within(overall),
      rating_career_growth: within(overall),
      title: pick(EN_TITLES),
      pros: pick(EN_PROS),
      cons: pick(EN_CONS),
      employment_status: pick(['current', 'former']),
      job_title: pick(industry.titles),
      is_anonymous: Math.random() < 0.35,
      status,
    });

    if (error) console.warn(`  review skip (${company.id}): ${error.message}`);
  }
}

async function main() {
  const supabase = getClient();

  console.log('\nPhase 5 seed starting...');

  console.log('\n[1/5] Ensuring super admin accounts...');
  const failedSuperAdmins: string[] = [];
  for (const email of SUPER_ADMIN_EMAILS) {
    try {
      const id = await ensureAuthUser(supabase, email, DEFAULT_PASSWORD, { role: 'admin', name: email.split('@')[0] });
      await setUserRole(supabase, id, 'admin');
      console.log(`  ✓ ${email}  (id: ${id.slice(0, 8)}...)`);
    } catch (err) {
      console.warn(`  ⚠ skipping ${email} (${err instanceof Error ? err.message : err}) — add manually later`);
      failedSuperAdmins.push(email);
    }
  }

  console.log('\n[2/5] Seeding 25 companies across 5 industries...');
  const companies = await seedCompanies(supabase);
  console.log(`  ✓ ${companies.length} companies ready`);

  console.log('\n[3/5] Seeding 20 reviewer accounts...');
  const reviewerIds = await seedReviewerUsers(supabase, 20);
  console.log(`  ✓ ${reviewerIds.length} reviewers ready`);

  console.log('\n[4/5] Generating reviews (5-15 per company, 2 total pending)...');
  let pendingBudget = 2;
  for (const c of companies) {
    const forcePending = pendingBudget > 0 ? 1 : 0;
    pendingBudget -= forcePending;
    await seedReviewsFor(supabase, c, reviewerIds, forcePending);
  }
  console.log('  ✓ reviews seeded');

  console.log('\n[5/5] Seeding 2 employer accounts (each claiming one company)...');
  const employerTargets = companies.slice(0, 2);
  const employerCreds: Array<{ email: string; password: string; company: string }> = [];

  for (let i = 0; i < employerTargets.length; i++) {
    const c = employerTargets[i];
    const email = `employer${i + 1}@${c.emailDomain}`;
    const id = await ensureAuthUser(supabase, email, DEFAULT_PASSWORD, {
      role: 'company',
      name: `Employer ${i + 1}`,
      company_name: c.name,
    });
    // Directly mark as company_admin + owner; bypass RPC (service role)
    await supabase.from('company_admins').upsert(
      { company_id: c.id, user_id: id, role: 'owner' },
      { onConflict: 'company_id,user_id' },
    );
    await supabase
      .from('companies')
      .update({ claimed_at: new Date().toISOString() })
      .eq('id', c.id)
      .is('claimed_at', null);
    await setUserRole(supabase, id, 'company', c.id);

    employerCreds.push({ email, password: DEFAULT_PASSWORD, company: c.name });
    console.log(`  ✓ ${email} claims "${c.name}"`);
  }

  console.log('\n────────────────────────────────────────────────');
  console.log('SEED CREDENTIALS (all passwords: ' + DEFAULT_PASSWORD + ')');
  console.log('────────────────────────────────────────────────');
  console.log('\nSuper admins:');
  SUPER_ADMIN_EMAILS.forEach((e) => {
    const suffix = failedSuperAdmins.includes(e) ? '  (NOT CREATED — add manually)' : '';
    console.log(`  ${e}${suffix}`);
  });
  console.log('\nEmployer test accounts:');
  employerCreds.forEach((c) => console.log(`  ${c.email}  →  ${c.company}`));
  console.log('\nReviewer test accounts: seed-reviewer-1..20@hirequadrant-seed.test');
  console.log('────────────────────────────────────────────────\n');
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
