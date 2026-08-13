import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../../lib/supabase/auth";
import { bulkUpdateLeads } from "../../../../../lib/crm/leads";
export async function PATCH(request: Request) {
  const { supabase } = await requireUser(); const organization = await getCurrentOrganization();
  if (!supabase || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.ids)) return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
  try { return NextResponse.json({ leads: await bulkUpdateLeads(supabase, organization.id, body.ids, body.updates || {}) }); }
  catch { return NextResponse.json({ error: "Não foi possível atualizar os leads" }, { status: 400 }); }
}
