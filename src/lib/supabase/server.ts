import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./env";
import type { Database } from "../../types/database.types";

export async function createSupabaseServerClient(): Promise<SupabaseClient<Database> | null> {
  const config = getSupabasePublicEnv();
  if (!config) return null;

  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components may not be allowed to mutate cookies; proxy handles refresh.
        }
      },
    },
  });
}
