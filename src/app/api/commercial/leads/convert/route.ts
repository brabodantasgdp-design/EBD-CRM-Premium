import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../../lib/supabase/auth";
import { convertLead } from "../../../../../lib/crm/leads";
export async function POST(request: Request) {
  const { supabase } = await requireUser(); const organization = await getCurrentOrganization();
  if (!supabase || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body?.leadId || !body?.pipelineId || !body?.stageId) return NextResponse.json({ error: "Lead, pipeline e etapa são obrigatórios" }, { status: 400 });
  try { return NextResponse.json({ conversion: await convertLead(supabase, body) }, { status: 201 }); }
  catch (error) { const message = error instanceof Error ? error.message : "Falha na conversão"; return NextResponse.json({ error: message.includes("already converted") ? "Lead já convertido" : "Não foi possível converter o lead" }, { status: 400 }); }
}
