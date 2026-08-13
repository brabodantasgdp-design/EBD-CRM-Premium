import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../../lib/supabase/auth";
import { archiveLead, getLead, updateLead } from "../../../../../lib/crm/leads";

type Params = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Params) {
  const { supabase } = await requireUser(); const organization = await getCurrentOrganization(); const { id } = await params;
  if (!supabase || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  try { const lead = await getLead(supabase, organization.id, id); return lead ? NextResponse.json({ lead }) : NextResponse.json({ error: "Lead não encontrado" }, { status: 404 }); }
  catch { return NextResponse.json({ error: "Não foi possível carregar o lead" }, { status: 500 }); }
}
export async function PATCH(request: Request, { params }: Params) {
  const { supabase } = await requireUser(); const organization = await getCurrentOrganization(); const { id } = await params;
  if (!supabase || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  const body = await request.json().catch(() => null);
  try { return NextResponse.json({ lead: await updateLead(supabase, organization.id, id, body || {}) }); }
  catch { return NextResponse.json({ error: "Não foi possível atualizar o lead" }, { status: 400 }); }
}
export async function DELETE(_request: Request, { params }: Params) {
  const { supabase } = await requireUser(); const organization = await getCurrentOrganization(); const { id } = await params;
  if (!supabase || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  try { return NextResponse.json({ lead: await archiveLead(supabase, organization.id, id) }); }
  catch { return NextResponse.json({ error: "Não foi possível arquivar o lead" }, { status: 400 }); }
}
