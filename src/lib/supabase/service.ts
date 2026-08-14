import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import { getSupabasePublicEnv } from "./env";

export function createSupabaseServiceRoleClient() {
  const config = getSupabasePublicEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !key) return null;
  return createClient<Database>(config.url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
