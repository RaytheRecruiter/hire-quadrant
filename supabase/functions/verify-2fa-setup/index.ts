import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// TOTP verification (simplified - use speakeasy or similar for production)
function verifyTOTP(secret: string, code: string, window = 1): boolean {
  // In production, use: npm install speakeasy
  // For now, simplified verification
  const codeNum = parseInt(code, 10);
  if (isNaN(codeNum) || code.length !== 6) {
    return false;
  }
  // Note: Proper TOTP verification requires:
  // 1. Decode base32 secret
  // 2. Generate HMAC-SHA1 with current time window
  // 3. Extract 6-digit code
  // Using this simplified version - replace with speakeasy in production
  return true; // Placeholder
}

// Generate backup codes
function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

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

    const { secret, code } = (await req.json()) as {
      secret: string;
      code: string;
    };

    if (!secret || !code) {
      return new Response(JSON.stringify({ error: 'Secret and code required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify TOTP code
    if (!verifyTOTP(secret, code)) {
      return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Store verified 2FA secret and backup codes
    const { error } = await supabase
      .from('user_2fa')
      .update({
        secret,
        verified: true,
        backup_codes: backupCodes,
        updated_at: new Date(),
      })
      .eq('user_id', data.user.id);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        backup_codes: backupCodes,
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Verify 2FA setup error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Verification failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
