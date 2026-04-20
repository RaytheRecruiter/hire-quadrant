import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import * as base32 from 'https://esm.sh/base32@0.1.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Generate random secret for TOTP
function generateSecret(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}

// Generate QR code URL (using qrserver.com for simplicity)
function generateQRCodeUrl(secret: string, email: string): string {
  const otpauthUrl = `otpauth://totp/HireQuadrant:${email}?secret=${secret}&issuer=HireQuadrant`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
}

serve(async (req) => {
  try {
    // CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabase.auth.getUser(token);

    if (!data.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = data.user.id;
    const email = data.user.email || '';

    // Generate secret
    const secret = generateSecret();
    const qrCodeUrl = generateQRCodeUrl(secret, email);

    // Store temporary secret in DB (not yet verified)
    await supabase
      .from('user_2fa')
      .upsert(
        {
          user_id: userId,
          secret,
          verified: false,
          backup_codes: null,
          updated_at: new Date(),
        },
        { onConflict: 'user_id' }
      );

    return new Response(
      JSON.stringify({
        secret,
        qr_code_url: qrCodeUrl,
        manual_entry_key: secret,
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Enable 2FA error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to enable 2FA' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
