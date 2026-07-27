import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isEnvConfigured } from "@/lib/utils";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseAdminConfigured = isEnvConfigured(url, serviceRoleKey);

/**
 * Privileged Supabase client using the service role key. NEVER import
 * this from client components — it bypasses row-level security and
 * must only be used inside Route Handlers / server-only services.
 */
export function createAdminClient() {
  if (!isSupabaseAdminConfigured) return null;
  return createSupabaseClient(url as string, serviceRoleKey as string, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
