import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { ProfileCompletenessInputs } from '../components/profile/ProfileCompletenessScore';

const EMPTY: ProfileCompletenessInputs = {
  hasName: false,
  hasTopSkills: false,
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
  // Re-fetch when ProfilePage dispatches 'profile-updated' (any save:
  // name/avatar/resume/experience/education/skills/preferences). Without
  // this, the completeness bar never advanced past its initial load —
  // Ray's QA on 2026-04-30 caught it as #28 ("score never reached 90%").
  const [eventTick, setEventTick] = useState(0);
  useEffect(() => {
    const handler = () => setEventTick((t) => t + 1);
    window.addEventListener('profile-updated', handler);
    return () => window.removeEventListener('profile-updated', handler);
  }, []);

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
          .select('top_skills, resume_url, skills')
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
      const cand = candRes.data as { top_skills?: unknown; resume_url?: string | null; skills?: unknown } | null;
      const skillsArr = Array.isArray(cand?.skills) ? (cand!.skills as unknown[]) : [];
      const topSkillsArr = Array.isArray(cand?.top_skills) ? (cand!.top_skills as unknown[]) : [];
      setInputs({
        hasName: Boolean(user.name && user.name.trim().length >= 2),
        hasTopSkills: topSkillsArr.length > 0,
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
  }, [user?.id, user?.name, refreshToken, eventTick]);

  return inputs;
}
