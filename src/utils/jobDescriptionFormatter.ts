// Parses raw job descriptions (JobDiva text, employer-written, AI-generated)
// into Dexian-style labeled sections. The raw text is wildly inconsistent —
// some use MUST:/DUTIES: headers, some use "Requirements" / "Qualifications",
// some have no structure at all. The formatter is lenient: it extracts what
// it can by keyword, and anything unassigned becomes Position Overview.

export type SectionKind =
  | 'overview'
  | 'ideal_candidate'
  | 'responsibilities'
  | 'required'
  | 'preferred'
  | 'skills'
  | 'other';

export interface Section {
  kind: SectionKind;
  heading: string;
  paragraphs: string[]; // plain paragraphs (no bullet marker)
  bullets: string[]; // bullet list items
}

// Order matters — Position Overview first, others in the natural reading flow.
const SECTION_DEFS: Array<{ kind: SectionKind; heading: string; patterns: RegExp[] }> = [
  {
    kind: 'overview',
    heading: 'Position Overview',
    patterns: [
      /^(position overview|role overview|overview|about the role|about this role|summary|about the position|job summary)\b/i,
    ],
  },
  {
    kind: 'ideal_candidate',
    heading: 'Ideal Candidate',
    patterns: [/^(ideal candidate|who you are|about you|the ideal candidate|we're looking for|we are looking for)\b/i],
  },
  {
    kind: 'responsibilities',
    heading: 'Key Responsibilities',
    patterns: [
      /^(key responsibilities|responsibilities|duties|what you('ll| will) do|day to day|day-to-day|in this role|your role|your responsibilities)\b/i,
      /^(duties)\s*[:\-]/i,
    ],
  },
  {
    kind: 'required',
    heading: 'Required Qualifications',
    patterns: [
      /^(required qualifications|qualifications|requirements|must have|must haves?|required|minimum qualifications|what you need|must)\b/i,
      /^(must)\s*[:\-]/i,
    ],
  },
  {
    kind: 'preferred',
    heading: 'Preferred Qualifications',
    patterns: [
      /^(preferred qualifications|preferred|nice to have|nice-to-have|bonus|plus(es)?|nice to haves?|desired qualifications)\b/i,
    ],
  },
  {
    kind: 'skills',
    heading: 'Key Skills & Competencies',
    patterns: [
      /^(key skills( ?(&|and) ?competencies)?|skills( ?(&|and) ?competencies)?|competencies|technical skills|key competencies)\b/i,
    ],
  },
];

function classifyHeader(line: string): { kind: SectionKind; heading: string } | null {
  const cleaned = line.replace(/[:：\-–—]\s*$/, '').trim();
  if (!cleaned) return null;
  for (const def of SECTION_DEFS) {
    if (def.patterns.some((re) => re.test(cleaned))) {
      return { kind: def.kind, heading: def.heading };
    }
  }
  return null;
}

function looksLikeHeaderLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (t.length > 90) return false;
  // "Requirements:" or "MUST:" style
  if (/[:：]$/.test(t)) return true;
  // "REQUIREMENTS" ALL CAPS short line
  if (t === t.toUpperCase() && t.length < 60 && /[A-Z]/.test(t) && !t.includes('$')) return true;
  return false;
}

function isBulletLine(line: string): boolean {
  return /^[\u2022\u2023\u25E6\u2043\u2219•\-\*]\s+/.test(line) || /^\d+[\.\)]\s+/.test(line);
}

function stripBulletMarker(line: string): string {
  return line.replace(/^[\u2022\u2023\u25E6\u2043\u2219•\-\*]\s*/, '').replace(/^\d+[\.\)]\s*/, '').trim();
}

/**
 * Parse a raw description into ordered sections. Unrecognized content that
 * appears before any known header becomes Position Overview. Anything after
 * a header we can't classify is placed under its own "Other" section so no
 * content is lost.
 */
export function parseJobDescription(raw: string | null | undefined): Section[] {
  if (!raw) return [];
  const lines = raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 || true); // keep blanks for paragraph breaks

  const sections: Section[] = [];
  let current: Section = {
    kind: 'overview',
    heading: 'Position Overview',
    paragraphs: [],
    bullets: [],
  };
  let pendingParagraph: string[] = [];

  const flushParagraph = () => {
    if (pendingParagraph.length > 0) {
      const p = pendingParagraph.join(' ').trim();
      if (p) current.paragraphs.push(p);
      pendingParagraph = [];
    }
  };

  const commitCurrent = () => {
    flushParagraph();
    if (current.paragraphs.length > 0 || current.bullets.length > 0) {
      sections.push(current);
    }
  };

  for (const line of lines) {
    if (!line) {
      flushParagraph();
      continue;
    }

    if (looksLikeHeaderLine(line)) {
      const classified = classifyHeader(line);
      if (classified) {
        commitCurrent();
        current = {
          kind: classified.kind,
          heading: classified.heading,
          paragraphs: [],
          bullets: [],
        };
        continue;
      }
      // Header-ish but unknown category — start an "Other" section preserving
      // the original label as heading.
      commitCurrent();
      const label = line.replace(/[:：\-–—]\s*$/, '').trim();
      current = {
        kind: 'other',
        heading: label.length <= 60 ? label : 'Additional Information',
        paragraphs: [],
        bullets: [],
      };
      continue;
    }

    if (isBulletLine(line)) {
      flushParagraph();
      const text = stripBulletMarker(line);
      if (text) current.bullets.push(text);
      continue;
    }

    pendingParagraph.push(line);
  }

  commitCurrent();

  // Guarantee Position Overview exists if we have anything at all — it's the
  // fallback bucket for unclassified copy.
  if (sections.length === 0) {
    return [
      {
        kind: 'overview',
        heading: 'Position Overview',
        paragraphs: [raw.trim()],
        bullets: [],
      },
    ];
  }

  // Dedupe headings by merging consecutive same-kind sections.
  const merged: Section[] = [];
  for (const s of sections) {
    const last = merged[merged.length - 1];
    if (last && last.kind === s.kind) {
      last.paragraphs.push(...s.paragraphs);
      last.bullets.push(...s.bullets);
    } else {
      merged.push({ ...s });
    }
  }

  // Sort in the canonical reading order. "Other" sections keep their original
  // relative order (stable) by appending at the end.
  const order: SectionKind[] = [
    'overview',
    'ideal_candidate',
    'responsibilities',
    'required',
    'preferred',
    'skills',
  ];
  const ordered: Section[] = [];
  for (const kind of order) {
    merged.filter((s) => s.kind === kind).forEach((s) => ordered.push(s));
  }
  merged.filter((s) => s.kind === 'other').forEach((s) => ordered.push(s));

  return ordered;
}
