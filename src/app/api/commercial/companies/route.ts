import { NextResponse } from "next/server";
import { createCompany, listCompanies } from "../../../../lib/crm/commercial";
import { getCurrentOrganization, requireUser } from "../../../../lib/supabase/auth";

export async function GET() {
  const { supabase, user } = await requireUser();
  const organization = await getCurrentOrganization();
  if (!supabase || !user || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  try {
    return NextResponse.json({ companies: await listCompanies(supabase, organization.id) });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar empresas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  const organization = await getCurrentOrganization();
  if (!supabase || !user || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  try {
    const company = await createCompany(supabase, organization.id, user.id, body);
    return NextResponse.json({ company }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível criar a empresa" }, { status: 400 });
  }
}
