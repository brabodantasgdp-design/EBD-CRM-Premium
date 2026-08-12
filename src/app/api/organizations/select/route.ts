import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { organizationId?: string } | null;
  if (!body?.organizationId) return NextResponse.json({ error: "organizationId obrigatório" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { data } = await supabase.from("organization_members").select("organization_id").eq("organization_id", body.organizationId).eq("user_id", user.user.id).eq("status", "active").maybeSingle();
  if (!data) return NextResponse.json({ error: "Organização não autorizada" }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("nexus-active-organization", body.organizationId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return response;
}
