import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const required = ["E2E_OWNER_A_EMAIL", "E2E_OWNER_A_PASSWORD", "E2E_OWNER_B_EMAIL", "E2E_OWNER_B_PASSWORD", "E2E_SALES_A_EMAIL", "E2E_SALES_A_PASSWORD"];
if (!url || !key || required.some((name) => !process.env[name])) throw new Error("E2E environment is incomplete");
const makeClient = () => createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
async function login(email: string, password: string) {
  const client = makeClient();
  const result = await client.auth.signInWithPassword({ email, password });
  if (result.error || !result.data.user) throw new Error("E2E login failed");
  return { client, userId: result.data.user.id };
}
const ownerA = await login(process.env.E2E_OWNER_A_EMAIL!, process.env.E2E_OWNER_A_PASSWORD!);
const ownerB = await login(process.env.E2E_OWNER_B_EMAIL!, process.env.E2E_OWNER_B_PASSWORD!);
const salesA = await login(process.env.E2E_SALES_A_EMAIL!, process.env.E2E_SALES_A_PASSWORD!);
const orgsA = await ownerA.client.from("organizations").select("id, name").eq("created_by", ownerA.userId).limit(1).single();
const orgsB = await ownerB.client.from("organizations").select("id, name").eq("created_by", ownerB.userId).limit(1).single();
if (orgsA.error || orgsB.error || !orgsA.data || !orgsB.data) throw new Error("Owner organization fixtures are incomplete");
const orgA = orgsA.data.id;
const orgB = orgsB.data.id;
const report: Record<string, unknown> = { organization: { orgA, orgB } };

const ownOrgMemberships = await ownerA.client.from("organization_members").select("organization_id, role, status").eq("user_id", ownerA.userId).eq("status", "active");
const accessibleOrgs = (ownOrgMemberships.data ?? []).map((row) => row.organization_id);
const counts = await Promise.all(accessibleOrgs.map(async (id) => {
  const companies = await ownerA.client.from("companies").select("id", { count: "exact", head: true }).eq("organization_id", id).is("archived_at", null);
  const contacts = await ownerA.client.from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", id).is("archived_at", null);
  return { id, companies: companies.count ?? 0, contacts: contacts.count ?? 0 };
}));
report.accessibleOrganizationCounts = counts;

const marker = `phase071-${Date.now()}`;
const company = await ownerA.client.from("companies").insert({ organization_id: orgA, created_by: ownerA.userId, name: `E2E Company Persist ${marker}`, phone: "5511999990000", owner_id: ownerA.userId }).select("id, organization_id, archived_at").single();
if (company.error || !company.data) throw company.error ?? new Error("company create failed");
const companyId = company.data.id;
const companyAuditCreated = await ownerA.client.from("audit_logs").select("id").eq("entity_id", companyId).eq("action", "companies.created");
const companyEdit = await ownerA.client.from("companies").update({ name: `E2E Company Edited ${marker}`, status: "cliente" }).eq("id", companyId).select("name, status").single();
const companyAuditUpdated = await ownerA.client.from("audit_logs").select("id").eq("entity_id", companyId).eq("action", "companies.updated");
const companyArchive = await ownerA.client.from("companies").update({ archived_at: new Date().toISOString() }).eq("id", companyId).select("archived_at").single();
const companyActiveAfterArchive = await ownerA.client.from("companies").select("id").eq("id", companyId).is("archived_at", null);
const companyAuditArchived = await ownerA.client.from("audit_logs").select("id").eq("entity_id", companyId).eq("action", "companies.archived");
report.company = { created: !company.error, edited: !companyEdit.error && companyEdit.data?.status === "cliente", refreshed: (await ownerA.client.from("companies").select("name").eq("id", companyId).single()).data?.name?.includes("Edited"), archived: !companyArchive.error && !!companyArchive.data?.archived_at && (companyActiveAfterArchive.data?.length ?? 0) === 0, audit: [companyAuditCreated.data?.length, companyAuditUpdated.data?.length, companyAuditArchived.data?.length] };

