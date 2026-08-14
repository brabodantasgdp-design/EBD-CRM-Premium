import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../lib/supabase/auth";
import { createSupabaseServiceRoleClient } from "../../../../lib/supabase/service";
import { encryptAICredential } from "../../../../lib/ai/encryption";
import { AIProviderRequestError, getAIProvider, type AIProviderConfig } from "../../../../lib/ai/provider";
import { getSafeAISetting, isSupportedAIProvider } from "../../../../lib/ai/byok";

type Body = { action?: "test" | "save" | "disable"; provider?: unknown; model?: unknown; apiKey?: unknown };
type FailureCode = "INVALID_INPUT" | "PROVIDER_CONNECTION_FAILED" | "ENCRYPTION_FAILED" | "PERSISTENCE_FAILED" | "AI_CONFIGURATION_ERROR";
type SafePostgrestError = { code?: unknown; constraint?: unknown };

async function authorized() {
  const { supabase, user } = await requireUser();
  const organization = await getCurrentOrganization();
  if (!supabase || !user || !organization) return null;
  const { data: member } = await supabase.from("organization_members").select("role, status").eq("organization_id", organization.id).eq("user_id", user.id).maybeSingle();
  if (!member || member.status !== "active" || !["owner", "admin"].includes(member.role)) return null;
  return { supabase, user, organization };
}

export async function GET() {
  const auth = await authorized();
  if (!auth) return NextResponse.json({ configured: false, error: "Acesso negado" }, { status: 403 });
  try {
    const setting = await getSafeAISetting(auth.supabase, auth.organization.id);
    if (!setting) return NextResponse.json({ configured: false, error: "Configuração de servidor indisponível" }, { status: 503 });
    return NextResponse.json(setting);
  } catch { return NextResponse.json({ configured: false, error: "Não foi possível carregar a configuração de IA" }, { status: 503 }); }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const auth = await authorized();
  if (!auth) return NextResponse.json({ code: "AI_CONFIGURATION_ERROR", error: "Acesso negado", requestId }, { status: 403 });
  const body = await request.json().catch(() => null) as Body | null;
  const apiKeyPresent = typeof body?.apiKey === "string" && body.apiKey.length > 0;
  const logFailure = (failureStage: string, errorClass: string, providerStatusCode?: number | null, supabaseErrorCode?: string | null, constraint?: string | null) => console.warn("[ai-settings]", JSON.stringify({ requestId, organizationId: auth.organization.id, userId: auth.user.id, provider: isSupportedAIProvider(body?.provider) ? body.provider : "unknown", model: typeof body?.model === "string" ? body.model.trim() : "unknown", apiKeyPresent, apiKeyLength: typeof body?.apiKey === "string" ? body.apiKey.length : 0, failureStage, providerStatusCode: providerStatusCode ?? undefined, supabaseErrorCode: supabaseErrorCode && /^[A-Za-z0-9_.-]+$/.test(supabaseErrorCode) ? supabaseErrorCode : undefined, constraint: constraint && /^[A-Za-z0-9_.-]+$/.test(constraint) ? constraint : undefined, errorClass }));
  const failure = (code: FailureCode, message: string, status: number, failureStage: string, errorClass: string, providerStatusCode?: number | null, supabaseErrorCode?: string | null, constraint?: string | null) => { logFailure(failureStage, errorClass, providerStatusCode, supabaseErrorCode, constraint); return NextResponse.json({ code, message, requestId, ...(providerStatusCode ? { providerStatusCode } : {}) }, { status }); };
  if (body?.action === "disable") {
    const { error } = await auth.supabase.from("organization_ai_settings").update({ enabled: false, updated_by: auth.user.id }).eq("organization_id", auth.organization.id);
    return error ? failure("PERSISTENCE_FAILED", "Não foi possível desativar o provider.", 400, "disable", "supabase_update_failed") : NextResponse.json({ success: true, enabled: false, requestId });
  }
  if (!isSupportedAIProvider(body?.provider) || typeof body?.model !== "string" || body.model.trim().length === 0 || body.model.trim().length > 160 || typeof body.apiKey !== "string" || body.apiKey.length < 8) return failure("INVALID_INPUT", "Provider, modelo ou chave inválidos.", 400, "validation", "invalid_input");
  const config: AIProviderConfig = { provider: body.provider, model: body.model.trim(), apiKey: body.apiKey };
  let provider;
  try {
    provider = await getAIProvider(config);
    await provider.generateText({ system: "Return a short connection confirmation.", user: "Reply with OK.", timeoutMs: 10000, responseFormat: "text" });
  } catch (error) {
    const providerError = error instanceof AIProviderRequestError ? error : null;
    const providerStatusCode = providerError?.statusCode ?? null;
    const message = providerStatusCode === 401 || providerStatusCode === 403 ? "A credencial do provider foi rejeitada." : providerStatusCode === 400 ? "O provider rejeitou o modelo ou payload." : providerStatusCode === 404 ? "O modelo ou endpoint do provider não foi encontrado." : providerStatusCode === 429 ? "O provider informou limite de uso ou quota." : providerStatusCode && providerStatusCode >= 500 ? "O provider está indisponível no momento." : "Não foi possível conectar ao provider.";
    return failure("PROVIDER_CONNECTION_FAILED", message, providerStatusCode === 429 ? 429 : 400, "provider_connection", providerError?.errorClass ?? "ai_configuration_error", providerStatusCode);
  }
  if (body.action === "test") return NextResponse.json({ success: true, provider: provider.name, model: provider.model, message: "Conexão testada com sucesso.", requestId });
  let encryptedApiKey: string;
  try { encryptedApiKey = encryptAICredential(config.apiKey); } catch (error) { return failure("ENCRYPTION_FAILED", "Não foi possível proteger a credencial no servidor.", 500, "encryption", error instanceof Error ? error.name : "encryption_error"); }
  const { error } = await auth.supabase.from("organization_ai_settings").upsert({ organization_id: auth.organization.id, provider: config.provider, model: config.model, encrypted_api_key: encryptedApiKey, key_last_four: config.apiKey.slice(-4), enabled: true, created_by: auth.user.id, updated_by: auth.user.id }, { onConflict: "organization_id" });
  if (error) {
    const safeError = error as unknown as SafePostgrestError;
    return failure("PERSISTENCE_FAILED", "Não foi possível salvar a configuração.", 400, "upsert", "supabase_upsert_failed", null, typeof safeError.code === "string" ? safeError.code : null, typeof safeError.constraint === "string" ? safeError.constraint : null);
  }
  return NextResponse.json({ success: true, provider: provider.name, model: provider.model, configured: true, keyLastFour: config.apiKey.slice(-4), requestId });
}

export async function DELETE() {
  const auth = await authorized();
  if (!auth) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const service = createSupabaseServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Configuração de servidor indisponível" }, { status: 503 });
  const { error } = await service.from("organization_ai_settings").delete().eq("organization_id", auth.organization.id);
  return error ? NextResponse.json({ error: "Não foi possível remover a configuração" }, { status: 400 }) : NextResponse.json({ success: true, configured: false });
}
