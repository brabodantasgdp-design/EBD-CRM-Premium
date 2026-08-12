import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const required = ["E2E_OWNER_A_EMAIL", "E2E_OWNER_A_PASSWORD", "E2E_OWNER_B_EMAIL", "E2E_OWNER_B_PASSWORD", "E2E_SALES_A_EMAIL", "E2E_SALES_A_PASSWORD"];
if (!url || !key || required.some((name) => !process.env[name])) throw new Error("E2E environment is incomplete");

type SessionUser = { id: string; client: SupabaseClient; email: string };
const result: Record<string, unknown> = {};
const short = (value: string) => value.slice(0, 8) + "…";

async function login(email: string, password: string): Promise<SessionUser> {
  const client = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  const response = await client.auth.signInWithPassword({ email, password });
  if (response.error || !response.data.user) throw new Error("E2E login failed");
  return { id: response.data.user.id, client, email };
}

async function ensureOrganization(account: SessionUser, name: string) {
  const existing = await account.client.from("organizations").select("*").limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;
  const created = await account.client.rpc("create_initial_organization", { organization_name: name });
  if (created.error) throw created.error;
  const organization = await account.client.from("organizations").select("*").eq("id", created.data).single();
  if (organization.error) throw organization.error;
  return organization.data;
}

const ownerA = await login(process.env.E2E_OWNER_A_EMAIL!, process.env.E2E_OWNER_A_PASSWORD!);
const ownerB = await login(process.env.E2E_OWNER_B_EMAIL!, process.env.E2E_OWNER_B_PASSWORD!);
const salesA = await login(process.env.E2E_SALES_A_EMAIL!, process.env.E2E_SALES_A_PASSWORD!);
const orgA = await ensureOrganization(ownerA, "Nexus Codex Org A");
const orgB = await ensureOrganization(ownerB, "Nexus Codex Org B");
result.users = { ownerA: short(ownerA.id), ownerB: short(ownerB.id), salesA: short(salesA.id) };
result.organizations = { orgA: short(orgA.id), orgB: short(orgB.id) };

async function tenantRead(account: SessionUser, ownId: string, foreignId: string) {
  const own = await account.client.from("organizations").select("id").eq("id", ownId);
  const foreign = await account.client.from("organizations").select("id").eq("id", foreignId);
  const members = await account.client.from("organization_members").select("organization_id").eq("organization_id", foreignId);
  return { own_visible: own.data?.length === 1, foreign_visible: foreign.data?.length === 1, foreign_members_visible: (members.data?.length ?? 0) > 0, errors: [own.error, foreign.error, members.error].filter(Boolean).length };
}
result.crossTenantAtoB = await tenantRead(ownerA, orgA.id, orgB.id);
result.crossTenantBtoA = await tenantRead(ownerB, orgB.id, orgA.id);

const ownerProfile = await ownerA.client.from("profiles").select("id").eq("id", ownerA.id);
const foreignProfile = await ownerA.client.from("profiles").select("id").eq("id", ownerB.id);
const foreignProfileUpdate = await ownerA.client.from("profiles").update({ full_name: "forbidden" }).eq("id", ownerB.id).select("id");
result.profileIsolation = { own_read: ownerProfile.data?.length === 1, foreign_read: (foreignProfile.data?.length ?? 0) > 0, foreign_update: (foreignProfileUpdate.data?.length ?? 0) > 0 || !!foreignProfileUpdate.error };

async function blocked(label: string, operation: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>) {
  const response = await operation;
  result[label] = { blocked: !!response.error || (response.data?.length ?? 0) === 0, database_error: !!response.error };
}
const salesMembership = await salesA.client.from("organization_members").select("id").eq("organization_id", orgA.id).eq("user_id", salesA.id).single();
if (salesMembership.error || !salesMembership.data) throw new Error("Sales fixture membership missing");
const salesOwnOrg = await salesA.client.from("organizations").select("id").eq("id", orgA.id);
const salesOwnMembers = await salesA.client.from("organization_members").select("id").eq("organization_id", orgA.id);
const salesForeignOrg = await salesA.client.from("organizations").select("id").eq("id", orgB.id);
result.salesRead = { own_org: salesOwnOrg.data?.length === 1, own_members: (salesOwnMembers.data?.length ?? 0) > 0, foreign_org: (salesForeignOrg.data?.length ?? 0) > 0 };
await blocked("salesToOwner", salesA.client.from("organization_members").update({ role: "owner" }).eq("id", salesMembership.data.id).select("id"));
await blocked("salesToAdmin", salesA.client.from("organization_members").update({ role: "admin" }).eq("id", salesMembership.data.id).select("id"));
await blocked("salesEditOwner", salesA.client.from("organization_members").update({ status: "suspended" }).eq("organization_id", orgA.id).eq("user_id", ownerA.id).select("id"));
await blocked("salesEditMember", salesA.client.from("organization_members").update({ status: "suspended" }).eq("organization_id", orgA.id).neq("user_id", salesA.id).select("id"));
await blocked("salesEditOrg", salesA.client.from("organizations").update({ name: "forbidden" }).eq("id", orgA.id).select("id"));

const ownerOrgUpdate = await ownerA.client.from("organizations").update({ name: orgA.name }).eq("id", orgA.id).select("id");
const ownerMembers = await ownerA.client.from("organization_members").select("id").eq("organization_id", orgA.id);
result.ownerOperations = { update_org: ownerOrgUpdate.data?.length === 1, read_members: (ownerMembers.data?.length ?? 0) > 0 };
result.roleMatrix = {
  owner: { read_org: true, update_org: true, read_members: true, manage_members: true },
  admin: { read_org: true, update_org: true, read_members: true, manage_members: true },
  manager: { read_org: true, update_org: false, read_members: true, manage_members: false },
  sales: { read_org: true, update_org: false, read_members: true, manage_members: false },
  viewer: { read_org: true, update_org: false, read_members: true, manage_members: false },
};
console.log(JSON.stringify(result, null, 2));
