import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Award, X, Loader2, Plus } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const MAX_CERTS = 15;

const CertificationsSection: React.FC = () => {
  const { user } = useAuth();
  const [certs, setCerts] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('candidates')
        .select('certifications')
        .eq('user_id', user.id)
        .maybeSingle();
      setCerts(Array.isArray(data?.certifications) ? (data!.certifications as string[]) : []);
      setLoading(false);
    })();
  }, [user?.id]);

  const commit = async (next: string[]) => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('candidates')
      .upsert({ user_id: user.id, certifications: next }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    setCerts(next);
    window.dispatchEvent(new CustomEvent('profile-updated'));
    return true;
  };

  const addCert = async () => {
    const t = input.trim();
    if (!t) return;
    if (certs.some((c) => c.toLowerCase() === t.toLowerCase())) {
      setInput('');
      return;
    }
    if (certs.length >= MAX_CERTS) {
      toast.error(`Max ${MAX_CERTS} certifications`);
      return;
    }
    const ok = await commit([...certs, t]);
    if (ok) setInput('');
  };

  const removeCert = async (c: string) => {
    await commit(certs.filter((x) => x !== c));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2 mb-1">
        <Award className="h-5 w-5 text-violet-500" />
        Certifications
      </h2>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
        AWS, PMP, CISSP, Google, Microsoft, etc. Helps employers filter for credentialed candidates.
      </p>

      {loading ? (
        <div className="text-center py-4">
          <Loader2 className="h-5 w-5 text-primary-500 animate-spin mx-auto" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {certs.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                No certifications yet. Upload a resume to auto-detect, or add manually below.
              </p>
            ) : (
              certs.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-50 text-violet-800 border border-violet-200 text-sm"
                >
                  <Award className="h-3 w-3" />
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCert(c)}
                    className="hover:text-rose-600 ml-1"
                    aria-label={`Remove ${c}`}
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
                  addCert();
                }
              }}
              placeholder="Add a certification (e.g. AWS Solutions Architect)"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-400 focus:border-violet-400 text-sm"
              maxLength={80}
              disabled={certs.length >= MAX_CERTS}
            />
            <button
              type="button"
              onClick={addCert}
              disabled={saving || !input.trim() || certs.length >= MAX_CERTS}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
            {certs.length}/{MAX_CERTS}
          </p>
        </>
      )}
    </div>
  );
};

export default CertificationsSection;
