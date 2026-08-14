// "Promote this job" modal — Phase 2 (PROMOTE) of Ray's monetization spec,
// 2026-08-14. Replaces the old free tier dropdown in CompanyJobsList.tsx
// with a real one-time Stripe purchase: pick a sponsorship tier, optionally
// bundle the Urgent Hiring add-on, checkout for both in one Stripe session.
//
// Pricing is read live from sponsorship_plans / job_addons (admin-editable
// under Admin → Pricing) rather than hard-coded here.

import React, { useEffect, useState } from 'react';
import { X, Loader2, Sparkles, Zap, Mail } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { isStripeEnabled, createJobSponsorshipCheckout } from '../../utils/stripeClient';

interface SponsorshipPlan {
  id: string;
  tier: number;
  name: string;
  price_cents: number;
  duration_days: number;
  stripe_price_id: string | null;
  features: string[];
  is_active: boolean;
}

interface JobAddon {
  id: string;
  key: string;
  name: string;
  price_cents: number;
  duration_days: number;
  stripe_price_id: string | null;
  is_active: boolean;
}

interface Props {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
}

const fmt = (cents: number) => `$${(cents / 100).toFixed(0)}`;

const SponsorJobModal: React.FC<Props> = ({ jobId, jobTitle, onClose }) => {
  const [plans, setPlans] = useState<SponsorshipPlan[]>([]);
  const [urgentAddon, setUrgentAddon] = useState<JobAddon | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [wantsUrgent, setWantsUrgent] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: planData }, { data: addonData }] = await Promise.all([
        supabase.from('sponsorship_plans').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('job_addons').select('*').eq('key', 'urgent_hiring').eq('is_active', true).maybeSingle(),
      ]);
      if (cancelled) return;
      setPlans(planData || []);
      setUrgentAddon(addonData || null);
      if (planData && planData.length > 0) setSelectedTier(planData[0].tier);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPlan = plans.find((p) => p.tier === selectedTier) || null;
  const canCheckout = isStripeEnabled() && !!selectedPlan?.stripe_price_id && (!wantsUrgent || !!urgentAddon?.stripe_price_id);
  const totalCents = (selectedPlan?.price_cents || 0) + (wantsUrgent && urgentAddon ? urgentAddon.price_cents : 0);

  const handleCheckout = async () => {
    if (!selectedPlan?.stripe_price_id) return;
    setCheckoutBusy(true);
    try {
      const url = await createJobSponsorshipCheckout(
        jobId,
        {
          stripePriceId: selectedPlan.stripe_price_id,
          tier: selectedPlan.tier,
          durationDays: selectedPlan.duration_days,
          priceCents: selectedPlan.price_cents,
        },
        wantsUrgent && urgentAddon?.stripe_price_id
          ? {
              stripePriceId: urgentAddon.stripe_price_id,
              durationDays: urgentAddon.duration_days,
              priceCents: urgentAddon.price_cents,
            }
          : undefined
      );
      if (url) window.location.href = url;
    } finally {
      setCheckoutBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Promote "{jobTitle}"
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Boost visibility with a paid sponsorship tier.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500 mx-auto" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedTier(plan.tier)}
                    className={`text-left rounded-xl border p-4 transition ${
                      selectedTier === plan.tier
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                    }`}
                  >
                    <p className="font-bold text-secondary-900 dark:text-white">{plan.name}</p>
                    <p className="text-xl font-bold text-primary-600 mt-1">{fmt(plan.price_cents)}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{plan.duration_days} days</p>
                    {Array.isArray(plan.features) && plan.features.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {plan.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="text-[11px] text-gray-600 dark:text-slate-400">
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                ))}
              </div>

              {urgentAddon && (
                <label className="flex items-start gap-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 p-4 mb-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantsUrgent}
                    onChange={(e) => setWantsUrgent(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-secondary-900 dark:text-white flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-600" />
                      {urgentAddon.name} — +{fmt(urgentAddon.price_cents)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Adds an "Urgent Hiring" badge for {urgentAddon.duration_days} days.
                    </p>
                  </div>
                </label>
              )}

              <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 pt-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Total</p>
                  <p className="text-xl font-bold text-secondary-900 dark:text-white">{fmt(totalCents)}</p>
                </div>
                {canCheckout ? (
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutBusy || !selectedPlan}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-60"
                  >
                    {checkoutBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Continue to checkout
                  </button>
                ) : (
                  <a
                    href={`mailto:billing@hirequadrant.com?subject=Sponsor%20job:%20${encodeURIComponent(jobTitle)}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary-400 text-primary-600 font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/30"
                  >
                    <Mail className="h-4 w-4" />
                    Request sponsorship
                  </a>
                )}
              </div>
              {!isStripeEnabled() && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                  Online checkout is coming soon — use "Request sponsorship" in the meantime.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SponsorJobModal;
