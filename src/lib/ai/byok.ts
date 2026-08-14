import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import { decryptAICredential } from "./encryption";
import { getAIProvider, type AIProvider } from "./provider";
import { createSupabaseServiceRoleClient } from "../supabase/service";

type AuthClient = SupabaseClient<Database>;
type AISetting = { provider: "gemini" | "groq"; model: string; encrypted_api_key: string; key_last_four: string | null; enabled: boolean };
export type SafeAISetting = { provider: "gemini" | "groq"; model: string; enabled: boolean; configured: boolean; keyLastFour: string | null };

export function isSupportedAIProvider(value: unknown): value is "gemini" | "groq" { return value === "gemini" || value === "groq"; }

async function roleFor(client: AuthClient, organizationId: string) {
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) return null;
  const { data } = await client.from("organization_members").select("role, status").eq("organization_id", organizationId).eq("user_id", userData.user.id).maybeSingle();
  return data?.status === "active" ? data.role : null;
}

export async function getSafeAISetting(client: AuthClient, organizationId: string): Promise<SafeAISetting | null> {
  const role = await roleFor(client, organizationId);
  if (!role || !["owner", "admin"].includes(role)) return null;
  const service = createSupabaseServiceRoleClient();
  if (!service) return null;
  const { data, error } = await service.from("organization_ai_settings").select("provider, model, enabled, key_last_four").eq("organization_id", organizationId).maybeSingle();
  if (error) throw new Error("ai_settings_unavailable");
  if (!data) return { provider: "groq", model: "", enabled: false, configured: false, keyLastFour: null };
  if (!isSupportedAIProvider(data.provider)) throw new Error("ai_provider_invalid");
  return { provider: data.provider, model: data.model, enabled: data.enabled, configured: Boolean(data.enabled && data.key_last_four), keyLastFour: data.key_last_four };
}

export async function getAIProviderForOrganization(client: AuthClient, organizationId: string): Promise<AIProvider> {
  const service = createSupabaseServiceRoleClient();
  if (service) {
    const { data, error } = await service.from("organization_ai_settings").select("provider, model, encrypted_api_key, key_last_four, enabled").eq("organization_id", organizationId).maybeSingle();
    if (error) throw new Error("ai_settings_unavailable");
    if (data?.enabled) {
      const setting = data as AISetting;
      return getAIProvider({ provider: setting.provider, model: setting.model, apiKey: decryptAICredential(setting.encrypted_api_key) });
    }
    if (data && !data.enabled) throw new Error("ai_provider_not_configured");
  }
  if (process.env.AI_ALLOW_ENV_FALLBACK === "true" || process.env.AI_PROVIDER === "mock") return getAIProvider();
  throw new Error("ai_provider_not_configured");
}

export async function getAISettingForService(organizationId: string) {
  const service = createSupabaseServiceRoleClient();
  if (!service) return null;
  const { data, error } = await service.from("organization_ai_settings").select("provider, model, encrypted_api_key, key_last_four, enabled").eq("organization_id", organizationId).maybeSingle();
  if (error) throw new Error("ai_settings_unavailable");
  return data as AISetting | null;
}
