// Replaces migrateJobs.ts's old case-sensitive exact-match company lookup
// (which left ~90% of jobs with company_id = null — confirmed live,
// 20/208 rows linked). Two upgrades, both scoped to ingest-time only:
//
// 1. Case-insensitive match via .ilike() instead of case-sensitive .in() —
//    mirrors the normalization already validated in
//    supabase/migrations/20260520_backfill_company_id.sql's one-time
//    backfill, now applied on every run instead of only periodically.
// 2. Auto-create a companies row when nothing matches, since pulling from
//    dozens of real companies across 4 new platforms will produce far
//    more misses than the single-company JobDiva feed ever did.
//
// Known limitation (accepted trade-off, not a bug to fix here): this does
// NOT catch punctuation-only variants like "Quadrant Inc" vs
// "Quadrant, Inc." — see supabase/migrations/20260423_fix_jobdiva_company_name.sql
// and 20260812_link_hirequadrant_xml_to_quadrant_inc.sql for that history.
// Full fuzzy matching risks incorrectly merging two different companies,
// so it's intentionally out of scope; occasional near-duplicates are an
// acceptable trade-off, same as happened historically.

import type { SupabaseClient } from '@supabase/supabase-js';

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Cache is shared across a whole ingestion run (passed in by the caller)
// so the same company name across multiple sources/jobs only round-trips
// to the DB once.
export type CompanyIdCache = Map<string, string | null>;

export async function resolveCompanyId(
  supabase: SupabaseClient,
  rawCompanyName: string,
  cache: CompanyIdCache,
): Promise<string | null> {
  const companyName = rawCompanyName.trim();
  if (!companyName) return null;
  const norm = companyName.toLowerCase();

  if (cache.has(norm)) return cache.get(norm)!;

  // 1. Case-insensitive exact match (no wildcards — this is an equality
  //    check, not a substring search, so "Acme" won't match "Acme Labs").
  const { data: matches } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', companyName);

  const exact = matches?.find((c) => c.name.trim().toLowerCase() === norm);
  if (exact) {
    cache.set(norm, exact.id);
    return exact.id;
  }

  // 2. Auto-create. Idempotent on slug via the same "insert, and on
  //    collision re-select" pattern scripts/seedCompanies.ts uses.
  const slug = slugify(companyName);
  const { data: created, error } = await supabase
    .from('companies')
    .insert({ name: companyName, display_name: companyName, slug, is_active: true })
    .select('id')
    .single();

  if (!error && created) {
    cache.set(norm, created.id);
    return created.id;
  }

  // Slug collision (e.g. two jobs for the same new company resolving in
  // the same run) — the row now exists from the other insert, fetch it.
  const { data: existing } = await supabase.from('companies').select('id').eq('slug', slug).maybeSingle();
  if (existing) {
    cache.set(norm, existing.id);
    return existing.id;
  }

  console.warn(`resolveCompanyId: could not resolve or create company "${companyName}"`, error);
  cache.set(norm, null);
  return null;
}
