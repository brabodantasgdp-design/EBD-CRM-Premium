import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./env";

let browserClient: SupabaseClient | undefined;

export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const config = getSupabasePublicEnv();
  if (!config) return null;

  browserClient = createBrowserClient(config.url, config.key);
  return browserClient;
}
