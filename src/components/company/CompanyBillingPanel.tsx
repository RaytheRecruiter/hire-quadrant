// Per Scott 2026-04-29 Phase 2 — fills the previously placeholder
// Subscription tab. Shows the company's current plan, credit usage, and
// the Resume Database plan catalog.
//
// 2026-08-14: repriced for Ray's Resume Database (SOURCE) product —
// job-limit gating is retired (job posting is always free), "Change
// plan" / "Buy more contacts" now call real Stripe Checkout via
// createCheckoutSession/createAddOnCheckoutSession. Both no-op with a
// "billing coming soon" fallback until VITE_STRIPE_ENABLED + a
// publishable key are configured (no Stripe account exists yet).
//
// Phase 2.1 (next): wire actual Stripe Customer Portal links here. For
// now "Contact billing" surfaces a mailto so Standard users can request a
// plan change while Owners get a working contact path.

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Lock,
  Calendar,
  Sparkles,
  Mail,
  KeyRound,
  Plus,
  Ban,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../utils/supabaseClient';
import { useSubscription } from '../../hooks/useSubscription';
import { usePermissions } from '../../hooks/usePermissions';
import {
  isStripeEnabled,
  createCheckoutSession,
  createAddOnCheckoutSession,
  changePlan,
  cancelSubscription,
  resumeSubscription,
} from '../../utils/stripeClient';

interface Props {
  companyId: string;
}

interface ContactCreditPack {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  stripe_price_id: string | null;
  is_active: boolean;
  sort_order: number;
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

const fmtPrice = (cents: number, suffix: string) => {
  if (!cents || cents <= 0) return 'Free';
  return `$${(cents / 100).toFixed(0)}${suffix}`;
};

const CompanyBillingPanel: React.FC<Props> = ({ companyId }) => {
  const { isOwner, isAdmin, can, member } = usePermissions();
  const noMember = !member;
  const canManageBilling = noMember || isOwner || isAdmin || can('manage_billing');

  const { plans, currentSubscription, loading, error, refetch } = useSubscription({ companyId });
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'annual'>('monthly');
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);
  const [creditPacks, setCreditPacks] = useState<ContactCreditPack[]>([]);
  const [cancelBusy, setCancelBusy] = useState(false);

