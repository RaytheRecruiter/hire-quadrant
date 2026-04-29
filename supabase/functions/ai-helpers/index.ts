// Supabase Edge Function: ai-helpers
// Claude-powered endpoints for:
//  - POST /job-description: input bullets/role → generates full job description
//  - POST /screen-candidate: input job desc + applicant summary → candidate summary + fit score
//
// Keeps the ANTHROPIC_API_KEY server-side so it never ships to the browser.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const MODEL = Deno.env.get('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function callClaude(system: string, userMessage: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data?.content?.[0]?.text || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    if (path === 'job-description') {
      const body = await req.json();
      const { title, company, location, bullets } = body;
      if (!title) return new Response('title required', { status: 400, headers: corsHeaders });

      const system = `You are an expert recruiter and copywriter. Write professional job postings
that are clear, inclusive, and compelling. Use a warm, conversational tone.
Structure: brief intro paragraph, "What You'll Do" with 4-6 bullets, "What We're Looking For"
with 4-6 bullets, "Nice to Have" with 2-3 bullets, "What We Offer" with 3-5 bullets.
Avoid stuffy corporate jargon. Do not invent benefits or compensation — only use what was provided.`;

      const userMsg = `Generate a full job description for this role:
- Title: ${title}
- Company: ${company || 'the company'}
- Location: ${location || 'Remote'}
- Key points to incorporate:
${(bullets || []).map((b: string) => `  - ${b}`).join('\n')}`;

      const description = await callClaude(system, userMsg);
      return new Response(JSON.stringify({ description }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === 'screen-candidate') {
      const body = await req.json();
      const { jobTitle, jobDescription, candidateName, candidateSummary, screeningAnswers } = body;

      const system = `You are an experienced technical recruiter helping a hiring manager quickly triage applicants.
Return JSON only, no preamble, no code fences. Output shape:
{
  "summary": "one short paragraph (max 60 words) summarizing the candidate's fit",
  "fit_score": 0-100 integer,
  "strengths": ["bullet 1", "bullet 2", "bullet 3"],
  "concerns": ["bullet 1", "bullet 2"]
}
Base your analysis on the provided screening answers and candidate info only. Do not invent experience.`;

      const userMsg = `Job: ${jobTitle}
Job description:
${jobDescription || 'Not provided'}

Candidate: ${candidateName || 'Anonymous'}
Candidate info: ${candidateSummary || 'No additional info'}

Screening answers:
${(screeningAnswers || []).map((a: any, i: number) => `${i + 1}. ${a.answer}`).join('\n') || 'None'}`;

      const raw = await callClaude(system, userMsg);
      // Strip any ```json fences if Claude returns them despite instructions
      const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { summary: raw, fit_score: 0, strengths: [], concerns: [] };
      }
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === 'job-match') {
      const body = await req.json();
      const { resumeText, jobTitle, jobDescription, jobCompany } = body;
      if (!resumeText || !jobTitle || !jobDescription) {
        return new Response('resumeText, jobTitle, jobDescription required', { status: 400, headers: corsHeaders });
      }

      const system = `You are a job matching assistant. Score how well a resume matches a job description on a scale of 0-100.
Return JSON only, no preamble, no code fences. Output shape:
{
  "match_score": <0-100 integer>,
  "matching_skills": ["skill1", "skill2", "skill3"]
}
match_score: 0=no match, 100=perfect match. Be realistic, most scores are 30-75.
matching_skills: list 3-5 skills from the resume that match the job requirements.`;

      const userMsg = `RESUME:
${resumeText.slice(0, 3000)}

JOB: ${jobTitle}${jobCompany ? ` at ${jobCompany}` : ''}
${jobDescription.slice(0, 2000)}

Score the match between this resume and job.`;

      const raw = await callClaude(system, userMsg);
      const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { match_score: 0, matching_skills: [] };
      }
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === 'career-paths') {
      const body = await req.json();
      const { jobTitle, jobDescription } = body;
      if (!jobTitle) {
        return new Response('jobTitle required', { status: 400, headers: corsHeaders });
      }

      const system = `You are a career counselor. Given a job role, suggest 3-5 realistic next career steps.
Return JSON only, no preamble, no code fences. Output shape:
{
  "paths": [
    {
      "role": "Next Role Title",
      "skill_transfer_pct": 75,
      "salary_delta_low": 10000,
      "salary_delta_high": 25000,
      "time_to_transition": "6-12 months",
      "missing_skills": ["skill1", "skill2", "skill3"],
      "match_label": "high"
    }
  ]
}
Rules:
- skill_transfer_pct: realistic overlap (0-100)
- salary_delta: conservative estimates based on role progression
- time_to_transition: realistic time to build missing skills
- missing_skills: max 3 key gaps to close
- match_label: "high" (>=70%), "medium" (50-69%), "low" (<50%) based on skill_transfer_pct
- Order by likelihood/commonness of transition`;

      const userMsg = `Current role: ${jobTitle}
${jobDescription ? `Description:\n${jobDescription.slice(0, 1000)}` : ''}

Suggest 3-5 realistic next career steps for someone in this role.`;

      const raw = await callClaude(system, userMsg);
      const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { paths: [] };
      }
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === 'interview-feedback') {
      const body = await req.json();
      const { question, answer, role, questionType } = body;
      if (!question || !answer) {
        return new Response('question and answer required', { status: 400, headers: corsHeaders });
      }

      const system = `You are an experienced interview coach grading mock interview answers.
Return JSON only, no preamble, no code fences. Output shape:
{
  "score": <0-100 integer>,
  "summary": "one sentence overall assessment",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["actionable improvement 1", "actionable improvement 2", "actionable improvement 3"],
  "better_example": "a 2-3 sentence example of how to answer this better"
}
Scoring rubric for ${questionType || 'behavioral'} questions:
- Specificity (numbers, names, concrete outcomes)
- Structure (STAR for behavioral; systematic approach for technical)
- Self-awareness (for weakness/failure questions)
- Relevance (does it actually answer the question?)
- Length (not too short, not rambling)
Be rigorous but kind. Most real answers score 55-75.`;

      const userMsg = `Role target: ${role || 'generic'}
Question: ${question}

Candidate answer:
${answer.slice(0, 4000)}`;

      const raw = await callClaude(system, userMsg);
      const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = {
          score: 0,
          summary: raw.slice(0, 200),
          strengths: [],
          improvements: [],
          better_example: '',
        };
      }
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === 'jd-score') {
      const body = await req.json();
      const { title, description } = body;
      if (!title || !description) {
        return new Response('title and description required', { status: 400, headers: corsHeaders });
      }

      const system = `You are an expert recruiter and technical writer scoring job descriptions.
Return JSON only, no preamble, no code fences. Output shape:
{
  "overall_score": <0-100 integer>,
  "specificity": <0-100>,
  "inclusivity": <0-100>,
  "clarity": <0-100>,
  "completeness": <0-100>,
  "strengths": ["bullet 1", "bullet 2"],
  "improvements": ["actionable 1", "actionable 2", "actionable 3"],
  "missing_sections": ["What You'll Do", "What We're Looking For", ...]
}
Scoring rubric:
- specificity: penalize "rockstar", "ninja", "passionate"; reward concrete outcomes
- inclusivity: penalize gendered/age-coded/ableist language, pedigree filters
- clarity: penalize jargon, long sentences, corporate-speak
- completeness: expect role summary, responsibilities, requirements, preferred qualifications, benefits
- overall_score: weighted avg rounded to integer
Be tough but fair. Most JDs score 55-75. Only exceptional ones cross 85.`;

      const userMsg = `Title: ${title}

Description:
${description.slice(0, 6000)}`;

      const raw = await callClaude(system, userMsg);
      const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = {
          overall_score: 0,
          specificity: 0,
          inclusivity: 0,
          clarity: 0,
          completeness: 0,
          strengths: [],
          improvements: [raw.slice(0, 200)],
          missing_sections: [],
        };
      }
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === 'review-summary') {
      const body = await req.json();
      const { companyName, reviews } = body;
      if (!companyName || !Array.isArray(reviews) || reviews.length === 0) {
        return new Response('companyName and non-empty reviews array required', { status: 400, headers: corsHeaders });
      }

      const system = `You summarize employee reviews into a neutral, evidence-grounded digest.
Return JSON only, no preamble, no code fences. Output shape:
{
  "summary": "2-3 sentence objective overview (max 80 words)",
  "pros_themes": ["theme 1", "theme 2", "theme 3"],
  "cons_themes": ["theme 1", "theme 2"],
  "recommended_for": ["audience 1", "audience 2"],
  "based_on_count": <integer>
}
Rules:
- Quote no one. Synthesize themes from recurring language.
- Do not invent sentiment not present in the reviews.
- Keep tone neutral — avoid superlatives unless overwhelmingly present.
- based_on_count must equal the number of reviews provided.`;

      const capped = reviews.slice(0, 40).map((r: { title?: string; pros?: string; cons?: string; rating?: number }, i: number) =>
        `Review ${i + 1}${r.rating ? ` (${r.rating}/5)` : ''}${r.title ? ` — ${r.title}` : ''}\nPros: ${r.pros || ''}\nCons: ${r.cons || ''}`,
      ).join('\n\n');

      const userMsg = `Company: ${companyName}\nReviews (${reviews.length} total, up to 40 shown):\n\n${capped}`;

      const raw = await callClaude(system, userMsg);
      const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { summary: raw.slice(0, 300), pros_themes: [], cons_themes: [], recommended_for: [], based_on_count: reviews.length };
      }
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === 'parse-resume') {
      // Per Scott 2026-04-29: extract structured fields from a resume text dump
      // so we can auto-fill skills / certifications / top skills on the
      // candidate's profile and drive AI matching.
      const body = await req.json();
      const { resumeText } = body;
      if (typeof resumeText !== 'string' || resumeText.trim().length < 20) {
        return new Response('resumeText (string, ≥20 chars) required', { status: 400, headers: corsHeaders });
      }

      const system = `You extract structured data from a candidate's resume.
Return JSON only — no preamble, no markdown, no code fences. Output shape:
{
  "skills": ["skill 1", "skill 2", ...],
  "certifications": ["cert 1", ...],
  "top_skills": ["top 1", "top 2", "top 3"],
  "years_experience": <integer or null>,
  "current_title": "<string or null>"
}
Rules:
- skills: technical and domain skills the candidate clearly demonstrates. Cap at 30. No soft-skill fluff ("teamwork", "communication") unless explicitly listed.
- certifications: industry-standard certs (AWS, PMP, CISSP, RN, etc.). Skip course completions and informal training. Cap at 15.
- top_skills: 3 to 5 of the most prominent / load-bearing items from skills. These appear first on the candidate's profile.
- years_experience: total professional years inferable from work history. null if not derivable.
- current_title: the candidate's most recent job title, exactly as written. null if no work history.
- Never invent. Only emit what's in the text.
- Deduplicate case-insensitively; preserve original casing of the first occurrence.`;

      // Cap at ~10k chars (~2.5k tokens) to keep calls fast and cheap.
      const truncated = resumeText.length > 10_000 ? resumeText.slice(0, 10_000) : resumeText;
      const raw = await callClaude(system, truncated);
      const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { skills: [], certifications: [], top_skills: [], years_experience: null, current_title: null };
      }
      // Normalize / defensive coercion.
      const out = {
        skills: Array.isArray(parsed.skills) ? parsed.skills.filter((s: unknown) => typeof s === 'string').slice(0, 30) : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications.filter((s: unknown) => typeof s === 'string').slice(0, 15) : [],
        top_skills: Array.isArray(parsed.top_skills) ? parsed.top_skills.filter((s: unknown) => typeof s === 'string').slice(0, 5) : [],
        years_experience: typeof parsed.years_experience === 'number' ? Math.max(0, Math.min(60, Math.round(parsed.years_experience))) : null,
        current_title: typeof parsed.current_title === 'string' ? parsed.current_title.slice(0, 120) : null,
      };
      return new Response(JSON.stringify(out), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
