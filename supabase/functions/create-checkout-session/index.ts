// Supabase Edge Function: create-checkout-session
//
// Creates a Stripe Checkout Session for either:
//  - mode: 'subscription' — a Resume Database plan (priceId = subscription_plans.stripe_price_id_monthly/annual)
//  - mode: 'payment'      — a one-time "buy more contacts" credit pack
//
// The caller's company is resolved server-side from their auth token via
// company_members (owner/admin only), never trusted from the request body —
// otherwise a signed-in user could pass an arbitrary companyId and have a
// purchase they're paying for land on a company they don't belong to.
//
// companyId + planId/creditPackId are stashed in session.metadata so the
// stripe-webhook function can apply the purchase without an email lookup.
// Generalized enough that Phase 2 (job sponsorship, one-time purchases)
// can reuse this same function.

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

interface CheckoutRequest {
  mode: 'subscription' | 'payment';
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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

    const body: CheckoutRequest = await req.json();
    const { mode, priceId, successUrl, cancelUrl, metadata } = body;

    if (!mode || !priceId || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: 'mode, priceId, successUrl, and cancelUrl are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams();
    params.set('mode', mode);
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', successUrl);
    params.set('cancel_url', cancelUrl);
    params.set('client_reference_id', member.company_id);
    params.set('metadata[companyId]', member.company_id);
    for (const [key, value] of Object.entries(metadata || {})) {
      params.set(`metadata[${key}]`, value);
    }
    if (mode === 'subscription') {
      params.set('subscription_data[metadata][companyId]', member.company_id);
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const errText = await stripeRes.text();
      console.error('Stripe checkout session creation failed:', errText);
      return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = await stripeRes.json();

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('create-checkout-session error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Checkout session creation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
