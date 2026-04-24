import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { HelpCircle, Search as SearchIcon, ChevronDown, ChevronUp, Loader2, BookOpen } from 'lucide-react';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import HardLink from '../components/HardLink';
import { supabase } from '../utils/supabaseClient';

interface Article {
  id: string;
  slug: string;
  question: string;
  answer: string;
  audience: 'candidate' | 'employer' | 'admin' | 'everyone';
  section: string;
}

const AUDIENCE_FILTERS: Array<{ value: 'all' | 'candidate' | 'employer' | 'everyone'; label: string }> = [
  { value: 'all', label: 'All articles' },
  { value: 'candidate', label: 'For candidates' },
  { value: 'employer', label: 'For employers' },
  { value: 'everyone', label: 'Everyone' },
];

const HelpCenter: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState<'all' | 'candidate' | 'employer' | 'everyone'>('all');
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('help_articles')
      .select('id, slug, question, answer, audience, section')
      .eq('published', true)
      .order('sort_index', { ascending: true });
    setArticles((data as Article[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = articles;
    if (audience !== 'all') {
      list = list.filter((a) => a.audience === audience || a.audience === 'everyone');
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.question.toLowerCase().includes(q) || a.answer.toLowerCase().includes(q),
      );
    }
    return list;
  }, [articles, audience, query]);

  const bySection = useMemo(() => {
    const map = new Map<string, Article[]>();
    filtered.forEach((a) => {
      const arr = map.get(a.section) ?? [];
      arr.push(a);
      map.set(a.section, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const toggle = (id: string) => {
    setOpenIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <Helmet>
        <title>Help Center · HireQuadrant</title>
        <meta
          name="description"
          content="Answers to common questions about HireQuadrant — for job seekers, employers, reviews, billing, and account security."
        />
        <link rel="canonical" href="https://hirequadrant.com/help" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <BreadcrumbSchema
            className="mb-4"
            items={[{ name: 'Home', to: '/' }, { name: 'Help Center' }]}
          />

          <header className="mb-8 flex items-start gap-3">
            <HelpCircle className="h-7 w-7 text-primary-500 mt-1" />
            <div>
              <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-1">
                Help Center
              </h1>
              <p className="text-gray-600 dark:text-slate-400">
                Answers to common questions. Can't find yours?{' '}
                <HardLink to="/support" className="text-primary-600 dark:text-primary-400 font-medium">
                  Contact support
                </HardLink>
                .
              </p>
            </div>
          </header>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 mb-6">
            <div className="relative mb-3">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search help articles..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setAudience(f.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    audience === f.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary-500 mx-auto" />
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
              <BookOpen className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-slate-400">
                No articles match your search.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {bySection.map(([section, items]) => (
                <section
                  key={section}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden"
                >
                  <header className="px-5 py-3 bg-gray-50 dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-sm font-semibold text-secondary-900 dark:text-white">
                      {section}
                    </h2>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                      {items.length} article{items.length === 1 ? '' : 's'}
                    </p>
                  </header>
                  <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                    {items.map((a) => {
                      const isOpen = openIds.has(a.id);
                      return (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => toggle(a.id)}
                            className="w-full text-left px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                          >
                            <span className="text-sm font-medium text-secondary-900 dark:text-white">
                              {a.question}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-4 text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                              {a.answer}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <div className="mt-8 text-center text-sm text-gray-500 dark:text-slate-400">
            Still stuck?{' '}
            <HardLink to="/support" className="text-primary-600 dark:text-primary-400 font-medium">
              Contact support →
            </HardLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpCenter;
