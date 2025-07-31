// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Remove the global supabaseInstance and direct process.env access here
// let supabaseInstance: ReturnType<typeof createClient> | null = null; // Remove this line

/**
 * Get or create the Supabase client instance
 * This function ensures the client is only created when environment variables are available
 * @param supabaseUrl The Supabase project URL
 * @param supabaseKey The Supabase project key (anon or service_role)
 */
export function getSupabaseClient(supabaseUrl: string, supabaseKey: string) {
  // We'll manage the instance in migrateJobs.ts or a higher level
  // This function now just creates a new client based on provided parameters

  // Debug logging for supabaseUrl
  console.log('DEBUG (getSupabaseClient) - supabaseUrl type:', typeof supabaseUrl);
  console.log('DEBUG (getSupabaseClient) - supabaseUrl value:', supabaseUrl);

  // Debug logging for supabaseKey
  console.log('DEBUG (getSupabaseClient) - supabaseKey type:', typeof supabaseKey);
  console.log('DEBUG (getSupabaseClient) - supabaseKey value (first 20 chars):', supabaseKey.substring(0, 20) + '...');
  console.log('DEBUG (getSupabaseClient) - supabaseKey length:', supabaseKey.length);

  if (supabaseUrl && supabaseUrl !== '' && supabaseKey && supabaseKey !== '') {
    const supabaseInstance = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully within getSupabaseClient.');
    return supabaseInstance;
  } else {
    console.warn('Supabase URL or Key not provided to getSupabaseClient. Supabase client will not be functional.');
    console.log('VITE_SUPABASE_URL (passed):', supabaseUrl ? 'Set' : 'Not Set');
    console.log('Supabase Key (passed):', supabaseKey ? 'Set' : 'Not Set');
    return null;
  }
}