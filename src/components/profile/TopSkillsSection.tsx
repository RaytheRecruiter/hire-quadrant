import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Star, X, Loader2, Plus } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const MAX_TOP_SKILLS = 5;

const TopSkillsSection: React.FC = () => {
  const { user } = useAuth();
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('candidates')
        .select('top_skills')
        .eq('user_id', user.id)
        .maybeSingle();
      setTopSkills(Array.isArray(data?.top_skills) ? (data!.top_skills as string[]) : []);
      setLoading(false);
    })();
  }, [user?.id]);

  const commit = async (next: string[]) => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('candidates')
      .upsert({ user_id: user.id, top_skills: next }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    setTopSkills(next);
    window.dispatchEvent(new CustomEvent('profile-updated'));
    return true;
  };

  const addTopSkill = async () => {
    const t = input.trim();
    if (!t) return;
    if (topSkills.some((s) => s.toLowerCase() === t.toLowerCase())) {
      setInput('');
      return;
    }
    if (topSkills.length >= MAX_TOP_SKILLS) {
      toast.error(`Max ${MAX_TOP_SKILLS} top skills — these are the highlights employers see first`);
      return;
    }
    const ok = await commit([...topSkills, t]);
    if (ok) setInput('');
  };

  const removeTopSkill = async (s: string) => {
    await commit(topSkills.filter((x) => x !== s));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2 mb-1">
        <Star className="h-5 w-5 text-amber-400" />
        Top Skills
      </h2>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
        Pick 3–5 standout skills. Shown prominently on your profile and in employer search results.
      </p>

      {loading ? (
        <div className="text-center py-4">
          <Loader2 className="h-5 w-5 text-primary-500 animate-spin mx-auto" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {topSkills.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                No top skills yet. Upload a resume to auto-fill, or add manually below.
              </p>
            ) : (
              topSkills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-sm font-medium"
                >
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {s}
                  <button
                    type="button"
                    onClick={() => removeTopSkill(s)}
                    className="hover:text-rose-600 ml-1"
                    aria-label={`Remove ${s}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTopSkill();
                }
              }}
              placeholder="Add a top skill (e.g. React, AWS, Python)"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm"
              maxLength={40}
              disabled={topSkills.length >= MAX_TOP_SKILLS}
            />
            <button
              type="button"
              onClick={addTopSkill}
              disabled={saving || !input.trim() || topSkills.length >= MAX_TOP_SKILLS}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
            {topSkills.length}/{MAX_TOP_SKILLS}
          </p>
        </>
      )}
    </div>
  );
};

export default TopSkillsSection;
