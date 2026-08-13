import { NextResponse } from "next/server";
import { updateCompany } from "../../../../../lib/crm/commercial";
import { getCurrentOrganization, requireUser } from "../../../../../lib/supabase/auth";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { supabase, user } = await requireUser();
  const organization = await getCurrentOrganization();
  if (!supabase || !user || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const { id } = await context.params;
  try {
    const company = await updateCompany(supabase, organization.id, id, body);
    return NextResponse.json({ company });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar a empresa" }, { status: 400 });
  }
}
