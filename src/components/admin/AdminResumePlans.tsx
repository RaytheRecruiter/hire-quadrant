// Minimal admin editor for Resume Database pricing (2026-08-14).
//
// SubscriptionManager (adjacent tab) assigns an existing plan to a
// company. This edits the plan *catalog* itself — price, monthly unlock
// credits, active flag, and the Stripe Price IDs that get pasted in once
// Rafael creates the matching Products/Prices in the Stripe Dashboard.
// Also covers the one-time contact_credit_packs ("buy more contacts").
//
// Prices are edited as whole dollars in the UI; subscription_plans /
// contact_credit_packs store cents (matching CompanyBillingPanel's
// fmtPrice, which divides by 100).

import React, { useEffect, useState } from 'react';
import { Loader2, Save, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface PlanRow {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  monthly_unlock_credits: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
  is_active: boolean;
}

interface CreditPackRow {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  stripe_price_id: string | null;
  is_active: boolean;
}

interface SponsorshipPlanRow {
  id: string;
  tier: number;
  name: string;
  price_cents: number;
  duration_days: number;
  stripe_price_id: string | null;
  is_active: boolean;
}

interface JobAddonRow {
  id: string;
  key: string;
  name: string;
  price_cents: number;
  duration_days: number;
  stripe_price_id: string | null;
  is_active: boolean;
}

const dollars = (cents: number) => (cents / 100).toFixed(0);

const AdminResumePlans: React.FC = () => {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [packs, setPacks] = useState<CreditPackRow[]>([]);
  const [sponsorshipPlans, setSponsorshipPlans] = useState<SponsorshipPlanRow[]>([]);
  const [jobAddons, setJobAddons] = useState<JobAddonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: planData }, { data: packData }, { data: sponsorData }, { data: addonData }] = await Promise.all([
      supabase.from('subscription_plans').select('*').order('sort_order'),
      supabase.from('contact_credit_packs').select('*').order('sort_order'),
      supabase.from('sponsorship_plans').select('*').order('sort_order'),
      supabase.from('job_addons').select('*'),
    ]);
    setPlans(planData || []);
    setPacks(packData || []);
    setSponsorshipPlans(sponsorData || []);
    setJobAddons(addonData || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const savePlan = async (plan: PlanRow) => {
    setSavingId(plan.id);
    setMessage(null);
    const { error } = await supabase
      .from('subscription_plans')
      .update({
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        monthly_unlock_credits: plan.monthly_unlock_credits,
        stripe_price_id_monthly: plan.stripe_price_id_monthly || null,
        stripe_price_id_annual: plan.stripe_price_id_annual || null,
        is_active: plan.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', plan.id);
    setSavingId(null);
    setMessage(
      error
        ? { type: 'error', text: `Failed to save ${plan.name}: ${error.message}` }
        : { type: 'success', text: `${plan.name} saved.` }
    );
  };

  const savePack = async (pack: CreditPackRow) => {
    setSavingId(pack.id);
    setMessage(null);
    const { error } = await supabase
      .from('contact_credit_packs')
      .update({
        price_cents: pack.price_cents,
        stripe_price_id: pack.stripe_price_id || null,
        is_active: pack.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pack.id);
    setSavingId(null);
    setMessage(
      error
        ? { type: 'error', text: `Failed to save ${pack.name}: ${error.message}` }
        : { type: 'success', text: `${pack.name} saved.` }
    );
  };

  const updatePlan = (id: string, patch: Partial<PlanRow>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const updatePack = (id: string, patch: Partial<CreditPackRow>) => {
    setPacks((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const saveSponsorshipPlan = async (plan: SponsorshipPlanRow) => {
    setSavingId(plan.id);
    setMessage(null);
    const { error } = await supabase
      .from('sponsorship_plans')
      .update({
        price_cents: plan.price_cents,
        duration_days: plan.duration_days,
        stripe_price_id: plan.stripe_price_id || null,
        is_active: plan.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', plan.id);
    setSavingId(null);
    setMessage(
      error
        ? { type: 'error', text: `Failed to save ${plan.name}: ${error.message}` }
        : { type: 'success', text: `${plan.name} saved.` }
    );
  };

  const saveJobAddon = async (addon: JobAddonRow) => {
    setSavingId(addon.id);
    setMessage(null);
    const { error } = await supabase
      .from('job_addons')
      .update({
        price_cents: addon.price_cents,
        duration_days: addon.duration_days,
        stripe_price_id: addon.stripe_price_id || null,
        is_active: addon.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', addon.id);
    setSavingId(null);
    setMessage(
      error
        ? { type: 'error', text: `Failed to save ${addon.name}: ${error.message}` }
        : { type: 'success', text: `${addon.name} saved.` }
    );
  };

  const updateSponsorshipPlan = (id: string, patch: Partial<SponsorshipPlanRow>) => {
    setSponsorshipPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const updateJobAddon = (id: string, patch: Partial<JobAddonRow>) => {
    setJobAddons((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-1 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary-600" />
          Resume Database plans
        </h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          Prices are in whole dollars. Paste Stripe Price IDs here after creating the matching Products/Prices in the
          Stripe Dashboard.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">$/mo</th>
                <th className="py-2 pr-3">$/yr</th>
                <th className="py-2 pr-3">Credits/mo</th>
                <th className="py-2 pr-3">Stripe price (monthly)</th>
                <th className="py-2 pr-3">Stripe price (annual)</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-gray-100 dark:border-slate-800">
                  <td className="py-2 pr-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {plan.name}
                    <div className="text-[10px] text-gray-400 font-mono">{plan.slug}</div>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      value={dollars(plan.price_monthly)}
                      onChange={(e) => updatePlan(plan.id, { price_monthly: Math.round(Number(e.target.value) * 100) })}
                      className="w-20 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      value={dollars(plan.price_yearly)}
                      onChange={(e) => updatePlan(plan.id, { price_yearly: Math.round(Number(e.target.value) * 100) })}
                      className="w-20 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      value={plan.monthly_unlock_credits}
                      onChange={(e) => updatePlan(plan.id, { monthly_unlock_credits: Number(e.target.value) })}
                      className="w-20 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      placeholder="price_..."
                      value={plan.stripe_price_id_monthly || ''}
                      onChange={(e) => updatePlan(plan.id, { stripe_price_id_monthly: e.target.value })}
                      className="w-36 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded font-mono text-xs"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      placeholder="price_..."
                      value={plan.stripe_price_id_annual || ''}
                      onChange={(e) => updatePlan(plan.id, { stripe_price_id_annual: e.target.value })}
                      className="w-36 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded font-mono text-xs"
                    />
                  </td>
                  <td className="py-2 pr-3 text-center">
                    <input
                      type="checkbox"
                      checked={plan.is_active}
                      onChange={(e) => updatePlan(plan.id, { is_active: e.target.checked })}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => savePlan(plan)}
                      disabled={savingId === plan.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 disabled:opacity-60"
                    >
                      {savingId === plan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-1">Contact credit packs</h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">One-time "buy more contacts" add-ons.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                <th className="py-2 pr-3">Pack</th>
                <th className="py-2 pr-3">Price ($)</th>
                <th className="py-2 pr-3">Stripe price</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {packs.map((pack) => (
                <tr key={pack.id} className="border-b border-gray-100 dark:border-slate-800">
                  <td className="py-2 pr-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {pack.name}
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      value={dollars(pack.price_cents)}
                      onChange={(e) => updatePack(pack.id, { price_cents: Math.round(Number(e.target.value) * 100) })}
                      className="w-20 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      placeholder="price_..."
                      value={pack.stripe_price_id || ''}
                      onChange={(e) => updatePack(pack.id, { stripe_price_id: e.target.value })}
                      className="w-36 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded font-mono text-xs"
                    />
                  </td>
                  <td className="py-2 pr-3 text-center">
                    <input
                      type="checkbox"
                      checked={pack.is_active}
                      onChange={(e) => updatePack(pack.id, { is_active: e.target.checked })}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => savePack(pack)}
                      disabled={savingId === pack.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 disabled:opacity-60"
                    >
                      {savingId === pack.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-1">Job sponsorship tiers</h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          One-time "Promote this job" purchases (PROMOTE). Tier number drives ranking in jobScoring.ts — don't edit it here.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                <th className="py-2 pr-3">Tier</th>
                <th className="py-2 pr-3">Price ($)</th>
                <th className="py-2 pr-3">Duration (days)</th>
                <th className="py-2 pr-3">Stripe price</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {sponsorshipPlans.map((plan) => (
                <tr key={plan.id} className="border-b border-gray-100 dark:border-slate-800">
                  <td className="py-2 pr-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {plan.name}
                    <div className="text-[10px] text-gray-400">tier {plan.tier}</div>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      value={dollars(plan.price_cents)}
                      onChange={(e) =>
                        updateSponsorshipPlan(plan.id, { price_cents: Math.round(Number(e.target.value) * 100) })
                      }
                      className="w-20 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      value={plan.duration_days}
                      onChange={(e) => updateSponsorshipPlan(plan.id, { duration_days: Number(e.target.value) })}
                      className="w-20 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      placeholder="price_..."
                      value={plan.stripe_price_id || ''}
                      onChange={(e) => updateSponsorshipPlan(plan.id, { stripe_price_id: e.target.value })}
                      className="w-36 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded font-mono text-xs"
                    />
                  </td>
                  <td className="py-2 pr-3 text-center">
                    <input
                      type="checkbox"
                      checked={plan.is_active}
                      onChange={(e) => updateSponsorshipPlan(plan.id, { is_active: e.target.checked })}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => saveSponsorshipPlan(plan)}
                      disabled={savingId === plan.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 disabled:opacity-60"
                    >
                      {savingId === plan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-1">Job add-ons</h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          Optional bundled add-ons on top of a sponsorship tier (e.g. Urgent Hiring).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                <th className="py-2 pr-3">Add-on</th>
                <th className="py-2 pr-3">Price ($)</th>
                <th className="py-2 pr-3">Duration (days)</th>
                <th className="py-2 pr-3">Stripe price</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {jobAddons.map((addon) => (
                <tr key={addon.id} className="border-b border-gray-100 dark:border-slate-800">
                  <td className="py-2 pr-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {addon.name}
                    <div className="text-[10px] text-gray-400 font-mono">{addon.key}</div>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      value={dollars(addon.price_cents)}
                      onChange={(e) => updateJobAddon(addon.id, { price_cents: Math.round(Number(e.target.value) * 100) })}
                      className="w-20 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      value={addon.duration_days}
                      onChange={(e) => updateJobAddon(addon.id, { duration_days: Number(e.target.value) })}
                      className="w-20 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      placeholder="price_..."
                      value={addon.stripe_price_id || ''}
                      onChange={(e) => updateJobAddon(addon.id, { stripe_price_id: e.target.value })}
                      className="w-36 px-2 py-1 border border-gray-200 dark:border-slate-700 rounded font-mono text-xs"
                    />
                  </td>
                  <td className="py-2 pr-3 text-center">
                    <input
                      type="checkbox"
                      checked={addon.is_active}
                      onChange={(e) => updateJobAddon(addon.id, { is_active: e.target.checked })}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => saveJobAddon(addon)}
                      disabled={savingId === addon.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 disabled:opacity-60"
                    >
                      {savingId === addon.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminResumePlans;
