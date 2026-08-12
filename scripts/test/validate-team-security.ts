import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const required = ["E2E_OWNER_A_EMAIL", "E2E_OWNER_A_PASSWORD", "E2E_OWNER_B_EMAIL", "E2E_OWNER_B_PASSWORD", "E2E_SALES_A_EMAIL"];
if (!url || !key || required.some((name) => !process.env[name])) throw new Error("E2E environment is incomplete");

function client() { return createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } }); }
async function login(email: string, password: string) {
  const account = client();
  const result = await account.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return account;
}
const owner = await login(process.env.E2E_OWNER_A_EMAIL!, process.env.E2E_OWNER_A_PASSWORD!);
const ownerB = await login(process.env.E2E_OWNER_B_EMAIL!, process.env.E2E_OWNER_B_PASSWORD!);
const sales = await login(process.env.E2E_SALES_A_EMAIL!, process.env.E2E_SALES_A_PASSWORD!);
const ownerUser = (await owner.auth.getUser()).data.user!;
const salesUser = (await sales.auth.getUser()).data.user!;
const orgA = (await owner.from("organizations").select("id").eq("created_by", ownerUser.id).limit(1).single()).data!;
const orgB = (await ownerB.from("organizations").select("id").limit(1).single()).data!;
const salesMember = (await owner.from("organization_members").select("id, role, status").eq("organization_id", orgA.id).eq("user_id", salesUser.id).single()).data!;
const report: Record<string, unknown> = {};

const inviteEmail = `phase06-${Date.now()}@example.test`;
const inviteId = await owner.rpc("create_organization_invite", { target_org: orgA.id, target_email: inviteEmail, target_role: "sales", target_token_hash: `phase06-${Date.now()}`, target_expires_at: new Date(Date.now() + 3600000).toISOString() });
const invite = inviteId.data ? await owner.from("organization_invites").select("id, status").eq("id", inviteId.data).single() : { data: null, error: inviteId.error };
report.ownerInvite = { created: !!invite.data && !invite.error, error: invite.error?.message ?? null };
if (invite.data) {
  const revoked = await owner.rpc("revoke_organization_invite", { target_invite: invite.data.id });
  report.revoke = { passed: !revoked.error };
  const revokedRead = await owner.from("organization_invites").select("status").eq("id", invite.data.id).single();
  report.revokedStatus = revokedRead.data?.status;
}

const change = await owner.rpc("change_member_role", { target_member: salesMember.id, target_role: "manager" });
const restoreRole = await owner.rpc("change_member_role", { target_member: salesMember.id, target_role: "sales" });
report.ownerRoleChange = { changed: !change.error, restored: !restoreRole.error };
const suspend = await owner.rpc("set_member_status", { target_member: salesMember.id, target_status: "suspended" });
const reactivate = await owner.rpc("set_member_status", { target_member: salesMember.id, target_status: "active" });
report.ownerStatusChange = { suspended: !suspend.error, reactivated: !reactivate.error };

const ownerPromotion = await sales.rpc("change_member_role", { target_member: salesMember.id, target_role: "manager" });
const salesStatus = await sales.rpc("set_member_status", { target_member: salesMember.id, target_status: "suspended" });
report.salesBlocked = { role: !!ownerPromotion.error, status: !!salesStatus.error };
const salesCrossTenant = await sales.from("organization_members").select("id").eq("organization_id", orgB.id);
const ownerCrossTenantInvites = await owner.from("organization_invites").select("id").eq("organization_id", orgB.id);
const ownerAudit = await owner.from("audit_logs").select("action").eq("organization_id", orgA.id).limit(20);
report.crossTenant = { salesMembersB: (salesCrossTenant.data?.length ?? 0) === 0, ownerInvitesB: (ownerCrossTenantInvites.data?.length ?? 0) === 0 };
report.audit = { readable: !ownerAudit.error, actions: ownerAudit.data?.map((row) => row.action) ?? [] };

const invalidInvite = await owner.rpc("accept_organization_invite", { target_hash: "invalid-phase06-token-hash" });
report.invalidTokenBlocked = !!invalidInvite.error;
const selfRole = await owner.rpc("change_member_role", { target_member: (await owner.from("organization_members").select("id").eq("organization_id", orgA.id).eq("user_id", ownerUser.id).single()).data!.id, target_role: "admin" });
report.ownerProtection = !!selfRole.error;
console.log(JSON.stringify(report, null, 2));
