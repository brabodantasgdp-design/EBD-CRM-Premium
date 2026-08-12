import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { getCurrentOrganization } from "../../../../lib/supabase/auth";

export async function GET() {
  const organization = await getCurrentOrganization();
  if (!organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
  return NextResponse.json({ organization });
}

export async function PATCH(request: Request) {
  const organization = await getCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  if (!organization || !supabase) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
  const body = await request.json().catch(() => null) as { name?: string; slug?: string } | null;
  if (!body?.name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  const { data, error } = await supabase.from("organizations").update({ name: body.name.trim(), slug: body.slug?.trim() || null }).eq("id", organization.id).select("*").single();
  if (error) return NextResponse.json({ error: "Não foi possível atualizar a organização" }, { status: 403 });
  return NextResponse.json({ organization: data });
}
