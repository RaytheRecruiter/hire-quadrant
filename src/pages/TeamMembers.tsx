// Team Members & Permissions page — Phase 1 MVP per Scott 2026-04-29 (#4).
// Owner/Admin can invite, edit, and remove members. Standard Users see a
// read-only view of their own permissions.
//
// Phase 1 invite flow: generate a copyable link (no email send yet). Owner
// shares the link manually. Phase 1.5 will wire SendGrid for direct email.

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Loader2,
  Copy,
  Check,
  Settings as SettingsIcon,
  X,
  Mail,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import {
  CompanyMember,
  CompanyRole,
  AccessScope,
  PermissionKey,
  Permissions,
  STANDARD_DEFAULT_PERMISSIONS,
  ROLE_LABEL,
  ROLE_DESCRIPTION,
  PERMISSION_GROUPS,
  PERMISSION_LABEL,
} from '../utils/permissions';

interface MemberWithProfile extends CompanyMember {
  profile?: { name: string | null; email: string | null };
}

interface InvitationRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: CompanyRole;
  scope: AccessScope;
  permissions: Permissions;
  token: string;
  invited_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
}

interface CompanyInfo {
  id: string;
  display_name: string | null;
  name: string;
}

const TeamMembers: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { member, loading: permLoading, can, isOwner, isAdmin } = usePermissions();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [editing, setEditing] = useState<MemberWithProfile | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const canManageUsers = isOwner || isAdmin || can('manage_users');

  const load = async () => {
    if (!member?.company_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [membersRes, invitesRes, companyRes] = await Promise.all([
      supabase
        .from('company_members')
        .select('*')
        .eq('company_id', member.company_id)
        .order('joined_at', { ascending: true }),
      supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', member.company_id)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false }),
      supabase
        .from('companies')
        .select('id, display_name, name')
        .eq('id', member.company_id)
        .maybeSingle(),
    ]);
    if (companyRes.data) setCompany(companyRes.data as CompanyInfo);

    const memberRows = (membersRes.data || []) as CompanyMember[];
    const userIds = memberRows.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, name, email')
      .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);
    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.id, { name: p.name, email: p.email }]),
    );
    setMembers(
      memberRows.map((m) => ({ ...m, profile: profileMap.get(m.user_id) }))
    );
    setInvitations((invitesRes.data || []) as InvitationRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.company_id]);

  if (authLoading || permLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (!member) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-amber-900 mb-2">
            No company membership found
          </h1>
          <p className="text-sm text-amber-800">
            You aren't currently linked to a company account. If you believe this is
            an error, contact your account Owner or HQ support.
          </p>
        </div>
      </div>
    );
  }

  const handleRemove = async (m: MemberWithProfile) => {
    if (m.role === 'owner') {
      toast.error('Cannot remove the Owner. Transfer ownership first.');
      return;
    }
    if (m.user_id === user.id) {
      toast.error('You cannot remove yourself.');
      return;
    }
    if (!confirm(`Remove ${m.profile?.name || m.profile?.email || 'this user'} from the company? This deletes the membership entirely.`)) {
      return;
    }
    const { error } = await supabase.from('company_members').delete().eq('id', m.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Member removed');
    load();
  };

  // Deactivate / Reactivate (per Scott's spec: distinct from full removal).
  // Inactive members keep their record + permissions but the
  // effectivePermissions() helper returns all-false until reactivated.
  const handleSetStatus = async (m: MemberWithProfile, status: 'active' | 'inactive') => {
    if (m.role === 'owner' && status === 'inactive') {
      toast.error('Cannot deactivate the Owner. Transfer ownership first.');
      return;
    }
    if (m.user_id === user.id) {
      toast.error('You cannot change your own status.');
      return;
    }
    const { error } = await supabase
      .from('company_members')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', m.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === 'inactive' ? 'Member deactivated' : 'Member reactivated');
    load();
  };

  const handleResendInvite = async (inv: InvitationRow) => {
    if (!user || !member) return;
    // Bump expiry forward by 14 days from now so the email's date is fresh.
    const newExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const { error: updateError } = await supabase
      .from('company_invitations')
      .update({ invited_at: new Date().toISOString(), expires_at: newExpiry.toISOString() })
      .eq('id', inv.id);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    // Re-fire the email. Failure is non-fatal.
    const inviteUrl = `${window.location.origin}/accept-invite?token=${inv.token}`;
    const expiresOn = newExpiry.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const roleLabel = inv.role === 'admin' ? 'Admin' : 'Standard User';
    const scopeLabel = inv.role === 'standard'
      ? inv.scope === 'all' ? 'All Jobs' : 'Assigned Jobs Only'
      : '';
    const inviterName = user.name || user.email || 'Your teammate';
    const cName = company?.display_name || company?.name || 'your company';
    const recipientFirstName = inv.first_name || '';
    try {
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const res = await fetch(`${url}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({
          to: inv.email,
          subject: recipientFirstName
            ? `${recipientFirstName}, reminder: ${inviterName} invited you to join ${cName}`
            : `Reminder: ${inviterName} invited you to join ${cName} on HireQuadrant`,
          template: 'team_invitation',
          variables: {
            companyName: cName,
            inviterName,
            recipientFirstName,
            roleLabel,
            scopeLabel,
            inviteUrl,
            expiresOn,
          },
        }),
      });
      if (res.ok) toast.success(`Re-sent invitation to ${inv.email}`);
      else toast.success('Invitation refreshed — copy the link to share manually');
    } catch {
      toast.success('Invitation refreshed — copy the link to share manually');
    }
    load();
  };

  const handleRevokeInvite = async (id: string) => {
    const { error } = await supabase
      .from('company_invitations')
      .update({ status: 'revoked' })
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Invitation revoked');
    load();
  };

  const inviteUrl = (token: string) =>
    `${window.location.origin}/accept-invite?token=${token}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-primary-500" />
              Team Members & Permissions
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-2">
              Invite teammates, assign roles, and control what each member can access.
            </p>
          </div>
          {canManageUsers && (
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <UserPlus className="h-4 w-4" />
              Invite Team Member
            </button>
          )}
        </div>

        {/* Members table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Members</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 text-primary-500 animate-spin mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-900/30 text-xs uppercase text-gray-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Role</th>
                    <th className="px-6 py-3 text-left">Access</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    {canManageUsers && <th className="px-6 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                        {m.profile?.name || '—'}
                        {m.user_id === user.id && (
                          <span className="ml-2 text-xs text-gray-400 dark:text-slate-500">(you)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{m.profile?.email || '—'}</td>
                      <td className="px-6 py-4">
                        <RoleBadge role={m.role} />
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400">
                        {m.scope === 'all' ? 'All Jobs' : 'Assigned Jobs Only'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={m.status} />
                      </td>
                      {canManageUsers && (
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setEditing(m)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded"
                            disabled={m.role === 'owner' && !isOwner}
                          >
                            <SettingsIcon className="h-3 w-3" /> Edit
                          </button>
                          {m.status === 'active' ? (
                            <button
                              onClick={() => handleSetStatus(m, 'inactive')}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 rounded ml-2"
                              disabled={m.role === 'owner' || m.user_id === user.id}
                              title="Deactivate keeps the membership but blocks access. Use Remove to delete entirely."
                            >
                              <Lock className="h-3 w-3" /> Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSetStatus(m, 'active')}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 rounded ml-2"
                              title="Restore this member's access"
                            >
                              <Check className="h-3 w-3" /> Reactivate
                            </button>
                          )}
                          <button
                            onClick={() => handleRemove(m)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded ml-2"
                            disabled={m.role === 'owner' || m.user_id === user.id}
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {!members.length && (
                    <tr>
                      <td colSpan={canManageUsers ? 6 : 5} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">
                        No team members yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending invitations */}
        {canManageUsers && invitations.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                Pending Invitations
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Invitations are emailed automatically. You can also copy the
                link below to share it manually.
              </p>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {invitations.map((inv) => (
                <li key={inv.id} className="p-6 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(inv.first_name || inv.last_name) && (
                        <span className="font-medium text-gray-900 dark:text-white">
                          {[inv.first_name, inv.last_name].filter(Boolean).join(' ')}
                        </span>
                      )}
                      <span className={`text-${(inv.first_name || inv.last_name) ? 'sm text-gray-500 dark:text-slate-400' : 'sm font-medium text-gray-900 dark:text-white'}`}>{inv.email}</span>
                      <RoleBadge role={inv.role} />
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {inv.scope === 'all' ? 'All Jobs' : 'Assigned Jobs Only'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      Expires {format(new Date(inv.expires_at), 'MMM d, yyyy')}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-900 rounded truncate max-w-md inline-block">
                        {inviteUrl(inv.token)}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inviteUrl(inv.token));
                          setCopiedToken(inv.token);
                          toast.success('Link copied');
                          setTimeout(() => setCopiedToken(null), 2000);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                      >
                        {copiedToken === inv.token ? (
                          <>
                            <Check className="h-3 w-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleResendInvite(inv)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-primary-600 hover:bg-primary-50 rounded-lg border border-primary-200"
                    >
                      <Mail className="h-3 w-3" /> Resend
                    </button>
                    <button
                      onClick={() => handleRevokeInvite(inv.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                    >
                      <X className="h-3 w-3" /> Revoke
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Standard user — show read-only summary of own permissions */}
        {!canManageUsers && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your access</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
              These permissions were set by your company Owner or Admin. Contact them to request changes.
            </p>
            <PermissionSummary member={member} />
          </div>
        )}
      </div>

      {showInvite && member && (
        <InviteModal
          companyId={member.company_id}
          inviterRole={member.role}
          inviterName={user.name || user.email || 'Your teammate'}
          companyName={company?.display_name || company?.name || 'your company'}
          onClose={() => setShowInvite(false)}
          onCreated={() => {
            setShowInvite(false);
            load();
          }}
        />
      )}

      {editing && (
        <EditMemberModal
          member={editing}
          inviterRole={member.role}
          isCurrentUser={editing.user_id === user.id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
};

// ─── Subcomponents ────────────────────────────────────────────────────────

const RoleBadge: React.FC<{ role: CompanyRole }> = ({ role }) => {
  const cls = role === 'owner'
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : role === 'admin'
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : 'bg-gray-100 text-gray-800 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cls}`}>
      <Shield className="h-3 w-3" />
      {ROLE_LABEL[role]}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls = status === 'active'
    ? 'bg-green-100 text-green-800'
    : status === 'pending'
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-gray-200 text-gray-700';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
};

const PermissionSummary: React.FC<{ member: CompanyMember }> = ({ member }) => {
  return (
    <div className="space-y-3">
      <div className="text-sm">
        <span className="font-medium text-gray-900 dark:text-white">Role: </span>
        <RoleBadge role={member.role} />
      </div>
      <div className="text-sm">
        <span className="font-medium text-gray-900 dark:text-white">Scope: </span>
        <span className="text-gray-600 dark:text-slate-400">
          {member.scope === 'all' ? 'All Jobs Across Account' : 'Assigned Jobs Only'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        {(Object.keys(PERMISSION_LABEL) as PermissionKey[]).map((k) => {
          const enabled =
            member.role === 'owner' ||
            (member.role === 'admin' && k !== 'manage_billing') ||
            (member.permissions || {})[k] === true;
          return (
            <div key={k} className="flex items-center gap-2 text-sm">
              {enabled ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-gray-300 dark:text-slate-600" />
              )}
              <span className={enabled ? 'text-gray-700 dark:text-slate-300' : 'text-gray-400 dark:text-slate-500'}>
                {PERMISSION_LABEL[k]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Invite Modal ─────────────────────────────────────────────────────────

const InviteModal: React.FC<{
  companyId: string;
  inviterRole: CompanyRole;
  inviterName: string;
  companyName: string;
  onClose: () => void;
  onCreated: () => void;
}> = ({ companyId, inviterRole, inviterName, companyName, onClose, onCreated }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'standard'>('standard');
  const [scope, setScope] = useState<AccessScope>('assigned');
  const [permissions, setPermissions] = useState<Permissions>(STANDARD_DEFAULT_PERMISSIONS);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      toast.error('Enter a valid email');
      return;
    }
    setSaving(true);

    // Generate a 32-byte URL-safe token client-side.
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const finalScope = role === 'admin' ? 'all' : scope;
    const finalPerms = role === 'admin' ? {} : permissions;
    const cleanFirst = firstName.trim() || null;
    const cleanLast = lastName.trim() || null;

    const { error } = await supabase.from('company_invitations').insert({
      company_id: companyId,
      email: cleanEmail,
      first_name: cleanFirst,
      last_name: cleanLast,
      role,
      scope: finalScope,
      permissions: finalPerms,
      token,
    });

    if (error) {
      setSaving(false);
      toast.error(error.message);
      return;
    }

    // Per Scott 2026-04-29 (#4) Phase 1.5: send the invitation by email.
    // Failure is non-fatal — the row exists and the link can still be
    // copy-pasted from the Pending Invitations panel.
    const inviteUrl = `${window.location.origin}/accept-invite?token=${token}`;
    const expiresOn = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(
      undefined,
      { month: 'long', day: 'numeric', year: 'numeric' },
    );
    const roleLabel = role === 'admin' ? 'Admin' : 'Standard User';
    const scopeLabel = role === 'standard'
      ? finalScope === 'all' ? 'All Jobs' : 'Assigned Jobs Only'
      : '';

    try {
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const recipientFirstName = cleanFirst || '';
      const res = await fetch(`${url}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({
          to: cleanEmail,
          subject: recipientFirstName
            ? `${recipientFirstName}, ${inviterName} invited you to join ${companyName}`
            : `${inviterName} invited you to join ${companyName} on HireQuadrant`,
          template: 'team_invitation',
          variables: {
            companyName,
            inviterName,
            recipientFirstName,
            roleLabel,
            scopeLabel,
            inviteUrl,
            expiresOn,
          },
        }),
      });
      if (res.ok) {
        toast.success(`Invitation sent to ${cleanEmail}`);
      } else {
        toast.success('Invitation created — copy the link from the table to share it');
      }
    } catch {
      toast.success('Invitation created — copy the link from the table to share it');
    } finally {
      setSaving(false);
    }
    onCreated();
  };

  const togglePerm = (k: PermissionKey) =>
    setPermissions((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invite Team Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-400"
                placeholder="Sarah"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-400"
                placeholder="Lee"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-400"
              placeholder="recruiter@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Role</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(['admin', 'standard'] as const).map((r) => {
                // Admins can only invite Standards (cannot escalate).
                const disabled = inviterRole !== 'owner' && r === 'admin';
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => !disabled && setRole(r)}
                    disabled={disabled}
                    className={`text-left p-3 rounded-lg border ${
                      role === r
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-200 dark:border-slate-700'
                    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary-300'}`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{ROLE_LABEL[r]}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {ROLE_DESCRIPTION[r]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {role === 'standard' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Candidate Access
                </label>
                <div className="space-y-2">
                  {(['assigned', 'all'] as const).map((s) => (
                    <label key={s} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={scope === s}
                        onChange={() => setScope(s)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {s === 'assigned' ? 'Assigned Jobs Only' : 'All Jobs Across Account'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {s === 'assigned'
                            ? 'User can only view applicants tied to jobs assigned to them.'
                            : 'User can view/contact applicants across the entire company account.'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {PERMISSION_GROUPS.map((g) => (
                <div key={g.title}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {g.title}
                  </label>
                  {g.description && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">{g.description}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {g.keys.map((k) => (
                      <label key={k} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={permissions[k]}
                          onChange={() => togglePerm(k)}
                        />
                        <span className="text-gray-700 dark:text-slate-300">{PERMISSION_LABEL[k]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
            Create Invitation
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Edit Member Modal ────────────────────────────────────────────────────

const EditMemberModal: React.FC<{
  member: MemberWithProfile;
  inviterRole: CompanyRole;
  isCurrentUser: boolean;
  onClose: () => void;
  onSaved: () => void;
}> = ({ member, inviterRole, isCurrentUser, onClose, onSaved }) => {
  const [role, setRole] = useState<CompanyRole>(member.role);
  const [scope, setScope] = useState<AccessScope>(member.scope);
  const [permissions, setPermissions] = useState<Permissions>({
    ...STANDARD_DEFAULT_PERMISSIONS,
    ...member.permissions,
  });
  const [saving, setSaving] = useState(false);

  // An Admin cannot promote anyone to Owner (only Owner can transfer ownership,
  // not modeled in Phase 1 MVP). They also cannot edit the existing Owner.
  const lockedRole = member.role === 'owner' || isCurrentUser;
  const availableRoles: CompanyRole[] = lockedRole
    ? [member.role]
    : inviterRole === 'owner'
    ? ['admin', 'standard']
    : ['standard'];

  const togglePerm = (k: PermissionKey) =>
    setPermissions((p) => ({ ...p, [k]: !p[k] }));

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('company_members')
      .update({
        role,
        scope: role === 'standard' ? scope : 'all',
        permissions: role === 'standard' ? permissions : {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Permissions updated');
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Permissions
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {member.profile?.name || member.profile?.email}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {member.role === 'owner' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              The Owner role can only be changed via Transfer Ownership, not modeled in
              Phase 1 MVP.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Role</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => !lockedRole && setRole(r)}
                  disabled={lockedRole}
                  className={`text-left p-3 rounded-lg border ${
                    role === r
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 dark:border-slate-700'
                  } ${lockedRole ? 'opacity-60' : 'hover:border-primary-300'}`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{ROLE_LABEL[r]}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {ROLE_DESCRIPTION[r]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {role === 'standard' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Candidate Access
                </label>
                <div className="space-y-2">
                  {(['assigned', 'all'] as const).map((s) => (
                    <label key={s} className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" checked={scope === s} onChange={() => setScope(s)} className="mt-1" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {s === 'assigned' ? 'Assigned Jobs Only' : 'All Jobs Across Account'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {PERMISSION_GROUPS.map((g) => (
                <div key={g.title}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    {g.title}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {g.keys.map((k) => (
                      <label key={k} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="checkbox" checked={permissions[k]} onChange={() => togglePerm(k)} />
                        <span className="text-gray-700 dark:text-slate-300">{PERMISSION_LABEL[k]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || (member.role === 'owner' && !isCurrentUser)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamMembers;
