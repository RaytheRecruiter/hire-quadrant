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

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
