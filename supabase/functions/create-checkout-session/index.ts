// Supabase Edge Function: create-checkout-session
//
// Creates a Stripe Checkout Session for:
//  - mode: 'subscription' — a Resume Database plan
//  - mode: 'payment'      — a one-time purchase: "buy more contacts" credit
//                            pack (metadata.purchaseType='contact_credits'),
//                            or job sponsorship + optional Urgent Hiring
//                            add-on (metadata.purchaseType='job_sponsorship',
//                            metadata.jobId set, 1-2 line items)
//
// Authorization is resolved server-side from the caller's auth token —
// never trusted from the request body:
//  - Billing purchases (subscription / contact credits) require the
//    caller be Owner or Admin of a company (mirrors the manage_billing
//    permission gate used client-side).
//  - Job sponsorship purchases require the caller belong to the SAME
//    company that owns the job, with the sponsor_jobs permission —
//    Owner/Admin always have it; Standard users only if explicitly
//    granted (mirrors src/utils/permissions.ts effectivePermissions()).
//
// companyId + purchase-specific metadata are stashed in session.metadata
// so stripe-webhook can apply the purchase without an email lookup.

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
  priceIds: string[];
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

// Mirrors src/utils/permissions.ts effectivePermissions() for the one key
// this function needs server-side. Owner/Admin always have sponsor_jobs;
// Standard users only if explicitly granted.
function hasSponsorJobsPermission(member: { role: string; permissions: Record<string, boolean> | null }): boolean {
  if (member.role === 'owner' || member.role === 'admin') return true;
  return member.permissions?.sponsor_jobs === true;
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

    const body: CheckoutRequest = await req.json();
    const { mode, priceIds, successUrl, cancelUrl, metadata } = body;

    if (!mode || !priceIds?.length || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'mode, priceIds, successUrl, and cancelUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let companyId: string;

    if (metadata?.purchaseType === 'job_sponsorship') {
      const jobId = metadata.jobId;
      if (!jobId) {
        return new Response(JSON.stringify({ error: 'jobId is required for job sponsorship checkout' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: job } = await supabase.from('jobs').select('company_id').eq('id', jobId).maybeSingle();
      if (!job?.company_id) {
        return new Response(JSON.stringify({ error: 'Job not found or not linked to a company' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: member } = await supabase
        .from('company_members')
        .select('company_id, role, permissions')
        .eq('user_id', userData.user.id)
        .eq('company_id', job.company_id)
        .eq('status', 'active')
        .maybeSingle();

      if (!member || !hasSponsorJobsPermission(member)) {
        return new Response(JSON.stringify({ error: 'You are not authorized to sponsor jobs for this company' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      companyId = member.company_id;
    } else {
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

      companyId = member.company_id;
    }

    const params = new URLSearchParams();
    params.set('mode', mode);
    priceIds.forEach((priceId, i) => {
      params.set(`line_items[${i}][price]`, priceId);
      params.set(`line_items[${i}][quantity]`, '1');
    });
    params.set('success_url', successUrl);
    params.set('cancel_url', cancelUrl);
    params.set('client_reference_id', companyId);
    params.set('metadata[companyId]', companyId);
    for (const [key, value] of Object.entries(metadata || {})) {
      params.set(`metadata[${key}]`, value);
    }
    if (mode === 'subscription') {
      params.set('subscription_data[metadata][companyId]', companyId);
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
