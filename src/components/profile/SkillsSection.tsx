import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, X, Loader2, Plus } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const SkillsSection: React.FC = () => {
  const { user } = useAuth();
  const [skills, setSkills] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('candidates')
        .select('skills')
        .eq('user_id', user.id)
        .maybeSingle();
      setSkills(Array.isArray(data?.skills) ? (data!.skills as string[]) : []);
      setLoading(false);
    })();
  }, [user?.id]);

  const commit = async (next: string[]) => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('candidates')
      .upsert({ user_id: user.id, skills: next }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    setSkills(next);
    return true;
  };

  const addSkill = async () => {
    const t = input.trim();
    if (!t) return;
    if (skills.some((s) => s.toLowerCase() === t.toLowerCase())) {
      setInput('');
      return;
    }
    if (skills.length >= 40) {
      toast.error('Max 40 skills');
      return;
    }
    const ok = await commit([...skills, t]);
    if (ok) setInput('');
  };

  const removeSkill = async (s: string) => {
    await commit(skills.filter((x) => x !== s));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-gray-400 dark:text-slate-500" />
        Skills
      </h2>

      {loading ? (
        <div className="text-center py-4">
          <Loader2 className="h-5 w-5 text-primary-500 animate-spin mx-auto" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">Add skills to help employers find you.</p>
            ) : (
              skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="hover:text-rose-600"
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
                  addSkill();
                }
              }}
              placeholder="Add a skill (press Enter)"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm"
              maxLength={40}
            />
            <button
              type="button"
              onClick={addSkill}
              disabled={saving || !input.trim()}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SkillsSection;
