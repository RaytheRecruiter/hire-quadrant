// Supabase Edge Function: manage-subscription
//
// Self-serve plan change (in-place upgrade/downgrade, prorated) and
// cancel-at-period-end for an EXISTING Stripe subscription. Distinct from
// create-checkout-session, which only ever starts a brand new Checkout
// Session — using it for an existing subscriber would create a second,
// duplicate Stripe subscription instead of modifying the one they have.
//
// Per Ray (2026-08-18): self-serve for all Resume Database tiers except
// the highest ("Business") — that one stays manual/mailto. Enforced here
// server-side via subscription_plans.requires_manual_upgrade, not just in
// the UI.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

interface ManageRequest {
  action: 'change_plan' | 'cancel' | 'resume';
  planId?: string;
  billingFrequency?: 'monthly' | 'annual';
}

async function stripeRequest(path: string, method: string, params?: URLSearchParams) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params?.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Stripe ${path} failed`);
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Billing is not configured yet' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: member } = await supabase
      .from('company_members')
      .select('company_id, role')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])
      .limit(1)
      .maybeSingle();

    if (!member) {
      return new Response(JSON.stringify({ error: 'You are not authorized to manage billing for a company' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', member.company_id)
      .maybeSingle();

    if (!subscription?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: 'No active Stripe subscription found for this company' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ManageRequest = await req.json();

    if (body.action === 'change_plan') {
      if (!body.planId) {
        return new Response(JSON.stringify({ error: 'planId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', body.planId)
        .maybeSingle();

      if (!plan) {
        return new Response(JSON.stringify({ error: 'Plan not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (plan.requires_manual_upgrade) {
        return new Response(
          JSON.stringify({ error: 'This plan requires contacting billing to switch to it' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const frequency = body.billingFrequency === 'annual' ? 'annual' : 'monthly';
      const priceId = frequency === 'annual' ? plan.stripe_price_id_annual : plan.stripe_price_id_monthly;
      if (!priceId) {
        return new Response(JSON.stringify({ error: 'This plan is not yet available for checkout' }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const currentSub = await stripeRequest(`subscriptions/${subscription.stripe_subscription_id}`, 'GET');
      const itemId = currentSub.items?.data?.[0]?.id;
      if (!itemId) throw new Error('Could not resolve current subscription item');

      const params = new URLSearchParams();
      params.set('items[0][id]', itemId);
      params.set('items[0][price]', priceId);
      params.set('proration_behavior', 'create_prorations');
      params.set('metadata[companyId]', member.company_id);
      params.set('metadata[planId]', plan.id);

      const updated = await stripeRequest(`subscriptions/${subscription.stripe_subscription_id}`, 'POST', params);

      await supabase
        .from('subscriptions')
        .update({
          plan_id: plan.id,
          billing_frequency: frequency,
          status: updated.status,
          current_period_start: new Date(updated.current_period_start * 1000),
          current_period_end: new Date(updated.current_period_end * 1000),
          cancel_at_period_end: false,
          updated_at: new Date(),
        })
        .eq('company_id', member.company_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'cancel') {
      const params = new URLSearchParams();
      params.set('cancel_at_period_end', 'true');
      await stripeRequest(`subscriptions/${subscription.stripe_subscription_id}`, 'POST', params);

      await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: true, updated_at: new Date() })
        .eq('company_id', member.company_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'resume') {
      const params = new URLSearchParams();
      params.set('cancel_at_period_end', 'false');
      await stripeRequest(`subscriptions/${subscription.stripe_subscription_id}`, 'POST', params);

      await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: false, updated_at: new Date() })
        .eq('company_id', member.company_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('manage-subscription error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to manage subscription' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
