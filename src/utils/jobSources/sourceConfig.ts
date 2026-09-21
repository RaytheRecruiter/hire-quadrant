// Seed list of public ATS boards to ingest, replacing the single inline
// XmlSource literal that used to live in scripts/migrateJobs.ts. These are
// public identifiers (the slug in each company's own public careers URL),
// not secrets, so a plain code array is fine — same convention the old
// single-entry XmlSource[] already used.
//
// Verified live 2026-09-21 (job counts at verification time, will drift):
//   Greenhouse       stripe    670 jobs
//   Lever            palantir  312 jobs
//   Ashby            notion    128 jobs
//   SmartRecruiters  Equinox   705 jobs
//   SmartRecruiters  Grab      424 jobs
//
// A 200 response from a platform's API isn't proof of an active board --
// several guessed SmartRecruiters company IDs came back with totalFound: 0
// during verification. Only list boards confirmed to have jobs, and
// re-verify here if a source silently drops to zero (a closed board is not
// a bug in the adapter).
//
// A DB-backed source table with an admin add/remove UI is the right
// long-term answer once this list grows past a handful of PR-managed
// entries -- out of scope for this pass.

import { createJobDivaAdapter } from './jobdivaAdapter';
import { createGreenhouseAdapter } from './greenhouseAdapter';
import { createLeverAdapter } from './leverAdapter';
import { createAshbyAdapter } from './ashbyAdapter';
import { createSmartRecruitersAdapter } from './smartrecruitersAdapter';
import { JobSourceAdapter } from './types';

export function buildJobSourceAdapters(): JobSourceAdapter[] {
  return [
    createJobDivaAdapter(),
    createGreenhouseAdapter('stripe', 'Stripe'),
    createLeverAdapter('palantir', 'Palantir'),
    createAshbyAdapter('notion', 'Notion'),
    createSmartRecruitersAdapter('Equinox', 'Equinox'),
    createSmartRecruitersAdapter('Grab', 'Grab'),
  ];
}
