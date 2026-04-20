import { useCallback, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

interface SearchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  description: string;
  relevance_score: number;
}

export const useFullTextSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, filters?: {
    location?: string;
    salary_min?: number;
    job_type?: string;
  }) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call Supabase Edge Function for full-text search
      const { data, error: searchError } = await supabase.functions.invoke(
        'search-jobs',
        {
          body: {
            query,
            filters,
            limit: 50,
          },
        }
      );

      if (searchError) {
        throw new Error(searchError.message);
      }

      setResults(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
};

/**
 * Simple client-side search for immediate results
 * Use for instant feedback while Edge Function loads
 */
export const useClientSideSearch = (jobs: any[]) => {
  const search = useCallback((query: string) => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);

    return jobs.filter(job => {
      const searchableText = `
        ${job.title}
        ${job.company}
        ${job.location}
        ${job.description || ''}
      `.toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    }).sort((a, b) => {
      // Boost exact matches
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const query_lower = query.toLowerCase();

      if (aTitle.includes(query_lower) && !bTitle.includes(query_lower)) return -1;
      if (!aTitle.includes(query_lower) && bTitle.includes(query_lower)) return 1;
      return 0;
    });
  }, [jobs]);

  return { search };
};
