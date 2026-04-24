import React, { useCallback, useEffect, useState } from 'react';
import { UserPlus, Copy, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface InviteRow {
  id: string;
  code: string;
  invited_role: 'owner' | 'recruiter' | 'viewer';
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

const TeamInvites: React.FC<{ companyId: string }> = ({ companyId }) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [role, setRole] = useState<'owner' | 'recruiter' | 'viewer'>('recruiter');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('company_team_invites')
      .select('id, code, invited_role, accepted_at, expires_at, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    setInvites((data as InviteRow[]) ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const createInvite = async () => {
    if (!user?.id) return;
    setCreating(true);
    const { error } = await supabase.from('company_team_invites').insert({
      company_id: companyId,
      invited_role: role,
      invited_by: user.id,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Invite created');
    load();
  };

  const inviteUrl = (code: string) => `${origin}/register?invite=${code}`;

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(code));
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
            Team invites
          </h3>
        </div>
      </div>

      <div className="flex items-end gap-2 mb-4">
        <div>
          <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'owner' | 'recruiter' | 'viewer')}
            className="text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="owner">Owner (full access)</option>
            <option value="recruiter">Recruiter (manage jobs + applicants)</option>
            <option value="viewer">Viewer (read-only)</option>
          </select>
        </div>
        <button
          type="button"
          onClick={createInvite}
          disabled={creating}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40"
        >
          {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Generate invite link
        </button>
      </div>

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : invites.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500 italic">
          No invites yet. Generate one to add a teammate.
        </p>
      ) : (
        <ul className="space-y-2">
          {invites.map((i) => {
            const expired = new Date(i.expires_at) < new Date();
            const accepted = Boolean(i.accepted_at);
            return (
              <li
                key={i.id}
                className="bg-gray-50 dark:bg-slate-900/40 rounded-lg border border-gray-100 dark:border-slate-700 p-2.5 text-sm flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-secondary-900 dark:text-white capitalize">
                    {i.invited_role}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                    {accepted
                      ? `Accepted ${formatDistanceToNow(new Date(i.accepted_at!), { addSuffix: true })}`
                      : expired
                      ? 'Expired'
                      : `Expires ${formatDistanceToNow(new Date(i.expires_at), { addSuffix: true })}`}
                  </p>
                </div>
                {accepted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                ) : !expired ? (
                  <button
                    type="button"
                    onClick={() => copy(i.code)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <Copy className="h-3 w-3" />
                    Copy link
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default TeamInvites;
