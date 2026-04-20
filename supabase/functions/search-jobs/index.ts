import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

interface SearchRequest {
  query: string;
  filters?: {
    location?: string;
    salary_min?: number;
    job_type?: string;
  };
  limit?: number;
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const { query, filters = {}, limit = 50 } = (await req.json()) as SearchRequest;

    if (!query || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build PostgreSQL full-text search query
    let sql = `
      SELECT
        id,
        title,
        company,
        location,
        salary_min,
        salary_max,
        description,
        ts_rank(
          to_tsvector('english', title || ' ' || company || ' ' || COALESCE(description, '')),
          plainto_tsquery('english', $1)
        ) as relevance_score
      FROM jobs
      WHERE
        to_tsvector('english', title || ' ' || company || ' ' || COALESCE(description, ''))
        @@ plainto_tsquery('english', $1)
        AND published = true
    `;

    const params: any[] = [query];

    // Apply filters
    if (filters.location) {
      sql += ` AND LOWER(location) LIKE LOWER($${params.length + 1})`;
      params.push(`%${filters.location}%`);
    }

    if (filters.salary_min) {
      sql += ` AND (salary_max IS NULL OR salary_max >= $${params.length + 1})`;
      params.push(filters.salary_min);
    }

    if (filters.job_type) {
      sql += ` AND job_type = $${params.length + 1}`;
      params.push(filters.job_type);
    }

    // Order by relevance and date
    sql += ` ORDER BY relevance_score DESC, posted_date DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    // Execute query via Supabase
    const { data, error } = await supabase.rpc('search_full_text', {
      search_query: query,
      search_filters: JSON.stringify(filters),
      result_limit: limit,
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data || []), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Search error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Search failed',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
