import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { getCurrentOrganization } from "../../../../lib/supabase/auth";

export async function GET() {
  const organization = await getCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  if (!organization || !supabase) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
  const { data: currentUser } = await supabase.auth.getUser();
  const [{ data: members, error: memberError }, { data: invites, error: inviteError }] = await Promise.all([
    supabase.from("organization_members").select("id, organization_id, user_id, role, status, created_at").eq("organization_id", organization.id).order("created_at", { ascending: true }),
    supabase.from("organization_invites").select("id, email, role, status, expires_at, created_at").eq("organization_id", organization.id).eq("status", "pending").order("created_at", { ascending: false }),
  ]);
  if (memberError || inviteError) return NextResponse.json({ error: "Não foi possível carregar a equipe" }, { status: 500 });
  const userIds = (members ?? []).map((member) => member.user_id);
  const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id, full_name").in("id", userIds) : { data: [] };
  const currentRole = members?.find((member) => member.user_id === currentUser.user?.id)?.role ?? null;
  return NextResponse.json({ organization, currentRole, members: (members ?? []).map((member) => ({ ...member, profiles: profiles?.find((profile) => profile.id === member.user_id) ?? null })), invites: invites ?? [] });
}
