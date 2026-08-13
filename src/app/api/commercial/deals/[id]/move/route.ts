import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../../../lib/supabase/auth";
import { dispatchAutomationEvent } from "../../../../../../lib/crm/automations";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  const { supabase, user } = await requireUser(); const organization = await getCurrentOrganization(); const { id } = await context.params;
  if (!supabase || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  const body = await request.json().catch(() => null) as { pipelineId?: string; stageId?: string; note?: string } | null;
  if (!body?.pipelineId || !body.stageId) return NextResponse.json({ error: "Etapa inválida" }, { status: 400 });
  const { data, error } = await supabase.rpc("move_deal_stage", { target_deal: id, target_pipeline: body.pipelineId, target_stage: body.stageId, target_note: body.note ?? null });
  if (error) return NextResponse.json({ error: "Não foi possível mover o negócio" }, { status: 400 });
  try {
    await dispatchAutomationEvent(supabase, user?.id ?? "", {
      organizationId: organization.id,
      eventType: "deal.stage_changed",
      entityType: "deal",
      entityId: id,
      context: { ...(data as Record<string, unknown>), pipeline_id: body.pipelineId, stage_id: body.stageId },
    });
  } catch {
    // A failed automation is recorded independently; the primary deal move remains successful.
  }
  return NextResponse.json({ deal: data });
}
