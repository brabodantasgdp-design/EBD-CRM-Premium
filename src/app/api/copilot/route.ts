import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../lib/supabase/auth";
import { runCopilot } from "../../../lib/ai/copilot";

const safeFeatures = new Set(["chat", "summary", "next_steps", "closing_strategy", "risk_analysis", "lead_score", "draft"]);
export async function POST(request: Request) {
  const { supabase, user } = await requireUser(); const organization = await getCurrentOrganization();
  if (!supabase || !user || !organization) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const body = await request.json().catch(() => null) as { feature?: string; question?: string; entityType?: "lead" | "contact" | "company" | "deal"; entityId?: string; conversationId?: string } | null;
  if (!body?.feature || !safeFeatures.has(body.feature)) return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  try { return NextResponse.json(await runCopilot(supabase, user.id, organization.id, { ...body, feature: body.feature as Parameters<typeof runCopilot>[3]["feature"] })); }
  catch (error) { const message = error instanceof Error ? error.message : "ai_failed"; const status = message === "ai_rate_limited" ? 429 : message === "ai_provider_not_configured" ? 503 : message === "entity_not_found" ? 404 : 502; return NextResponse.json({ error: message === "ai_rate_limited" ? "Limite temporário atingido. Tente novamente em instantes." : message === "ai_provider_not_configured" ? "Copilot indisponível: provider de IA não configurado." : "Não foi possível gerar a análise agora." }, { status }); }
}
