# AI Job Prioritization Engine — Implementation Plan

## Overview

Prioritize jobs a candidate sees based on their resume/profile data, without undermining the sponsored jobs revenue model. Sponsored jobs always rank first; AI re-orders everything else by relevance.

## Priority Formula

```
display_order = sponsored_tier (DESC), relevance_score (DESC), posted_date (DESC)
```

- **Sponsored tier**: Paid placements always appear above organic results. Future tiers (e.g., Featured, Premium, Basic) can slot in here.
- **Relevance score**: 0–100, computed from candidate profile vs. job attributes.
- **Posted date**: Recency tiebreaker within the same relevance band.

## Phase 1: Resume Parsing → Profile Enrichment

### Goal
Extract structured data from uploaded resumes so we have something to match against.

### Database Changes

```sql
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_years integer;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS preferred_locations text[] DEFAULT '{}';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS preferred_job_types text[] DEFAULT '{}';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS parsed_title text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS profile_embedding vector(384);
```

### Implementation

1. **Resume upload hook** — When a candidate uploads a resume (already handled in ProfilePage.tsx → Supabase Storage), trigger a parsing step.

2. **Parsing approach** — Two options:
   - **Option A (simple, fast)**: Use regex/keyword extraction on the resume text (already have pdf.js + docx parsing utils). Extract skills by matching against a known skills taxonomy. No API cost.
   - **Option B (AI-powered, better accuracy)**: Send resume text to Claude Haiku to extract structured data: `{ skills: [], experience_years: number, title: string, locations: [] }`. Cost: ~$0.001/resume.
   
   **Recommendation**: Start with Option B. Haiku is cheap, accurate, and handles edge cases (non-standard formats, abbreviations) that regex misses.

3. **Store parsed data** in the `candidates` table columns above.

4. **UI**: Show extracted skills as tags on the profile page. Let candidates edit/confirm them.

### Files to Modify
- `src/pages/ProfilePage.tsx` — Add skills display + edit UI after resume upload
- `src/hooks/useResumeParser.ts` — New hook: upload resume → call parsing endpoint → save to candidates table
- New Supabase Edge Function or server-side script for Haiku API call

---

## Phase 2: Job Relevance Scoring

### Goal
Score each job's relevance to a specific candidate in real-time.

### Scoring Factors

| Factor | Weight | Method |
|--------|--------|--------|
| Skill match | 40% | Jaccard similarity: `|candidate_skills ∩ job_requirements| / |candidate_skills ∪ job_requirements|` |
| Location match | 25% | Exact match = 1.0, same state = 0.5, remote = 0.8, mismatch = 0.0 |
| Job type match | 15% | Exact match against preferred_job_types |
| Title/seniority match | 15% | Keyword overlap between parsed_title and job title |
| Recency bonus | 5% | Jobs posted in last 7 days get a small boost |

### Implementation

1. **Client-side scoring** (Phase 2a — simplest, no backend changes):
   - After fetching jobs from Supabase, score them in the browser using the candidate's profile data
   - Sort by: `is_sponsored DESC, score DESC, posted_date DESC`
   - This keeps the existing Supabase query structure and adds scoring as a presentation layer

2. **Server-side scoring** (Phase 2b — better for scale):
   - Create a Supabase Edge Function that accepts candidate_id and returns scored + sorted job IDs
   - Use `pg_trgm` or a custom SQL function for text similarity
   - Cache scores per candidate with a 24-hour TTL (invalidate on profile update or new jobs)

**Recommendation**: Start with Phase 2a (client-side). The job count is small enough that browser scoring is fast. Move to 2b only if performance becomes an issue.

### Files to Modify
- `src/utils/jobScoring.ts` — New utility: `scoreJobs(jobs: Job[], candidate: Candidate): ScoredJob[]`
- `src/contexts/JobContext.tsx` — After fetching jobs, apply scoring if candidate is logged in
- `src/components/JobCard.tsx` — Optional: show a "Match %" badge

---

## Phase 3: Sponsored Jobs Integration

### Goal
Ensure paid placements always appear above organic results.

### Database Changes

```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sponsor_tier integer DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sponsor_start_date timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sponsor_end_date timestamptz;
```

### Implementation

1. **Sorting logic**: All sponsored jobs (where `is_sponsored = true` AND within date range) appear first, sorted by `sponsor_tier DESC, posted_date DESC`.

2. **Admin controls**: Add a "Sponsor" toggle in the admin Jobs tab to mark jobs as sponsored and set tier/dates.

3. **Visual indicator**: Sponsored jobs get a subtle "Sponsored" badge on the JobCard — standard for job boards, sets user expectations.

4. **Revenue model compatibility**:
   - Free tier: Jobs appear in organic results, ranked by AI relevance
   - Paid sponsorship: Jobs pinned to top regardless of relevance score
   - This is the same model as LinkedIn, Indeed, and ZipRecruiter

### Files to Modify
- `src/pages/Admin.tsx` — Add sponsor controls to jobs management
- `src/components/JobCard.tsx` — Add "Sponsored" badge
- `src/contexts/JobContext.tsx` — Sort sponsored first, then by relevance

---

## Phase 4: Learning & Feedback Loop (Future)

### Goal
Improve relevance over time using behavioral signals.

### Signals to Track (already in `job_tracking`)
- **Views**: Candidate viewed job details (weak positive signal)
- **Applies**: Candidate applied (strong positive signal)
- **Saves**: Candidate saved job (medium positive signal)
- **Skips**: Candidate saw card but didn't click (weak negative signal)

### Implementation
- Use `job_tracking` data to build a simple collaborative filter: "candidates with similar profiles who applied to Job X also applied to Job Y"
- Weight recent behavior more heavily than old behavior
- This is Phase 4 because it requires enough data volume to be meaningful

---

## Implementation Order

| Phase | Effort | Dependencies | Impact |
|-------|--------|-------------|--------|
| Phase 1: Resume parsing | 2-3 days | Haiku API key | Enables all downstream scoring |
| Phase 2a: Client-side scoring | 1-2 days | Phase 1 | Immediate UX improvement |
| Phase 3: Sponsored jobs | 1 day | None (can do in parallel) | Revenue model ready |
| Phase 2b: Server-side scoring | 2-3 days | Phase 2a working | Scale + performance |
| Phase 4: Feedback loop | 3-5 days | Phases 1-3 + data volume | Continuous improvement |

**Total for MVP (Phases 1 + 2a + 3): ~4-6 days**

---

## Key Design Decisions

1. **Sponsored always wins** — AI never demotes a paid placement. This protects the revenue model.
2. **Transparent to candidates** — Show "X% match" and "Sponsored" badges so candidates understand why they see what they see.
3. **Opt-in enrichment** — Candidates can edit/remove extracted skills. The AI suggests, the user confirms.
4. **Graceful degradation** — If a candidate has no profile data, fall back to recency sort (current behavior). No data = no personalization, not a broken experience.
5. **Cost control** — Haiku at ~$0.001/resume is negligible. Client-side scoring has zero ongoing API cost.
