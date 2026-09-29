// scripts/backfillResumeParsing.ts
//
// One-time backfill (2026-09-29): resumes uploaded while the Anthropic
// account backing ai-helpers/parse-resume was out of credit never got
// parsed, and there's no retry mechanism -- extractParseAndStore()
// (src/utils/resumeParser.ts) only runs once, at upload time. Now that the
// account has credit again, this re-runs the same pipeline server-side for
// every candidate whose resume_parsed_at is still null.
//
// Text extraction is done here with mammoth (Node-compatible) rather than
// the browser pipeline in resumeParser.ts, which also depends on
// pdfjs-dist's browser worker and import.meta.env -- not usable from a
// plain Node script. All 3 affected files happen to be .docx, so mammoth
// alone covers this run; a future backfill with PDFs would need pdfjs-dist's
// Node build too.

import dotenv from 'dotenv';
import path from 'path';
import mammoth from 'mammoth';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), 'supabaseapi.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

interface ResumeParsed {
  skills: string[];
  certifications: string[];
  top_skills: string[];
  years_experience: number | null;
  current_title: string | null;
}

async function extractDocxText(buf: ArrayBuffer): Promise<string> {
  // mammoth's Node API takes { buffer: Buffer }, not { arrayBuffer } --
  // the latter is the browser-only option resumeParser.ts uses client-side.
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buf) });
  return result.value.trim();
}

async function parseResumeWithClaude(resumeText: string): Promise<ResumeParsed> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-helpers/parse-resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ resumeText }),
  });
  if (!res.ok) {
    throw new Error(`Resume parser returned ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  console.log('--- Resume parsing backfill started ---');

  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('user_id, resume_url, resume_text, skills, certifications, top_skills, current_title')
    .not('resume_url', 'is', null)
    .is('resume_parsed_at', null);

  if (error) {
    console.error('Failed to fetch candidates:', error);
    return;
  }
  if (!candidates || candidates.length === 0) {
    console.log('No unparsed candidates found. Nothing to do.');
    return;
  }

  console.log(`Found ${candidates.length} candidate(s) with an unparsed resume.`);

  for (const c of candidates) {
    console.log(`\n[${c.user_id}] resume_url: ${c.resume_url}`);

    let text = (c.resume_text || '').trim();

    if (!text) {
      const { data: fileBlob, error: dlErr } = await supabase.storage.from('resumes').download(c.resume_url);
      if (dlErr || !fileBlob) {
        console.warn(`  Could not download file, skipping:`, dlErr);
        continue;
      }
      const buf = await fileBlob.arrayBuffer();
      try {
        text = await extractDocxText(buf);
      } catch (err) {
        console.warn(`  Text extraction failed, skipping:`, err);
        continue;
      }
      if (text) {
        // Save the extracted text even if parsing below fails, same as
        // extractParseAndStore does -- so a re-run doesn't re-download.
        await supabase.from('candidates').update({ resume_text: text }).eq('user_id', c.user_id);
      }
    }

    if (!text || text.length < 20) {
      console.log(`  Extracted text is empty/too short (${text.length} chars) -- likely not an actual resume (e.g. a blank letterhead template). Skipping.`);
      continue;
    }

    console.log(`  Extracted ${text.length} chars, calling parser...`);
    let parsed: ResumeParsed;
    try {
      parsed = await parseResumeWithClaude(text);
    } catch (err) {
      console.error(`  Parse failed:`, err);
      continue;
    }

    const merge = {
      skills: (c.skills as string[] | null)?.length ? c.skills : parsed.skills,
      certifications: (c.certifications as string[] | null)?.length ? c.certifications : parsed.certifications,
      top_skills: (c.top_skills as string[] | null)?.length ? c.top_skills : parsed.top_skills,
      current_title: c.current_title || parsed.current_title,
      years_experience: parsed.years_experience,
      resume_parsed_at: new Date().toISOString(),
    };

    const { error: updateErr } = await supabase.from('candidates').update(merge).eq('user_id', c.user_id);
    if (updateErr) {
      console.error(`  Failed to save parsed fields:`, updateErr);
      continue;
    }
    console.log(`  Parsed and saved: title="${merge.current_title}", top_skills=${JSON.stringify(merge.top_skills)}, years_experience=${merge.years_experience}`);
  }

  console.log('\n--- Resume parsing backfill finished ---');
}

main();
