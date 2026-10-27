if (typeof window !== 'undefined') {
  throw new Error('This module can only be imported on the server.');
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

let cachedClient: SupabaseClient<Database> | null = null;

/**
 * Returns a server-only Supabase client.
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) from environment variables.
 * Never exposes credentials to client bundles or browser logs.
 */
export function getSupabaseServerClient(): SupabaseClient<Database> {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are set in environment variables.'
    );
  }

  cachedClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
