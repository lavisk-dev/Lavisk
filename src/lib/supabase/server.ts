import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isEnvConfigured } from "@/lib/utils";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = isEnvConfigured(url, anonKey);

/**
 * Server-side Supabase client for use inside Route Handlers and
 * Server Components. Returns null when Supabase hasn't been
 * configured yet so callers can fall back to mock data.
 */
export async function createClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(url as string, anonKey as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component render — safe to ignore
          // because middleware refreshes the session instead.
        }
      },
    },
  });
}
