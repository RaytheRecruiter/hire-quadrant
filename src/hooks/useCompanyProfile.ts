import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface CompanyProfileData {
  id: string;
  slug: string;
  name: string;
  display_name: string;
  description: string | null;
  website: string | null;
  logo: string | null;
  header_image_url: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  founded: string | null;
  specialties: string[] | null;
  benefits: string[] | null;
  culture: string | null;
  claimed_at: string | null;
  socials: Record<string, string> | null;
  email_domain: string | null;
  job_count: number;
  review_count: number;
  avg_rating: number;
  follower_count: number;
}

// Very loose UUID regex — good enough to switch lookup strategy
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useCompanyProfile(slugOrId: string | undefined) {
  const [company, setCompany] = useState<CompanyProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugOrId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Base row — slug primary, UUID fallback for legacy /companies/:id links
        const lookupColumn = UUID_RE.test(slugOrId) ? 'id' : 'slug';
        const { data: base, error: baseErr } = await supabase
          .from('companies')
          .select(
            'id, slug, name, display_name, description, website, logo, header_image_url, industry, size, location, founded, specialties, benefits, culture, claimed_at, socials, email_domain',
          )
          .eq(lookupColumn, slugOrId)
          .maybeSingle();
        if (baseErr) throw baseErr;
        if (!base) {
          if (!cancelled) setCompany(null);
          return;
        }

        // Stats via parallel counts (follower_count via separate query)
        const [{ count: jobCount }, reviewAgg, { count: followerCount }] = await Promise.all([
          supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('company_id', base.id),
          supabase
            .from('company_reviews')
            .select('rating_overall', { count: 'exact' })
            .eq('company_id', base.id)
            .eq('status', 'approved'),
          supabase
            .from('company_followers')
            .select('user_id', { count: 'exact', head: true })
            .eq('company_id', base.id),
        ]);

        const reviewCount = reviewAgg.count ?? 0;
        const avgRating =
          reviewCount > 0 && reviewAgg.data
            ? reviewAgg.data.reduce((s, r) => s + (r.rating_overall ?? 0), 0) / reviewCount
            : 0;

        if (!cancelled) {
          setCompany({
            ...(base as Omit<CompanyProfileData, 'job_count' | 'review_count' | 'avg_rating' | 'follower_count'>),
            job_count: jobCount ?? 0,
            review_count: reviewCount,
            avg_rating: Number(avgRating.toFixed(2)),
            follower_count: followerCount ?? 0,
          });
        }

        // Fire-and-forget: record a page view
        supabase.rpc('record_company_view', { target_company_id: base.id }).then(() => {});
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load company');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  return { company, loading, error };
}
