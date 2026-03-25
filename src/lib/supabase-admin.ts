import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return cachedClient;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseAdminClient() !== null;
}

export function setSupabaseAdminClientForTests(client: SupabaseClient | null): void {
  cachedClient = client;
}

export function resetSupabaseAdminClientForTests(): void {
  cachedClient = null;
}
