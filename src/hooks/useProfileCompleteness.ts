import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { ProfileCompletenessInputs } from '../components/profile/ProfileCompletenessScore';

const EMPTY: ProfileCompletenessInputs = {
  hasName: false,
  hasHeadline: false,
  hasAvatar: false,
  hasResume: false,
  hasExperience: false,
  hasEducation: false,
  hasSkills: false,
  hasPreferences: false,
};

export function useProfileCompleteness(refreshToken: number = 0) {
  const { user } = useAuth();
  const [inputs, setInputs] = useState<ProfileCompletenessInputs>(EMPTY);

  useEffect(() => {
    if (!user?.id) {
      setInputs(EMPTY);
      return;
    }
    let cancelled = false;
    (async () => {
      const [candRes, expRes, eduRes, prefRes] = await Promise.all([
        supabase
          .from('candidates')
          .select('headline, resume_url, skills')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_experience')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('user_education')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('user_job_preferences')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      const cand = candRes.data as { headline?: string | null; resume_url?: string | null; skills?: unknown } | null;
      const skillsArr = Array.isArray(cand?.skills) ? (cand!.skills as unknown[]) : [];
      setInputs({
        hasName: Boolean(user.name && user.name.trim().length >= 2),
        hasHeadline: Boolean(cand?.headline && cand.headline.trim().length > 0),
        hasAvatar: Boolean((user as { avatarUrl?: string | null }).avatarUrl),
        hasResume: Boolean(cand?.resume_url),
        hasExperience: (expRes.count ?? 0) > 0,
        hasEducation: (eduRes.count ?? 0) > 0,
        hasSkills: skillsArr.length > 0,
        hasPreferences: Boolean(prefRes.data),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.name, refreshToken]);

  return inputs;
}
