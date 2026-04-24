import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

// Parses salary strings (from JobDiva / employer-entered text) into numbers.
// Handles: "$80k - $120k", "From $90,000", "$57/hour", "150000 per year".
function parseSalaryRange(s: string | null | undefined): { min: number; max: number } | null {
  if (!s) return null;
  const lower = s.toLowerCase();
  const isHourly = /\b(hour|hr|hourly|per hour|\/hour|\/hr)\b/.test(lower);
  // Find all dollar amounts
  const matches = Array.from(s.matchAll(/\$?\s*([\d,]+(?:\.\d+)?)\s*(k)?/gi));
  const nums: number[] = [];
  for (const m of matches) {
    const raw = m[1].replace(/,/g, '');
    let n = parseFloat(raw);
    if (!Number.isFinite(n)) continue;
    if (m[2]?.toLowerCase() === 'k') n *= 1000;
    // Infer 'k' when the visible number looks like a short thousands (80 → 80k)
    else if (n > 0 && n < 1000 && !isHourly) n *= 1000;
    if (isHourly) n = n * 2080; // annualize
    nums.push(n);
  }
  if (nums.length === 0) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  // Filter outliers — salaries outside $20k–$1M probably mis-parsed.
  if (min < 20_000 || max > 1_000_000) return null;
  return { min, max };
}

export interface SalaryInsight {
  count: number;
  min: number;
  max: number;
  median: number;
  p25: number;
  p75: number;
  top_locations: Array<{ location: string; count: number }>;
  sample_titles: string[];
}

export function useSalaryInsights(titleLike: string | null | undefined) {
  const [insight, setInsight] = useState<SalaryInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!titleLike) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('jobs')
        .select('title, location, salary')
        .ilike('title', `%${titleLike}%`)
        .not('salary', 'is', null)
        .limit(1000);

      const rows = (data ?? []) as Array<{ title: string; location: string | null; salary: string | null }>;
      const annualized: number[] = [];
      const locationCounts = new Map<string, number>();
      const titles: Set<string> = new Set();
      for (const r of rows) {
        const parsed = parseSalaryRange(r.salary);
        if (!parsed) continue;
        annualized.push((parsed.min + parsed.max) / 2);
        if (r.location) locationCounts.set(r.location, (locationCounts.get(r.location) ?? 0) + 1);
        titles.add(r.title);
      }
      if (cancelled) return;
      if (annualized.length < 3) {
        setInsight(null);
        setLoading(false);
        return;
      }
      annualized.sort((a, b) => a - b);
      const pick = (p: number) => annualized[Math.max(0, Math.min(annualized.length - 1, Math.floor(p * annualized.length)))];
      const top = Array.from(locationCounts.entries())
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([location, count]) => ({ location, count }));
      setInsight({
        count: annualized.length,
        min: annualized[0],
        max: annualized[annualized.length - 1],
        median: pick(0.5),
        p25: pick(0.25),
        p75: pick(0.75),
        top_locations: top,
        sample_titles: Array.from(titles).slice(0, 8),
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [titleLike]);

  return { insight, loading };
}

export { parseSalaryRange };
