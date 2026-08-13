import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../lib/supabase/auth";
import { createDeal, listDeals } from "../../../../lib/crm/deals";

export async function GET() {
  const { supabase } = await requireUser(); const organization = await getCurrentOrganization();
  if (!supabase || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  try { return NextResponse.json({ deals: await listDeals(supabase, organization.id) }); }
  catch { return NextResponse.json({ error: "Não foi possível carregar os negócios" }, { status: 500 }); }
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser(); const organization = await getCurrentOrganization();
  if (!supabase || !user || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  try { return NextResponse.json({ deal: await createDeal(supabase, organization.id, user.id, body) }, { status: 201 }); }
  catch { return NextResponse.json({ error: "Não foi possível criar o negócio" }, { status: 400 }); }
}
