import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function useCompanyFollow(companyId: string | null | undefined) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { count } = await supabase
        .from('company_followers')
        .select('user_id', { count: 'exact', head: true })
        .eq('company_id', companyId);
      setFollowerCount(count ?? 0);

      if (user?.id) {
        const { data } = await supabase
          .from('company_followers')
          .select('user_id')
          .eq('company_id', companyId)
          .eq('user_id', user.id)
          .maybeSingle();
        setFollowing(!!data);
      } else {
        setFollowing(false);
      }
    } finally {
      setLoading(false);
    }
  }, [companyId, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(async () => {
    if (!companyId || !user?.id) return false;
    if (following) {
      const { error } = await supabase
        .from('company_followers')
        .delete()
        .eq('company_id', companyId)
        .eq('user_id', user.id);
      if (error) return false;
      setFollowing(false);
      setFollowerCount((n) => Math.max(0, n - 1));
      return true;
    }
    const { error } = await supabase
      .from('company_followers')
      .insert({ company_id: companyId, user_id: user.id });
    if (error) return false;
    setFollowing(true);
    setFollowerCount((n) => n + 1);
    return true;
  }, [companyId, user?.id, following]);

  return { following, followerCount, toggle, loading };
}
