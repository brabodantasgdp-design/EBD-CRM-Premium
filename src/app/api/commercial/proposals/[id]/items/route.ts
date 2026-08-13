import { NextResponse } from "next/server";
import { replaceProposalItems } from "../../../../../../lib/crm/proposals";
import { getCurrentOrganization, requireUser } from "../../../../../../lib/supabase/auth";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  const { supabase } = await requireUser(); const organization = await getCurrentOrganization();
  if (!supabase || !organization) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const body = await request.json().catch(() => null) as { items?: unknown } | null;
  if (!body || !Array.isArray(body.items)) return NextResponse.json({ error: "Itens inválidos" }, { status: 400 });
  try { return NextResponse.json({ proposal: await replaceProposalItems(supabase, organization.id, (await context.params).id, body.items as never) }); }
  catch { return NextResponse.json({ error: "Não foi possível atualizar itens" }, { status: 400 }); }
}
