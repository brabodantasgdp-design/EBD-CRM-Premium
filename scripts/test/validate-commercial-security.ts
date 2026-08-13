import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const required = ["E2E_OWNER_A_EMAIL", "E2E_OWNER_A_PASSWORD", "E2E_OWNER_B_EMAIL", "E2E_OWNER_B_PASSWORD", "E2E_SALES_A_EMAIL", "E2E_SALES_A_PASSWORD"];
if (!url || !key || required.some((name) => !process.env[name])) throw new Error("E2E environment is incomplete");

type Account = { client: SupabaseClient; userId: string };
const account = async (email: string, password: string): Promise<Account> => {
  const client = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  const login = await client.auth.signInWithPassword({ email, password });
  if (login.error || !login.data.user) throw new Error("E2E login failed");
  return { client, userId: login.data.user.id };
};

const ownerA = await account(process.env.E2E_OWNER_A_EMAIL!, process.env.E2E_OWNER_A_PASSWORD!);
const ownerB = await account(process.env.E2E_OWNER_B_EMAIL!, process.env.E2E_OWNER_B_PASSWORD!);
const salesA = await account(process.env.E2E_SALES_A_EMAIL!, process.env.E2E_SALES_A_PASSWORD!);
const orgAResult = await ownerA.client.from("organizations").select("id").eq("created_by", ownerA.userId).limit(1).single();
const orgBResult = await ownerB.client.from("organizations").select("id").eq("created_by", ownerB.userId).limit(1).single();
if (orgAResult.error || orgBResult.error || !orgAResult.data || !orgBResult.data) throw new Error("Organization fixtures are incomplete");
const orgA = orgAResult.data.id;
const orgB = orgBResult.data.id;
const report: Record<string, unknown> = {};
const marker = `codex07-${Date.now()}`;

const createdCompany = await ownerA.client.from("companies").insert({
  organization_id: orgA,
  created_by: ownerA.userId,
  name: `Codex Company ${marker}`,
  domain: `${marker}.example`,
  status: "prospect",
  owner_id: ownerA.userId,
}).select("id").single();
if (createdCompany.error || !createdCompany.data) throw createdCompany.error ?? new Error("Company fixture creation failed");
const companyId = createdCompany.data.id;

const createdContact = await ownerA.client.from("contacts").insert({
  organization_id: orgA,
  created_by: ownerA.userId,
  first_name: "Codex",
  full_name: `Codex Contact ${marker}`,
  email: `${marker}@example.test`,
  company_id: companyId,
  owner_id: ownerA.userId,
}).select("id").single();
if (createdContact.error || !createdContact.data) throw createdContact.error ?? new Error("Contact fixture creation failed");
const contactId = createdContact.data.id;

const salesRead = await salesA.client.from("companies").select("id").eq("id", companyId);
const salesUpdate = await salesA.client.from("companies").update({ name: `Sales updated ${marker}` }).eq("id", companyId).select("id");
const salesContactUpdate = await salesA.client.from("contacts").update({ job_title: "Sales" }).eq("id", contactId).select("id");
report.salesWrite = { can_read: salesRead.data?.length === 1, can_update_company: salesUpdate.data?.length === 1, can_update_contact: salesContactUpdate.data?.length === 1 };

const ownerBRead = await ownerB.client.from("companies").select("id").eq("id", companyId);
const ownerBContactRead = await ownerB.client.from("contacts").select("id").eq("id", contactId);
const crossTenantCompany = await ownerA.client.from("companies").insert({ organization_id: orgB, created_by: ownerA.userId, name: `Forbidden ${marker}`, owner_id: ownerA.userId }).select("id");
const crossTenantContact = await ownerA.client.from("contacts").insert({ organization_id: orgB, created_by: ownerA.userId, first_name: "Forbidden", full_name: `Forbidden ${marker}`, owner_id: ownerA.userId }).select("id");
report.crossTenant = { ownerB_company_hidden: (ownerBRead.data?.length ?? 0) === 0, ownerB_contact_hidden: (ownerBContactRead.data?.length ?? 0) === 0, company_insert_blocked: !!crossTenantCompany.error || (crossTenantCompany.data?.length ?? 0) === 0, contact_insert_blocked: !!crossTenantContact.error || (crossTenantContact.data?.length ?? 0) === 0 };

const salesMember = await ownerA.client.from("organization_members").select("id").eq("organization_id", orgA).eq("user_id", salesA.userId).single();
if (salesMember.data) {
  await ownerA.client.rpc("set_member_status", { target_member: salesMember.data.id, target_status: "suspended" });
  const suspendedRead = await salesA.client.from("companies").select("id").eq("id", companyId);
  report.suspended_sales_blocked = !!suspendedRead.error || (suspendedRead.data?.length ?? 0) === 0;
  await ownerA.client.rpc("set_member_status", { target_member: salesMember.data.id, target_status: "active" });
}

const audit = await ownerA.client.from("audit_logs").select("action, entity_type, entity_id").eq("organization_id", orgA).in("entity_id", [companyId, contactId]);
report.audit_events_present = (audit.data?.length ?? 0) >= 2;
await ownerA.client.from("contacts").update({ archived_at: new Date().toISOString() }).eq("id", contactId);
await ownerA.client.from("companies").update({ archived_at: new Date().toISOString() }).eq("id", companyId);
console.log(JSON.stringify(report, null, 2));
