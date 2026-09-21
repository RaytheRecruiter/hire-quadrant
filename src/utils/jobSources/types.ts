// Shared shape every ingestion source (JobDiva XML + the 4 new ATS platform
// adapters) normalizes into. Deliberately matches exactly the fields
// scripts/migrateJobs.ts actually upserts into `jobs` — company_id, lat/lng,
// and category are derived downstream in the orchestrator, not here.

export interface NormalizedJob {
  externalJobId: string; // raw, unprefixed ID as it appears in the source platform
  title: string;
  description: string; // HTML already stripped
  company: string;
  location?: string;
  type?: string; // 'full-time' | 'part-time' | 'contract' | 'contract-to-hire' | 'internship'
  salary?: string;
  externalUrl?: string;
  postedDate: string; // ISO 8601
  sourceCompany: string; // human-readable label shown in admin dashboards, e.g. "Greenhouse: Stripe"
  sourceXmlFile: string; // stable per-source identifier used for scoped stale-delete, e.g. "greenhouse:stripe" or "hirequadrant.xml"
}

export type SourcePlatform = 'jobdiva' | 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters';

export interface JobSourceAdapter {
  id: string; // same value as sourceXmlFile on every job it produces
  platform: SourcePlatform;
  fetchJobs(): Promise<NormalizedJob[]>;
}
