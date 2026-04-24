import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useSubscription, SubscriptionPlan } from '../../hooks/useSubscription';
import SubscriptionBadge from '../SubscriptionBadge';
import { Save, AlertCircle, CheckCircle, Building2 } from 'lucide-react';

interface CompanyRow {
  id: string;
  name: string;
  display_name: string;
  currentPlanId: string | null;
  currentPlanName: string | null;
  jobsPosted: number;
  selectedPlanId: string;
  saving: boolean;
}

const SubscriptionManager: React.FC = () => {
  const { plans, allSubscriptions, loading, error: hookError, assignPlan } = useSubscription({ isAdmin: true });
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);

        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, display_name');

        if (companiesError) throw companiesError;

        // Build company rows with subscription info
        const rows: CompanyRow[] = (companiesData || []).map(company => {
          const sub = allSubscriptions.find(s => s.company_id === company.id);
          return {
            id: company.id,
            name: company.name,
            display_name: company.display_name,
            currentPlanId: sub?.plan_id || null,
            currentPlanName: sub?.subscription_plans?.name || null,
            jobsPosted: 0, // Will be populated if needed
            selectedPlanId: sub?.plan_id || '',
            saving: false,
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
    </div>
  );
};

export default SubscriptionManager;
