import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../../lib/supabase/auth";
import { updatePipeline } from "../../../../../lib/crm/deals";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  const { supabase } = await requireUser(); const organization = await getCurrentOrganization(); const { id } = await context.params;
  if (!supabase || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  try { return NextResponse.json({ pipeline: await updatePipeline(supabase, organization.id, id, body) }); }
  catch { return NextResponse.json({ error: "Não foi possível atualizar o pipeline" }, { status: 400 }); }
}