  const [unlocks, setUnlocks] = useState<{
    total: number;
    used: number;
    remaining: number;
    purchased_remaining: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc('unlocks_remaining', { p_company_id: companyId });
      if (cancelled) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (row && typeof row.total === 'number') {
        setUnlocks({
          total: row.total,
          used: row.used,
          remaining: row.remaining,
          purchased_remaining: row.purchased_remaining || 0,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('contact_credit_packs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (!cancelled && data) setCreditPacks(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubscribe = async (planId: string, priceId: string | null) => {
    if (!isStripeEnabled() || !priceId) return;
    setCheckoutBusy(planId);
    try {
      // Already have a real (non-comp) Stripe subscription -> change it in
      // place instead of starting a second, duplicate subscription.
      if (currentSubscription?.stripe_subscription_id && !currentSubscription.is_comp) {
        const result = await changePlan(planId, billingFrequency);
        if (result.success) {
          await refetch();
        } else if (result.error) {
          alert(result.error);
        }
      } else {
        const url = await createCheckoutSession(priceId, planId, billingFrequency);
        if (url) window.location.href = url;
      }
    } finally {
      setCheckoutBusy(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription? You\'ll keep access until the end of the current billing period.')) return;
    setCancelBusy(true);
    const result = await cancelSubscription();
    setCancelBusy(false);
    if (result.success) await refetch();
    else if (result.error) alert(result.error);
  };

  const handleResume = async () => {
    setCancelBusy(true);
    const result = await resumeSubscription();
    setCancelBusy(false);
    if (result.success) await refetch();
    else if (result.error) alert(result.error);
  };

  const handleBuyCredits = async (pack: ContactCreditPack) => {
    if (!isStripeEnabled() || !pack.stripe_price_id) return;
    setCheckoutBusy(pack.id);
    try {
      const url = await createAddOnCheckoutSession(pack.stripe_price_id, pack.credits);
      if (url) window.location.href = url;
    } finally {
      setCheckoutBusy(null);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary-600" />
          Resume Database Subscription
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

      {!isStripeEnabled() && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200">
          Online checkout is coming soon. Use "Contact billing" above to change your plan or buy more contacts in the meantime.
        </div>
      )}

      {/* Current plan card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
        {currentSubscription && currentPlan ? (
          <>
            <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1">Current plan</p>
                <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{currentPlan.name}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                  {fmtPrice(currentPlan.price_monthly, '/mo')}
                  {currentPlan.price_yearly > 0 && ` · ${fmtPrice(currentPlan.price_yearly, '/yr')}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    STATUS_BADGE[currentSubscription.status].className
                  }`}
                >
                  {STATUS_BADGE[currentSubscription.status].label}
                </span>
                {currentSubscription.is_comp && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">
                    <ShieldCheck className="h-3 w-3" />
                    Comp account
                  </span>
                )}
                {currentSubscription.cancel_at_period_end && (
                  <span className="text-[10px] text-rose-600 font-medium">Cancels at period end</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                  <KeyRound className="h-3 w-3" /> Monthly unlocks
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {unlocks ? `${unlocks.used} / ${unlocks.total}` : '—'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Purchased contacts remaining
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {unlocks ? unlocks.purchased_remaining : '—'}
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
            </div>

            {canManageBilling && currentSubscription.stripe_subscription_id && !currentSubscription.is_comp && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                {currentSubscription.cancel_at_period_end ? (
                  <button
                    onClick={handleResume}
                    disabled={cancelBusy}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800 disabled:opacity-60"
                  >
                    {cancelBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    Resume subscription
                  </button>
                ) : (
                  <button
                    onClick={handleCancel}
                    disabled={cancelBusy}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-800 disabled:opacity-60"
                  >
                    {cancelBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                    Cancel subscription
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No active subscription</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Subscribe to a Resume Database plan below to search and unlock candidates.
            </p>
          </div>
        )}
      </div>

      {/* Plans catalog */}
      {plans.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              Resume Database plans
            </h3>
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-slate-700 p-0.5 bg-gray-50 dark:bg-slate-900/50">
              {(['monthly', 'annual'] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setBillingFrequency(freq)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    billingFrequency === freq
                      ? 'bg-white dark:bg-slate-800 shadow text-primary-600'
                      : 'text-gray-500 dark:text-slate-400'
                  }`}
                >
                  {freq === 'monthly' ? 'Monthly' : 'Annual (save ~17%)'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans
              .filter((p) => p.is_active)
              .map((plan) => {
                const isCurrent = plan.id === currentSubscription?.plan_id;
                const priceCents = billingFrequency === 'monthly' ? plan.price_monthly : plan.price_yearly;
                const priceId =
                  billingFrequency === 'monthly' ? plan.stripe_price_id_monthly : plan.stripe_price_id_annual;
                const canCheckout = isStripeEnabled() && !!priceId && !plan.requires_manual_upgrade;
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
                    <p className="text-2xl font-bold text-primary-600 mb-2">
                      {fmtPrice(priceCents, billingFrequency === 'monthly' ? '/mo' : '/yr')}
                    </p>
                    {plan.monthly_unlock_credits != null && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                        <KeyRound className="h-3 w-3 text-amber-500" />
                        {plan.monthly_unlock_credits} unlock credits / mo
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
                    {!isCurrent && canManageBilling && canCheckout && (
                      <button
                        type="button"
                        disabled={checkoutBusy === plan.id}
                        onClick={() => handleSubscribe(plan.id, priceId)}
                        className="w-full text-center text-xs px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium disabled:opacity-60"
                      >
                        {checkoutBusy === plan.id
                          ? currentSubscription?.stripe_subscription_id ? 'Updating…' : 'Redirecting…'
                          : currentSubscription?.stripe_subscription_id ? 'Change plan' : 'Subscribe'}
                      </button>
                    )}
                    {!isCurrent && canManageBilling && !canCheckout && (
                      <a
                        href={`mailto:billing@hirequadrant.com?subject=${plan.requires_manual_upgrade ? 'Switch%20to' : 'Upgrade%20to'}%20${encodeURIComponent(plan.name)}`}
                        className="block text-center text-xs px-3 py-1.5 rounded-lg border border-primary-400 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 font-medium"
                      >
                        {plan.requires_manual_upgrade ? 'Contact sales' : 'Request upgrade'}
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
          <div className="mt-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-4 text-center text-xs text-gray-500 dark:text-slate-400">
            Need more than 200 unlocks/month or multiple team seats?{' '}
            <a href="mailto:billing@hirequadrant.com?subject=Enterprise%20Resume%20Database" className="text-primary-600 font-medium">
              Contact sales for Enterprise
            </a>
            .
          </div>
        </div>
      )}

      {/* Buy more contacts */}
      {currentSubscription && creditPacks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary-600" />
            Buy more contacts
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
            Purchased contacts never expire and are used only after your monthly allowance runs out.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {creditPacks.map((pack) => {
              const canCheckout = isStripeEnabled() && !!pack.stripe_price_id;
              return (
                <div
                  key={pack.id}
                  className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-center"
                >
                  <p className="text-2xl font-bold text-secondary-900 dark:text-white">{pack.credits}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">contacts</p>
                  <p className="text-lg font-semibold text-primary-600 mb-3">{fmtPrice(pack.price_cents, '')}</p>
                  {canManageBilling && canCheckout && (
                    <button
                      type="button"
                      disabled={checkoutBusy === pack.id}
                      onClick={() => handleBuyCredits(pack)}
                      className="w-full text-xs px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium disabled:opacity-60"
                    >
                      {checkoutBusy === pack.id ? 'Redirecting…' : 'Buy'}
                    </button>
                  )}
                  {canManageBilling && !canCheckout && (
                    <a
                      href={`mailto:billing@hirequadrant.com?subject=Buy%20${pack.credits}%20contacts`}
                      className="block text-xs px-3 py-1.5 rounded-lg border border-primary-400 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 font-medium"
                    >
                      Request
                    </a>
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