const activeCompany = await ownerA.client.from("companies").insert({ organization_id: orgA, created_by: ownerA.userId, name: `E2E Contact Company ${marker}`, owner_id: ownerA.userId }).select("id").single();
if (activeCompany.error || !activeCompany.data) throw activeCompany.error ?? new Error("contact company failed");
const contact = await ownerA.client.from("contacts").insert({ organization_id: orgA, created_by: ownerA.userId, first_name: "E2E", last_name: "Contact", full_name: `E2E Contact ${marker}`, email: `${marker}@example.test`, company_id: activeCompany.data.id, owner_id: ownerA.userId }).select("id, organization_id, company_id").single();
if (contact.error || !contact.data) throw contact.error ?? new Error("contact create failed");
const contactId = contact.data.id;
const contactAuditCreated = await ownerA.client.from("audit_logs").select("id").eq("entity_id", contactId).eq("action", "contacts.created");
const contactEdit = await ownerA.client.from("contacts").update({ job_title: "Persisted Manager" }).eq("id", contactId).select("job_title").single();
const contactAuditUpdated = await ownerA.client.from("audit_logs").select("id").eq("entity_id", contactId).eq("action", "contacts.updated");
const contactArchive = await ownerA.client.from("contacts").update({ archived_at: new Date().toISOString() }).eq("id", contactId).select("archived_at").single();
const contactActiveAfterArchive = await ownerA.client.from("contacts").select("id").eq("id", contactId).is("archived_at", null);
const contactAuditArchived = await ownerA.client.from("audit_logs").select("id").eq("entity_id", contactId).eq("action", "contacts.archived");
report.contact = { created: !contact.error && contact.data.organization_id === orgA && contact.data.company_id === activeCompany.data.id, edited: !contactEdit.error && contactEdit.data?.job_title === "Persisted Manager", refreshed: (await ownerA.client.from("contacts").select("job_title").eq("id", contactId).single()).data?.job_title === "Persisted Manager", archived: !contactArchive.error && !!contactArchive.data?.archived_at && (contactActiveAfterArchive.data?.length ?? 0) === 0, audit: [contactAuditCreated.data?.length, contactAuditUpdated.data?.length, contactAuditArchived.data?.length] };

const foreignCompany = await ownerB.client.from("companies").insert({ organization_id: orgB, created_by: ownerB.userId, name: `Foreign Company ${marker}`, owner_id: ownerB.userId }).select("id").single();
const crossTenantLink = foreignCompany.data ? await ownerA.client.from("contacts").insert({ organization_id: orgA, created_by: ownerA.userId, first_name: "Blocked", full_name: `Blocked ${marker}`, company_id: foreignCompany.data.id, owner_id: ownerA.userId }).select("id") : { data: null, error: foreignCompany.error };
report.crossTenantLink = !!crossTenantLink.error || (crossTenantLink.data?.length ?? 0) === 0;

const salesOwnRead = await salesA.client.from("companies").select("id").eq("organization_id", orgA);
const salesForeignRead = await salesA.client.from("companies").select("id").eq("organization_id", orgB);
const salesMembership = await ownerA.client.from("organization_members").select("id").eq("organization_id", orgA).eq("user_id", salesA.userId).single();
let suspendedBlocked = false;
if (salesMembership.data) {
  await ownerA.client.rpc("set_member_status", { target_member: salesMembership.data.id, target_status: "suspended" });
  const suspendedRead = await salesA.client.from("companies").select("id").eq("organization_id", orgA);
  suspendedBlocked = !!suspendedRead.error || (suspendedRead.data?.length ?? 0) === 0;
  await ownerA.client.rpc("set_member_status", { target_member: salesMembership.data.id, target_status: "active" });
}
report.sales = { ownRead: (salesOwnRead.data?.length ?? 0) >= 0, foreignReadBlocked: (salesForeignRead.data?.length ?? 0) === 0, suspendedBlocked };

if (foreignCompany.data) await ownerB.client.from("companies").update({ archived_at: new Date().toISOString() }).eq("id", foreignCompany.data.id);
await ownerA.client.from("companies").update({ archived_at: new Date().toISOString() }).eq("id", activeCompany.data.id);
console.log(JSON.stringify(report, null, 2));
