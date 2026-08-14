import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../lib/supabase/auth";
import { createSupabaseServiceRoleClient } from "../../../../lib/supabase/service";
import { encryptAICredential } from "../../../../lib/ai/encryption";
import { getAIProvider, type AIProviderConfig } from "../../../../lib/ai/provider";
import { getSafeAISetting, isSupportedAIProvider } from "../../../../lib/ai/byok";

type Body = { action?: "test" | "save" | "disable"; provider?: unknown; model?: unknown; apiKey?: unknown };

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
  }
  catch { return NextResponse.json({ configured: false, error: "Não foi possível carregar a configuração de IA" }, { status: 503 }); }
}

export async function POST(request: Request) {
  const auth = await authorized();
  if (!auth) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const body = await request.json().catch(() => null) as Body | null;
  if (body?.action === "disable") {
    const { error } = await auth.supabase.from("organization_ai_settings").update({ enabled: false, updated_by: auth.user.id }).eq("organization_id", auth.organization.id);
    return error ? NextResponse.json({ error: "Não foi possível desativar o provider" }, { status: 400 }) : NextResponse.json({ success: true, enabled: false });
  }
  if (!isSupportedAIProvider(body?.provider) || typeof body?.model !== "string" || body.model.trim().length > 160 || typeof body.apiKey !== "string" || body.apiKey.length < 8) return NextResponse.json({ error: "Provider, modelo ou chave inválidos" }, { status: 400 });
  const config: AIProviderConfig = { provider: body.provider, model: body.model.trim(), apiKey: body.apiKey };
  try {
    const provider = await getAIProvider(config);
    await provider.generateText({ system: "Return only JSON with success true.", user: "Return a minimal connection test.", timeoutMs: 10000 });
    if (body.action === "test") return NextResponse.json({ success: true, provider: provider.name, model: provider.model, message: "Conexão testada com sucesso." });
    const { error } = await auth.supabase.from("organization_ai_settings").upsert({ organization_id: auth.organization.id, provider: config.provider, model: config.model, encrypted_api_key: encryptAICredential(config.apiKey), key_last_four: config.apiKey.slice(-4), enabled: true, created_by: auth.user.id, updated_by: auth.user.id }, { onConflict: "organization_id" });
    if (error) return NextResponse.json({ error: "Não foi possível salvar a configuração" }, { status: 400 });
    return NextResponse.json({ success: true, provider: provider.name, model: provider.model, configured: true, keyLastFour: config.apiKey.slice(-4) });
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith("ai_encryption_key") ? "A chave mestre de criptografia não está configurada no servidor" : "Não foi possível testar a conexão com o provider";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const auth = await authorized();
  if (!auth) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const service = createSupabaseServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Configuração de servidor indisponível" }, { status: 503 });
  const { error } = await service.from("organization_ai_settings").delete().eq("organization_id", auth.organization.id);
  return error ? NextResponse.json({ error: "Não foi possível remover a configuração" }, { status: 400 }) : NextResponse.json({ success: true, configured: false });
}
