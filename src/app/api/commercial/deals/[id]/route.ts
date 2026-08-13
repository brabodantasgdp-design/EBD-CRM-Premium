import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../../lib/supabase/auth";
import { getDeal, listDealHistory, updateDeal } from "../../../../../lib/crm/deals";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const { supabase } = await requireUser(); const organization = await getCurrentOrganization(); const { id } = await context.params;
  if (!supabase || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  try { return NextResponse.json({ deal: await getDeal(supabase, organization.id, id), history: await listDealHistory(supabase, organization.id, id) }); }
  catch { return NextResponse.json({ error: "Não foi possível carregar o negócio" }, { status: 404 }); }
}

export async function PATCH(request: Request, context: Context) {
  const { supabase } = await requireUser(); const organization = await getCurrentOrganization(); const { id } = await context.params;
  if (!supabase || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  try { return NextResponse.json({ deal: await updateDeal(supabase, organization.id, id, body) }); }
  catch { return NextResponse.json({ error: "Não foi possível atualizar o negócio" }, { status: 400 }); }
}
