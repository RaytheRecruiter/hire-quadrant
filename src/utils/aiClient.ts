import { supabase } from './supabaseClient';

const FUNCTIONS_BASE = (import.meta.env.VITE_SUPABASE_URL as string)?.replace('.supabase.co', '.functions.supabase.co');

async function callEdgeFunction(path: string, body: any): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${FUNCTIONS_BASE}/ai-helpers/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AI helper failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function generateJobDescription(params: {
  title: string;
  company?: string;
  location?: string;
  bullets?: string[];
}): Promise<string> {
  const { description } = await callEdgeFunction('job-description', params);
  return description;
}

export interface CandidateScreening {
  summary: string;
  fit_score: number;
  strengths: string[];
  concerns: string[];
}

export async function screenCandidate(params: {
  jobTitle: string;
  jobDescription?: string;
  candidateName?: string;
  candidateSummary?: string;
  screeningAnswers?: { answer: string }[];
}): Promise<CandidateScreening> {
  return callEdgeFunction('screen-candidate', params);
}
