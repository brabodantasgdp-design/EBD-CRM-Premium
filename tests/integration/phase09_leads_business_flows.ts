import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database.types";

type Client = SupabaseClient<Database>;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key || !process.env.E2E_OWNER_A_EMAIL || !process.env.E2E_OWNER_A_PASSWORD || !process.env.E2E_OWNER_B_EMAIL || !process.env.E2E_OWNER_B_PASSWORD) throw new Error("Integration environment is incomplete");
const login = async (email: string, password: string) => {
  const client = createClient<Database>(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await client.auth.signInWithPassword({ email, password });
  if (result.error || !result.data.user) throw new Error("Fixture login failed");
  return { client, userId: result.data.user.id };
};
const ownerA = await login(process.env.E2E_OWNER_A_EMAIL!, process.env.E2E_OWNER_A_PASSWORD!);
const ownerB = await login(process.env.E2E_OWNER_B_EMAIL!, process.env.E2E_OWNER_B_PASSWORD!);
const must = <T>(label: string, result: { data: T; error: { message: string } | null }) => { if (result.error) throw new Error(`${label}: ${result.error.message}`); return result.data; };
const expect = (value: boolean, message: string) => { if (!value) throw new Error(`ASSERTION FAILED: ${message}`); };
const orgA = must("Org A", await ownerA.client.from("organizations").select("id").eq("created_by", ownerA.userId).limit(1).single()).id;
const orgB = must("Org B", await ownerB.client.from("organizations").select("id").eq("created_by", ownerB.userId).limit(1).single()).id;
const pipeline = must("Pipeline", await ownerA.client.from("pipelines").select("id").eq("organization_id", orgA).eq("is_default", true).is("archived_at", null).limit(1).single());
const stage = must("Open stage", await ownerA.client.from("pipeline_stages").select("id").eq("pipeline_id", pipeline.id).eq("organization_id", orgA).eq("stage_type", "open").limit(1).single());
const marker = `phase09-${Date.now()}`;
const lead = must("Create lead", await ownerA.client.from("leads").insert({ organization_id: orgA, created_by: ownerA.userId, owner_id: ownerA.userId, name: `Lead ${marker}`, company_name: `Company ${marker}`, email: `${marker}@example.test`, phone: "5511999999999", status: "new", source: "test", score: 65 }).select("*").single());
const edited = must("Edit lead", await ownerA.client.from("leads").update({ name: `Lead edited ${marker}` }).eq("id", lead.id).eq("organization_id", orgA).select("id, name").single());
expect(edited.name.includes("edited"), "lead edit persists");
const conversion = must("Convert lead", await ownerA.client.rpc("convert_lead", { target_lead: lead.id, target_pipeline: pipeline.id, target_stage: stage.id, target_company_name: `Company ${marker}`, target_contact_name: `Contact ${marker}`, target_deal_name: `Deal ${marker}`, target_value: 1000 }));
expect(Boolean(conversion), "conversion returned linked IDs");
const reconvert = await ownerA.client.rpc("convert_lead", { target_lead: lead.id, target_pipeline: pipeline.id, target_stage: stage.id });
expect(Boolean(reconvert.error), "reconversion blocked");
const bulkRows = must("Bulk lead fixtures", await ownerA.client.from("leads").insert([
  { organization_id: orgA, created_by: ownerA.userId, owner_id: ownerA.userId, name: `Bulk One ${marker}`, status: "new", source: "test" },
  { organization_id: orgA, created_by: ownerA.userId, owner_id: ownerA.userId, name: `Bulk Two ${marker}`, status: "new", source: "test" },
  { organization_id: orgA, created_by: ownerA.userId, owner_id: ownerA.userId, name: `Bulk Control ${marker}`, status: "new", source: "test" },
]).select("id, status"));
const bulkIds = bulkRows.map((item) => item.id);
const bulkUpdated = must("Bulk update", await ownerA.client.from("leads").update({ status: "qualified" }).in("id", bulkIds.slice(0, 2)).eq("organization_id", orgA).select("id, status"));
expect(bulkUpdated.length === 2 && bulkUpdated.every((item) => item.status === "qualified"), "exactly two leads bulk-updated");
const bulkControl = must("Bulk control", await ownerA.client.from("leads").select("status").eq("id", bulkIds[2]).single());
expect(bulkControl.status === "new", "bulk control remains unchanged");
const archived = must("Archive lead", await ownerA.client.from("leads").update({ archived_at: new Date().toISOString() }).eq("id", lead.id).eq("organization_id", orgA).select("id, archived_at").single());
expect(Boolean(archived.archived_at), "lead archived");
const activeAfterArchive = must("Archive refresh", await ownerA.client.from("leads").select("id").eq("id", lead.id).is("archived_at", null));
expect(activeAfterArchive.length === 0, "archived lead absent from active refresh");
const auditAfterArchive = must("Complete lead audit", await ownerA.client.from("audit_logs").select("action").eq("entity_id", lead.id));
expect(auditAfterArchive.some((item) => item.action === "lead.archived"), "lead archived audit exists");
const rollbackLead = must("Rollback fixture", await ownerA.client.from("leads").insert({ organization_id: orgA, created_by: ownerA.userId, owner_id: ownerA.userId, name: `Rollback ${marker}`, company_name: `Rollback Company ${marker}`, email: `rollback-${marker}@example.test`, status: "new" }).select("id").single());
const rollback = await ownerA.client.rpc("convert_lead", { target_lead: rollbackLead.id, target_pipeline: pipeline.id, target_stage: "00000000-0000-0000-0000-000000000000", target_company_name: `Rollback Company ${marker}`, target_contact_name: `Rollback Contact ${marker}`, target_deal_name: `Rollback Deal ${marker}` });
expect(Boolean(rollback.error), "invalid stage conversion fails");
const rollbackState = must("Rollback state", await ownerA.client.from("leads").select("status, converted_at, converted_company_id, converted_contact_id, converted_deal_id").eq("id", rollbackLead.id).single());
const rollbackCompany = must("Rollback company residue", await ownerA.client.from("companies").select("id").eq("organization_id", orgA).eq("name", `Rollback Company ${marker}`));
const rollbackContact = must("Rollback contact residue", await ownerA.client.from("contacts").select("id").eq("organization_id", orgA).eq("email", `rollback-${marker}@example.test`));
const rollbackDeal = must("Rollback deal residue", await ownerA.client.from("deals").select("id").eq("organization_id", orgA).ilike("name", `Rollback Deal ${marker}`));
expect(rollbackState.status === "new" && !rollbackState.converted_at && !rollbackState.converted_company_id && !rollbackState.converted_contact_id && !rollbackState.converted_deal_id && rollbackCompany.length === 0 && rollbackContact.length === 0 && rollbackDeal.length === 0, "rollback leaves no partial artifacts");
const reusedCompany = must("Reuse company fixture", await ownerA.client.from("companies").insert({ organization_id: orgA, created_by: ownerA.userId, owner_id: ownerA.userId, name: `Reuse Company ${marker}` }).select("id, name").single());
const reusedContact = must("Reuse contact fixture", await ownerA.client.from("contacts").insert({ organization_id: orgA, created_by: ownerA.userId, owner_id: ownerA.userId, company_id: reusedCompany.id, first_name: "Reuse", full_name: `Reuse Contact ${marker}`, email: `reuse-${marker}@example.test` }).select("id, company_id, email").single());
const reuseLead = must("Reuse lead fixture", await ownerA.client.from("leads").insert({ organization_id: orgA, created_by: ownerA.userId, owner_id: ownerA.userId, name: `Reuse Lead ${marker}`, company_name: reusedCompany.name, email: reusedContact.email, status: "new" }).select("id").single());
const reused = must("Convert with reuse", await ownerA.client.rpc("convert_lead", { target_lead: reuseLead.id, target_pipeline: pipeline.id, target_stage: stage.id, target_company_name: reusedCompany.name, target_contact_name: `Reuse Contact ${marker}`, target_deal_name: `Reuse Deal ${marker}` }));
const reusedLinks = reused as { company_id?: string; contact_id?: string };
expect(reusedLinks.company_id === reusedCompany.id && reusedLinks.contact_id === reusedContact.id, "company/contact reused within tenant");
const leadB = must("Lead B fixture", await ownerB.client.from("leads").insert({ organization_id: orgB, created_by: ownerB.userId, owner_id: ownerB.userId, name: `Lead B ${marker}`, status: "new" }).select("id").single());
const ownerAReadB = await ownerA.client.from("leads").select("id").eq("id", leadB.id);
const ownerAEditB = await ownerA.client.from("leads").update({ name: "forbidden" }).eq("id", leadB.id).select("id");
const ownerAConvertB = await ownerA.client.rpc("convert_lead", { target_lead: leadB.id, target_pipeline: pipeline.id, target_stage: stage.id });
expect((ownerAReadB.data?.length ?? 0) === 0 && (ownerAEditB.data?.length ?? 0) === 0 && Boolean(ownerAConvertB.error), "Owner A cannot read/edit/convert Lead B");
const memberships = must("Owner memberships", await ownerA.client.from("organization_members").select("organization_id, role, status").eq("user_id", ownerA.userId).eq("status", "active"));
const emptyOrg = memberships.find((item) => item.organization_id !== orgA)?.organization_id;
if (emptyOrg) {
  const emptyLeads = must("Empty org leads", await ownerA.client.from("leads").select("id").eq("organization_id", emptyOrg).is("archived_at", null));
  expect(emptyLeads.length === 0, "empty organization has zero active leads");
}
const salesSession = await login(process.env.E2E_SALES_A_EMAIL!, process.env.E2E_SALES_A_PASSWORD!);
const salesMembership = must("Sales membership", await salesSession.client.from("organization_members").select("role, status").eq("organization_id", orgA).eq("user_id", salesSession.userId).maybeSingle());
expect(salesMembership?.role === "sales" && salesMembership.status === "active", "Sales fixture is active");
const otherTenantRead = await ownerB.client.from("leads").select("id").eq("id", lead.id);
const otherTenantEdit = await ownerB.client.from("leads").update({ name: "forbidden" }).eq("id", lead.id).select("id");
expect((otherTenantRead.data?.length ?? 0) === 0 && (otherTenantEdit.data?.length ?? 0) === 0, "cross-tenant lead blocked");
const audit = must("Lead audit", await ownerA.client.from("audit_logs").select("action").eq("entity_id", lead.id));
expect(audit.some((item) => item.action === "lead.created") && audit.some((item) => item.action === "lead.converted"), "lead audit events exist");
console.log(JSON.stringify({ leadId: lead.id, organizationId: orgA, conversion, bulk: true, rollback: true, reuse: reused, reconversion: true, auditActions: auditAfterArchive.map((item) => item.action), crossTenant: true, sales: { role: salesMembership?.role, status: salesMembership?.status }, emptyOrg: emptyOrg || null }));
