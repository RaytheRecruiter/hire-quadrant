import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useSubscription, SubscriptionPlan } from '../../hooks/useSubscription';
import SubscriptionBadge from '../SubscriptionBadge';
import { Save, AlertCircle, CheckCircle, Building2, Shield, ArrowRightLeft, Loader2, X } from 'lucide-react';

interface CompanyRow {
  id: string;
  name: string;
  display_name: string;
  currentPlanId: string | null;
  currentPlanName: string | null;
  jobsPosted: number;
  selectedPlanId: string;
  saving: boolean;
  // Per Scott 2026-04-29 (#16): every company should surface its primary user
  // (the Owner from company_members). Loaded alongside the row.
  ownerName: string | null;
  ownerEmail: string | null;
}

const SubscriptionManager: React.FC = () => {
  const { plans, allSubscriptions, loading, error: hookError, assignPlan } = useSubscription({ isAdmin: true });
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] = useState<CompanyRow | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);

        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, display_name');

        if (companiesError) throw companiesError;

        // Pull every Owner row alongside the basic profile so we can show
        // the primary user inline. One query, then mapped by company_id.
        const { data: ownerRows } = await supabase
          .from('company_members')
          .select('company_id, user_id')
          .eq('role', 'owner')
          .eq('status', 'active');
        const ownerUserIds = (ownerRows || []).map((r) => r.user_id);
        const { data: ownerProfiles } = ownerUserIds.length
          ? await supabase
              .from('user_profiles')
              .select('id, name, email')
              .in('id', ownerUserIds)
          : { data: [] as Array<{ id: string; name: string | null; email: string | null }> };
        const profileById = new Map(
          (ownerProfiles || []).map((p) => [p.id, { name: p.name, email: p.email }]),
        );
        const ownerByCompany = new Map<string, { name: string | null; email: string | null }>();
        for (const row of ownerRows || []) {
          const profile = profileById.get(row.user_id);
          if (profile) ownerByCompany.set(row.company_id, profile);
        }

        // Build company rows with subscription info
        const rows: CompanyRow[] = (companiesData || []).map(company => {
          const sub = allSubscriptions.find(s => s.company_id === company.id);
          const owner = ownerByCompany.get(company.id);
          return {
            id: company.id,
            name: company.name,
            display_name: company.display_name,
            currentPlanId: sub?.plan_id || null,
            currentPlanName: sub?.subscription_plans?.name || null,
            jobsPosted: 0, // Will be populated if needed
            selectedPlanId: sub?.plan_id || '',
            saving: false,
            ownerName: owner?.name || null,
            ownerEmail: owner?.email || null,
          };
        });

        setCompanies(rows);
      } catch (err: any) {
        console.error('Error fetching companies:', err);
        setError(err.message || 'Failed to load companies');
      } finally {
        setLoadingCompanies(false);
      }
    };

    if (!loading) {
      fetchCompanies();
    }
  }, [loading, allSubscriptions]);

  const handlePlanChange = (companyId: string, planId: string) => {
    setCompanies(prev =>
      prev.map(c => (c.id === companyId ? { ...c, selectedPlanId: planId } : c))
    );
  };

  const handleSave = async (company: CompanyRow) => {
    if (!company.selectedPlanId) return;

    setCompanies(prev =>
      prev.map(c => (c.id === company.id ? { ...c, saving: true } : c))
    );
    setError(null);
    setSuccessMessage(null);

    const success = await assignPlan(company.id, company.selectedPlanId);

    if (success) {
      const plan = plans.find(p => p.id === company.selectedPlanId);
      setCompanies(prev =>
        prev.map(c =>
          c.id === company.id
            ? {
                ...c,
                currentPlanId: company.selectedPlanId,
                currentPlanName: plan?.name || null,
                saving: false,
              }
            : c
        )
      );
      setSuccessMessage(`Plan updated for ${company.display_name || company.name}.`);
    } else {
      setCompanies(prev =>
        prev.map(c => (c.id === company.id ? { ...c, saving: false } : c))
      );
      setError('Failed to update plan. Please try again.');
    }
  };

  const getPlanJobLimit = (planId: string): string => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return '-';
    return plan.job_limit === -1 ? 'Unlimited' : String(plan.job_limit);
  };

  if (loading || loadingCompanies) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-green-600" />
          Subscription Manager
        </h2>
      </div>

      {(error || hookError) && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error || hookError}</p>
        </div>
      )}

      {successMessage && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      <div className="p-6">
        {companies.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400">No companies found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Primary User (Owner)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Current Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Job Limit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Assign Plan
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {company.display_name || company.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {company.ownerName || company.ownerEmail ? (
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-amber-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {company.ownerName || company.ownerEmail}
                              </div>
                              {company.ownerName && company.ownerEmail && (
                                <div className="text-xs text-gray-500 dark:text-slate-400">{company.ownerEmail}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-slate-500">No primary user</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setTransferTarget(company)}
                          className="text-xs text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 ml-1"
                          title="Transfer ownership to another team member"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          Change
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {company.currentPlanName ? (
                        <SubscriptionBadge planName={company.currentPlanName} />
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-slate-500">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-slate-400">
                        {company.currentPlanId ? getPlanJobLimit(company.currentPlanId) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={company.selectedPlanId}
                        onChange={(e) => handlePlanChange(company.id, e.target.value)}
                        className="block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                      >
                        <option value="">Select a plan</option>
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} ({plan.job_limit === -1 ? 'Unlimited' : plan.job_limit} jobs)
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleSave(company)}
                        disabled={
                          !company.selectedPlanId ||
                          company.selectedPlanId === company.currentPlanId ||
                          company.saving
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        {company.saving ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {transferTarget && (
        <TransferOwnershipModal
          company={transferTarget}
          onClose={() => setTransferTarget(null)}
          onTransferred={() => {
            setTransferTarget(null);
            // Refresh the panel so the new Owner shows in the row.
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

// ─── Transfer Ownership Modal ──────────────────────────────────────────────

interface TransferModalProps {
  company: CompanyRow;
  onClose: () => void;
  onTransferred: () => void;
}

const TransferOwnershipModal: React.FC<TransferModalProps> = ({ company, onClose, onTransferred }) => {
  const [members, setMembers] = useState<Array<{ user_id: string; role: string; name: string | null; email: string | null }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: rows } = await supabase
        .from('company_members')
        .select('user_id, role')
        .eq('company_id', company.id)
        .eq('status', 'active');
      if (cancelled) return;
      const ids = (rows || []).map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
      if (cancelled) return;
      const profileMap = new Map((profiles || []).map((p: { id: string; name: string | null; email: string | null }) => [p.id, p]));
      setMembers(
        (rows || []).map((r) => ({
          user_id: r.user_id,
          role: r.role,
          name: profileMap.get(r.user_id)?.name ?? null,
          email: profileMap.get(r.user_id)?.email ?? null,
        })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [company.id]);

  const handleConfirm = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    setErrorMsg(null);
    const { error } = await supabase.rpc('transfer_company_ownership', {
      p_company_id: company.id,
      p_new_owner_user_id: selectedUserId,
    });
    setSaving(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    onTransferred();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Transfer Ownership
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {company.display_name || company.name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Pick the new Primary User. The current Owner will be demoted to Admin
            so they keep operational access.
          </p>
          {loading ? (
            <div className="text-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500 mx-auto" />
            </div>
          ) : members.length <= 1 ? (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              No other active members. Invite a teammate first, then transfer
              ownership to them.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {members
                .filter((m) => m.role !== 'owner')
                .map((m) => (
                  <label
                    key={m.user_id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                      selectedUserId === m.user_id
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="newOwner"
                      checked={selectedUserId === m.user_id}
                      onChange={() => setSelectedUserId(m.user_id)}
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {m.name || m.email || m.user_id}
                      </div>
                      {m.name && m.email && (
                        <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{m.email}</div>
                      )}
                      <div className="text-xs text-gray-400 dark:text-slate-500 capitalize">
                        Currently: {m.role}
                      </div>
                    </div>
                  </label>
                ))}
            </div>
          )}
          {errorMsg && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
              {errorMsg}
            </div>
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
            onClick={handleConfirm}
            disabled={!selectedUserId || saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;
