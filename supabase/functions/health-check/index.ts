import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
  try {
    const checks: Record<string, boolean> = {
      api: true,
      database: false,
      storage: false,
    };

    const startTime = Date.now();

    // Check database connection
    try {
      const { error } = await supabase.from('jobs').select('id').limit(1);
      checks.database = !error;
    } catch (e) {
      console.error('Database check failed:', e);
      checks.database = false;
    }

    // Check storage
    try {
      const { error } = await supabase.storage.listBuckets();
      checks.storage = !error;
    } catch (e) {
      console.error('Storage check failed:', e);
      checks.storage = false;
    }

    const responseTime = Date.now() - startTime;
    const healthy = Object.values(checks).every((v) => v);

    return new Response(
      JSON.stringify({
        status: healthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        checks,
        version: '1.0.0',
      }),
      {
        status: healthy ? 200 : 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
