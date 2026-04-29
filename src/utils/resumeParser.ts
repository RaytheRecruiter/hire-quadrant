// Resume text extraction + AI parsing.
// Per Scott 2026-04-29 (#11 + #12).
//
// Browser-side text extraction (no edge function for the text step):
//   - PDF  → pdfjs-dist
//   - DOCX → mammoth
// Then we POST the raw text to the supabase ai-helpers function which calls
// Claude Haiku and returns structured fields. The browser updates the
// candidates row with the parsed output.
//
// Why browser-side text extraction (not server-side):
//   - Avoids shipping the file twice (browser → storage → edge fn).
//   - pdfjs-dist + mammoth both work cleanly in the browser; doing the same
//     in Deno would be considerably fiddlier.

import * as pdfjsLib from 'pdfjs-dist';
// pdfjs needs a worker URL — Vite handles ?url for us.
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import { supabase } from './supabaseClient';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ResumeParsed {
  skills: string[];
  certifications: string[];
  top_skills: string[];
  years_experience: number | null;
  current_title: string | null;
}

export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    return extractPdfText(file);
  }
  if (name.endsWith('.docx')) {
    return extractDocxText(file);
  }
  if (name.endsWith('.txt')) {
    return file.text();
  }
  throw new Error('Unsupported resume format. Use PDF, DOCX, or TXT.');
}

async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: unknown) => (typeof (item as { str?: string }).str === 'string' ? (item as { str: string }).str : ''))
      .join(' ');
    pageTexts.push(text);
  }
  return pageTexts.join('\n\n').replace(/\s+\n/g, '\n').trim();
}

async function extractDocxText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value.trim();
}

export async function parseResumeWithClaude(resumeText: string): Promise<ResumeParsed> {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const res = await fetch(`${url}/functions/v1/ai-helpers/parse-resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify({ resumeText }),
  });
  if (!res.ok) {
    throw new Error(`Resume parser returned ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/**
 * Full pipeline: extract text from the uploaded file, save it to
 * candidates.resume_text, call Claude, and merge the structured output
 * into the row.
 *
 * Override behavior (per Scott): the parser fills empty/short fields. If a
 * candidate has manually set skills/certifications/top_skills/title, those
 * stay. Empty arrays / null fields get filled from the AI output.
 */
export async function extractParseAndStore(
  file: File,
  userId: string,
): Promise<{ text: string; parsed: ResumeParsed }> {
  const text = await extractResumeText(file);

  const { data: existing } = await supabase
    .from('candidates')
    .select('skills, certifications, top_skills, current_title')
    .eq('user_id', userId)
    .maybeSingle();

  // Always refresh resume_text first so the manual override flow has the
  // latest version even if the AI call later fails.
  await supabase.from('candidates').upsert(
    { user_id: userId, resume_text: text },
    { onConflict: 'user_id' },
  );

  const parsed = await parseResumeWithClaude(text);

  const merge = {
    skills: (existing?.skills as string[] | null)?.length ? existing!.skills : parsed.skills,
    certifications: (existing?.certifications as string[] | null)?.length ? existing!.certifications : parsed.certifications,
    top_skills: (existing?.top_skills as string[] | null)?.length ? existing!.top_skills : parsed.top_skills,
    current_title: existing?.current_title || parsed.current_title,
    years_experience: parsed.years_experience,
    resume_parsed_at: new Date().toISOString(),
  };

  await supabase.from('candidates').upsert(
    { user_id: userId, ...merge },
    { onConflict: 'user_id' },
  );

  return { text, parsed };
}
