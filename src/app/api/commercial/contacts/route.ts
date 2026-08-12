import { NextResponse } from "next/server";
import { createContact, listContacts } from "../../../../lib/crm/commercial";
import { getCurrentOrganization, requireUser } from "../../../../lib/supabase/auth";

export async function GET() {
  const { supabase, user } = await requireUser();
  const organization = await getCurrentOrganization();
  if (!supabase || !user || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  try {
    return NextResponse.json({ contacts: await listContacts(supabase, organization.id) });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar contatos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  const organization = await getCurrentOrganization();
  if (!supabase || !user || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  try {
    const contact = await createContact(supabase, organization.id, user.id, body);
    return NextResponse.json({ contact }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível criar o contato" }, { status: 400 });
  }
}
