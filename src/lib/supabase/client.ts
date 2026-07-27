import { createBrowserClient } from "@supabase/ssr";
import { isEnvConfigured } from "@/lib/utils";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = isEnvConfigured(url, anonKey);

/**
 * Browser-side Supabase client. Only call this after checking
 * `isSupabaseConfigured` — the service layer handles that for you.
 */
export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return createBrowserClient(url as string, anonKey as string);
}
