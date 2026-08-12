import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ configured: false, organizations: [] });
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ configured: true, organizations: [] }, { status: 401 });
  const { data, error } = await supabase.from("organization_members").select("organization_id, role, status").eq("user_id", user.user.id).eq("status", "active");
  if (error) return NextResponse.json({ error: "Não foi possível carregar organizações." }, { status: 500 });
  const organizationIds = (data ?? []).map((membership) => membership.organization_id);
  const { data: organizations } = organizationIds.length ? await supabase.from("organizations").select("*").in("id", organizationIds) : { data: [] };
  return NextResponse.json({ configured: true, organizations: (data ?? []).map((membership) => ({ ...membership, organizations: organizations?.find((organization) => organization.id === membership.organization_id) ?? null })) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { name?: string } | null;
  if (!body?.name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { data, error } = await supabase.rpc("create_initial_organization", { organization_name: body.name.trim() });
  if (error) return NextResponse.json({ error: "Não foi possível criar a organização." }, { status: 400 });
  const response = NextResponse.json({ id: data });
  response.cookies.set("nexus-active-organization", data, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return response;
}
