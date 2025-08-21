// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Get environment variables for the frontend
// VITE_ prefix is crucial for Vite to expose these to the client-side code
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validate that the environment variables are set
if (!supabaseUrl) {
    throw new Error('Missing VITE_SUPABASE_URL. Please set it in your .env file in the project root.');
}
if (!supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY. Please set it in your .env file in the project root.');
}

// Create and export the Supabase client instance with real-time functionality disabled
// Disabling real-time can prevent "pending" WebSocket issues that may cause loading delays.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
        enabled: false,
    },
});

console.log('Frontend Supabase client initialized and exported.'); // Optional: You can keep this one log for confirmation
