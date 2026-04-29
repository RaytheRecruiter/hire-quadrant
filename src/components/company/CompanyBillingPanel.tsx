// Per Scott 2026-04-29 Phase 2 — fills the previously placeholder
// Subscription tab. Shows the company's current plan, job usage, and the
// upgrade catalog. The "Change plan" / "Manage billing" actions are gated
// on the manage_billing permission.
//
// Phase 2.1 (next): wire actual Stripe Customer Portal links here. For
// now the button surfaces a mailto so Standard users can request a plan
// change while Owners get a working contact path.

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Lock,
  Calendar,
  Briefcase,
  Sparkles,
  Mail,
  KeyRound,
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../utils/supabaseClient';
import { useSubscription } from '../../hooks/useSubscription';
import { usePermissions } from '../../hooks/usePermissions';

interface Props {
  companyId: string;
}

const STATUS_BADGE: Record<
  'active' | 'past_due' | 'canceled' | 'trialing' | 'inactive',
  { label: string; className: string }
> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-800' },
  trialing: { label: 'Trial', className: 'bg-blue-100 text-blue-800' },
  past_due: { label: 'Past due', className: 'bg-amber-100 text-amber-800' },
  canceled: { label: 'Canceled', className: 'bg-rose-100 text-rose-800' },
  inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-700' },
};

const fmtPrice = (cents: number) => {
  if (!cents || cents <= 0) return 'Free';
  return `$${(cents / 100).toFixed(0)}/mo`;
};

const CompanyBillingPanel: React.FC<Props> = ({ companyId }) => {
  const { isOwner, isAdmin, can, member } = usePermissions();
  const noMember = !member;
  const canManageBilling = noMember || isOwner || isAdmin || can('manage_billing');

  const { plans, currentSubscription, jobsUsed, loading, error } = useSubscription({ companyId });

  // Phase 2 #5: pull current period unlock credit usage so the panel can
  // surface "X / Y unlocks used this period". Optional — failure here is
  // non-fatal; the rest of the panel still renders.
  const [unlocks, setUnlocks] = useState<{ total: number; used: number; remaining: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc('unlocks_remaining', { p_company_id: companyId });
      if (cancelled) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (row && typeof row.total === 'number') {
        setUnlocks({ total: row.total, used: row.used, remaining: row.remaining });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500 mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  const currentPlan = currentSubscription?.subscription_plans;
  const limit = currentSubscription?.job_limit ?? 0;
  const jobLimitLabel = limit === -1 ? 'Unlimited' : limit;
  const usagePct = limit > 0 ? Math.min(100, Math.round((jobsUsed / limit) * 100)) : 0;
  const usageTone =
    limit === -1
      ? 'bg-emerald-500'
      : usagePct >= 95
      ? 'bg-rose-500'
      : usagePct >= 75
      ? 'bg-amber-500'
      : 'bg-primary-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary-600" />
          Subscription & Billing
        </h2>
        {canManageBilling ? (
          <a
            href="mailto:billing@hirequadrant.com?subject=Plan%20change%20request"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-400 hover:text-primary-600 transition"
          >
            <Mail className="h-4 w-4" />
            Contact billing
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
            <Lock className="h-3.5 w-3.5" />
            Billing managed by Owner
          </span>
        )}
      </div>

      {/* Current plan card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
        {currentSubscription && currentPlan ? (
          <>
            <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1">Current plan</p>
                <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{currentPlan.name}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                  {fmtPrice(currentPlan.price_monthly)}
                  {currentPlan.price_yearly > 0 && ` · $${(currentPlan.price_yearly / 100).toFixed(0)}/yr`}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  STATUS_BADGE[currentSubscription.status].className
                }`}
              >
                {STATUS_BADGE[currentSubscription.status].label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> Job postings
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {jobsUsed} / {jobLimitLabel}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                  <KeyRound className="h-3 w-3" /> Unlocks
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {unlocks ? `${unlocks.used} / ${unlocks.total}` : '—'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Period ends
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {currentSubscription.current_period_end
                    ? format(new Date(currentSubscription.current_period_end), 'MMM d, yyyy')
                    : '—'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-slate-400">Stripe customer</p>
                <p className="text-xs font-mono text-gray-900 dark:text-white mt-1 truncate">
                  {currentSubscription.stripe_customer_id || '—'}
                </p>
              </div>
            </div>

            {limit > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-600 dark:text-slate-400">Usage this period</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">{usagePct}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${usageTone} transition-all`} style={{ width: `${usagePct}%` }} />
                </div>
                {usagePct >= 90 && (
                  <p className="text-xs text-amber-700 mt-2">
                    You're nearing your job posting limit. Upgrade to keep posting without interruption.
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No active subscription</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Contact the HireQuadrant team to assign a plan to your company.
            </p>
          </div>
        )}
      </div>

      {/* Plans catalog */}
      {plans.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-600" />
            Available plans
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans
              .filter((p) => p.is_active)
              .map((plan) => {
                const isCurrent = plan.id === currentSubscription?.plan_id;
                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border p-5 ${
                      isCurrent
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-secondary-900 dark:text-white">{plan.name}</h4>
                      {isCurrent && (
                        <span className="text-[10px] uppercase tracking-wide bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-primary-600 mb-2">{fmtPrice(plan.price_monthly)}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                      {plan.job_limit === -1 ? 'Unlimited jobs' : `${plan.job_limit} jobs`}
                    </p>
                    {(plan as { monthly_unlock_credits?: number }).monthly_unlock_credits != null && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                        <KeyRound className="h-3 w-3 text-amber-500" />
                        {(plan as { monthly_unlock_credits?: number }).monthly_unlock_credits} unlock credits / mo
                      </p>
                    )}
                    {Array.isArray(plan.features) && plan.features.length > 0 && (
                      <ul className="space-y-1.5 mb-4">
                        {plan.features.slice(0, 5).map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-slate-300">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!isCurrent && canManageBilling && (
                      <a
                        href={`mailto:billing@hirequadrant.com?subject=Upgrade%20to%20${encodeURIComponent(plan.name)}`}
                        className="block text-center text-xs px-3 py-1.5 rounded-lg border border-primary-400 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 font-medium"
                      >
                        Request upgrade
                      </a>
                    )}
                    {!isCurrent && !canManageBilling && (
                      <p className="text-xs text-center text-gray-400 dark:text-slate-500 italic">
                        Owner can request upgrade
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyBillingPanel;
