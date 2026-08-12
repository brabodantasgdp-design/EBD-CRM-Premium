import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { getCurrentOrganization } from "../../../../lib/supabase/auth";

export async function POST(request: Request) {
  const organization = await getCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  if (!organization || !supabase) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
  const { data: user } = await supabase.auth.getUser();
  const body = await request.json().catch(() => null) as { email?: string; role?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const role = body?.role;
  if (!user.user || !email || !role || !["admin", "manager", "sales", "viewer"].includes(role)) return NextResponse.json({ error: "Convite inválido" }, { status: 400 });
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const { data: inviteId, error } = await supabase.rpc("create_organization_invite", { target_org: organization.id, target_email: email, target_role: role, target_token_hash: tokenHash, target_expires_at: expiresAt });
  if (error || !inviteId) return NextResponse.json({ error: error?.code === "23505" ? "Já existe um convite pendente para este e-mail" : "Não foi possível criar o convite" }, { status: 400 });
  const { data, error: readError } = await supabase.from("organization_invites").select("id, email, role, status, expires_at, created_at").eq("id", inviteId).single();
  if (readError || !data) return NextResponse.json({ error: "Convite criado, mas não foi possível carregá-lo" }, { status: 500 });
  const url = `${new URL(request.url).origin}/convite?token=${encodeURIComponent(token)}`;
  return NextResponse.json({ invite: data, inviteUrl: url, developmentOnly: true });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null) as { id?: string } | null;
  const supabase = await createSupabaseServerClient();
  if (!supabase || !body?.id) return NextResponse.json({ error: "Convite inválido" }, { status: 400 });
  const { error } = await supabase.rpc("revoke_organization_invite", { target_invite: body.id });
  if (error) return NextResponse.json({ error: "Não foi possível revogar o convite" }, { status: 403 });
  return NextResponse.json({ ok: true });
}
