import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Returns null until the env vars are configured,
 * so the UI keeps running on mock data during frontend development.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
