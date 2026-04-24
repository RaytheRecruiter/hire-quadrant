import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search as SearchIcon, X, Briefcase, Building2, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import HardLink from './HardLink';
import { supabase } from '../utils/supabaseClient';

type ResultKind = 'job' | 'company' | 'blog';

interface Result {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const KIND_CONFIG: Record<ResultKind, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  job: { label: 'Jobs', icon: Briefcase, tone: 'text-primary-600 dark:text-primary-400' },
  company: { label: 'Companies', icon: Building2, tone: 'text-indigo-600 dark:text-indigo-400' },
  blog: { label: 'Articles', icon: BookOpen, tone: 'text-amber-600 dark:text-amber-400' },
};

const debounce = <A extends unknown[]>(fn: (...args: A) => void, ms: number) => {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

async function searchAll(term: string): Promise<Result[]> {
  if (term.trim().length < 2) return [];
  const pattern = `%${term}%`;

  const [jobsRes, companiesRes, blogRes] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, title, company, location')
      .or(`title.ilike.${pattern},company.ilike.${pattern}`)
      .limit(6),
    supabase
      .from('public_company_directory')
      .select('id, slug, name, display_name, industry, location')
      .or(`name.ilike.${pattern},display_name.ilike.${pattern}`)
      .limit(6),
    supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, category')
      .eq('published', true)
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
      .limit(6),
  ]);

  const out: Result[] = [];

  (jobsRes.data ?? []).forEach((j: { id: string; title: string; company: string | null; location: string | null }) => {
    out.push({
      kind: 'job',
      id: j.id,
      title: j.title,
      subtitle: [j.company, j.location].filter(Boolean).join(' · ') || 'Open role',
      href: `/jobs/${j.id}`,
    });
  });

  (companiesRes.data ?? []).forEach(
    (c: { id: string; slug: string; name: string; display_name: string | null; industry: string | null; location: string | null }) => {
      out.push({
        kind: 'company',
        id: c.id,
        title: c.display_name ?? c.name,
        subtitle: [c.industry, c.location].filter(Boolean).join(' · ') || 'Company',
        href: `/companies/${c.slug}`,
      });
    },
  );

  (blogRes.data ?? []).forEach(
    (b: { id: string; slug: string; title: string; excerpt: string | null; category: string | null }) => {
      out.push({
        kind: 'blog',
        id: b.id,
        title: b.title,
        subtitle: b.excerpt ?? (b.category ? b.category : 'Article'),
        href: `/blog/${b.slug}`,
      });
    },
  );

  return out;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FC<Props> = ({ open, onClose }) => {
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useMemo(
    () =>
      debounce(async (t: string) => {
        setLoading(true);
        const out = await searchAll(t);
        setResults(out);
        setActiveIdx(0);
        setLoading(false);
      }, 180),
    [],
  );

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setTerm('');
      setResults([]);
      setActiveIdx(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    runSearch(term);
  }, [term, open, runSearch]);

  const grouped = useMemo(() => {
    const g: Record<ResultKind, Result[]> = { job: [], company: [], blog: [] };
    results.forEach((r) => g[r.kind].push(r));
    return g;
  }, [results]);

  const flat = useMemo(
    () => [...grouped.job, ...grouped.company, ...grouped.blog],
    [grouped],
  );

  const go = useCallback(
    (r: Result) => {
      onClose();
      // Use HardLink semantics — full nav so Supabase context re-fetches
      window.location.assign(r.href);
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        if (flat[activeIdx]) {
          e.preventDefault();
          go(flat[activeIdx]);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, flat, activeIdx, go, onClose]);

  if (!open) return null;

  let runningIdx = -1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <SearchIcon className="h-5 w-5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search jobs, companies, articles…"
            className="flex-1 bg-transparent border-0 focus:ring-0 text-base text-secondary-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="max-h-[60vh] overflow-auto">
          {term.trim().length < 2 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
              Type at least 2 characters to search
            </div>
          ) : flat.length === 0 && !loading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
              No results for "{term}"
            </div>
          ) : (
            (['job', 'company', 'blog'] as ResultKind[]).map((kind) => {
              const items = grouped[kind];
              if (items.length === 0) return null;
              const { label, icon: Icon, tone } = KIND_CONFIG[kind];
              return (
                <section key={kind} className="py-2">
                  <h3 className={`px-4 text-[10px] uppercase tracking-wide font-semibold ${tone} flex items-center gap-1.5 mb-1`}>
                    <Icon className="h-3 w-3" />
                    {label}
                  </h3>
                  <ul>
                    {items.map((r) => {
                      runningIdx += 1;
                      const isActive = runningIdx === activeIdx;
                      return (
                        <li key={`${r.kind}-${r.id}`}>
                          <button
                            type="button"
                            onClick={() => go(r)}
                            onMouseEnter={() => setActiveIdx(runningIdx)}
                            className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${
                              isActive
                                ? 'bg-primary-50 dark:bg-primary-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${tone}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                                {r.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                {r.subtitle}
                              </p>
                            </div>
                            {isActive && (
                              <ArrowRight className="h-4 w-4 text-primary-500 flex-shrink-0 self-center" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
          )}
        </div>

        <footer className="px-4 py-2 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 font-mono">↑↓</kbd> navigate · <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 font-mono">↵</kbd> open · <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 font-mono">esc</kbd> close
          </span>
          <span className="hidden sm:inline">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 font-mono">⌘K</kbd> to open
          </span>
        </footer>
      </div>
    </div>
  );
};

export default GlobalSearch;
