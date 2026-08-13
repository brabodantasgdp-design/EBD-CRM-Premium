import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database.types";

type Client = SupabaseClient<Database>;
type Account = { client: Client; userId: string; email: string };
type DealRow = Database["public"]["Tables"]["deals"]["Row"];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const required = [
  "E2E_OWNER_A_EMAIL", "E2E_OWNER_A_PASSWORD",
  "E2E_OWNER_B_EMAIL", "E2E_OWNER_B_PASSWORD",
  "E2E_SALES_A_EMAIL", "E2E_SALES_A_PASSWORD",
];
if (!url || !key || required.some((name) => !process.env[name])) {
  throw new Error("Integration environment is incomplete");
}

const account = async (email: string, password: string): Promise<Account> => {
  const client = createClient<Database>(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await client.auth.signInWithPassword({ email, password });
  if (result.error || !result.data.user) throw new Error(`Authenticated fixture login failed: ${result.error?.message ?? "missing user"}`);
  return { client, userId: result.data.user.id, email };
};

const failIfError = <T>(label: string, result: { data: T; error: { message: string } | null }): T => {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
};

const expect = (condition: boolean, message: string) => {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
};

const ownerA = await account(process.env.E2E_OWNER_A_EMAIL!, process.env.E2E_OWNER_A_PASSWORD!);
const ownerB = await account(process.env.E2E_OWNER_B_EMAIL!, process.env.E2E_OWNER_B_PASSWORD!);
const salesA = await account(process.env.E2E_SALES_A_EMAIL!, process.env.E2E_SALES_A_PASSWORD!);

const orgA = failIfError("Org A", await ownerA.client.from("organizations").select("id").eq("created_by", ownerA.userId).limit(1).single()).id;
const orgB = failIfError("Org B", await ownerB.client.from("organizations").select("id").eq("created_by", ownerB.userId).limit(1).single()).id;
const memberships = failIfError("Owner memberships", await ownerA.client.from("organization_members").select("organization_id").eq("user_id", ownerA.userId).eq("status", "active"));

const pipeline = failIfError("Pipeline A", await ownerA.client.from("pipelines").select("id").eq("organization_id", orgA).eq("is_default", true).is("archived_at", null).limit(1).single());
const stages = failIfError("Stages A", await ownerA.client.from("pipeline_stages").select("id, stage_type, probability, position").eq("organization_id", orgA).eq("pipeline_id", pipeline.id).is("archived_at", null).order("position"));
const openStage = stages.find((stage) => stage.stage_type === "open");
const wonStage = stages.find((stage) => stage.stage_type === "won");
const lostStage = stages.find((stage) => stage.stage_type === "lost");
if (!openStage || !wonStage || !lostStage) throw new Error("Pipeline A lacks open/won/lost stages");

const marker = `phase08-11-${Date.now()}`;
const company = failIfError("Company fixture", await ownerA.client.from("companies").insert({ organization_id: orgA, created_by: ownerA.userId, owner_id: ownerA.userId, name: `Company ${marker}` }).select("id, organization_id").single());
const contact = failIfError("Contact fixture", await ownerA.client.from("contacts").insert({ organization_id: orgA, created_by: ownerA.userId, owner_id: ownerA.userId, company_id: company.id, first_name: "Phase", full_name: `Contact ${marker}`, email: `${marker}@example.test` }).select("id, organization_id, company_id").single());
expect(company.organization_id === orgA && contact.organization_id === orgA && contact.company_id === company.id, "fixture tenant relationships");

const createDeal = async (name: string, value: number): Promise<DealRow> => failIfError("Deal fixture", await ownerA.client.from("deals").insert({ organization_id: orgA, created_by: ownerA.userId, owner_id: ownerA.userId, name, company_id: company.id, contact_id: contact.id, pipeline_id: pipeline.id, stage_id: openStage.id, probability: openStage.probability, value, currency: "BRL", status: "open" }).select("*").single());
const primary = await createDeal(`Deal A ${marker}`, 1000);
const bulkOne = await createDeal(`Bulk One ${marker}`, 2000);
const bulkTwo = await createDeal(`Bulk Two ${marker}`, 3000);
const createdIds = [primary.id, bulkOne.id, bulkTwo.id];

const edited = failIfError("Edit Deal A", await ownerA.client.from("deals").update({ name: `Deal A edited ${marker}`, value: 1250, expected_close_date: "2026-12-31" }).eq("id", primary.id).eq("organization_id", orgA).select("*").single());
expect(edited.name.includes("edited") && Number(edited.value) === 1250 && edited.organization_id === orgA, "edit preserves tenant and values");

const rpc = async <T>(label: string, fn: string, args: Record<string, string | null>): Promise<T> => failIfError(label, await ownerA.client.rpc(fn as never, args as never) as { data: T; error: { message: string } | null });
const moved = await rpc<DealRow>("Move Deal A", "move_deal_stage", { target_deal: primary.id, target_pipeline: pipeline.id, target_stage: openStage.id, target_note: "phase08-11 move" });
expect(moved.stage_id === openStage.id && moved.probability === openStage.probability, "move updates stage and probability");
const won = await rpc<DealRow>("Won Deal A", "mark_deal_won", { target_deal: primary.id, target_stage: wonStage.id });
expect(won.status === "won" && won.probability === wonStage.probability && !!won.won_at, "won transition");
const reopenedWon = await rpc<DealRow>("Reopen won Deal A", "reopen_deal", { target_deal: primary.id, target_pipeline: pipeline.id, target_stage: openStage.id });
expect(reopenedWon.status === "open" && reopenedWon.stage_id === openStage.id && !reopenedWon.won_at && !reopenedWon.lost_at, "reopen won transition");
const lost = await rpc<DealRow>("Lost Deal A", "mark_deal_lost", { target_deal: primary.id, target_reason: "budget", target_note: "phase08-11" , target_stage: lostStage.id });
expect(lost.status === "lost" && lost.probability === lostStage.probability && !!lost.lost_at && lost.loss_reason === "budget", "lost transition");
const reopenedLost = await rpc<DealRow>("Reopen lost Deal A", "reopen_deal", { target_deal: primary.id, target_pipeline: pipeline.id, target_stage: openStage.id });
expect(reopenedLost.status === "open" && reopenedLost.stage_id === openStage.id && !reopenedLost.loss_reason && !reopenedLost.loss_note, "reopen lost transition");

const history = failIfError("Deal history", await ownerA.client.from("deal_stage_history").select("to_stage_id, note").eq("organization_id", orgA).eq("deal_id", primary.id).order("created_at"));
const audit = failIfError("Deal audit", await ownerA.client.from("audit_logs").select("action, entity_id").eq("organization_id", orgA).eq("entity_id", primary.id));
expect(history.length >= 5 && audit.length >= 5, "history and audit events exist");

const bulkMoved = await Promise.all([bulkOne.id, bulkTwo.id].map((id) => rpc<DealRow>("Bulk stage", "move_deal_stage", { target_deal: id, target_pipeline: pipeline.id, target_stage: openStage.id, target_note: "phase08-11 bulk stage" })));
expect(bulkMoved.length === 2 && bulkMoved.every((deal) => deal.stage_id === openStage.id), "bulk stage changes exactly two deals");
const bulkOwner = failIfError("Bulk owner", await ownerA.client.from("deals").update({ owner_id: ownerA.userId }).in("id", [bulkOne.id, bulkTwo.id]).eq("organization_id", orgA).select("id, owner_id"));
expect(bulkOwner.length === 2 && bulkOwner.every((deal) => deal.owner_id === ownerA.userId), "bulk owner changes exactly two deals");
await Promise.all([bulkOne.id, bulkTwo.id].map((id) => rpc<DealRow>("Bulk archive", "archive_deal", { target_deal: id })));
const activeBulk = failIfError("Bulk archive refresh", await ownerA.client.from("deals").select("id").in("id", [bulkOne.id, bulkTwo.id]).is("archived_at", null));
expect(activeBulk.length === 0, "bulk archive removes exactly two active deals");

const companyDeals = failIfError("Company deals", await ownerA.client.from("deals").select("id").eq("organization_id", orgA).eq("company_id", company.id));
const contactDeals = failIfError("Contact deals", await ownerA.client.from("deals").select("id").eq("organization_id", orgA).eq("contact_id", contact.id));
expect(companyDeals.some((deal) => deal.id === primary.id) && contactDeals.some((deal) => deal.id === primary.id), "company/contact point to same Deal A");

const kpiDeals = failIfError("KPI deals", await ownerA.client.from("deals").select("value, probability, status, archived_at").eq("organization_id", orgA));
const open = kpiDeals.filter((deal) => !deal.archived_at && deal.status === "open");
const wonCount = kpiDeals.filter((deal) => !deal.archived_at && deal.status === "won").length;
const closed = kpiDeals.filter((deal) => !deal.archived_at && (deal.status === "won" || deal.status === "lost")).length;
const kpis = { openPipeline: open.reduce((sum, deal) => sum + Number(deal.value), 0), weightedForecast: open.reduce((sum, deal) => sum + Number(deal.value) * Number(deal.probability) / 100, 0), won: wonCount, winRate: closed ? wonCount / closed * 100 : 0 };
expect(Number.isFinite(kpis.openPipeline) && Number.isFinite(kpis.weightedForecast), "KPI calculations are finite");

const ownerBRead = await ownerB.client.from("deals").select("id").eq("id", primary.id);
const ownerBMove = await ownerB.client.rpc("move_deal_stage", { target_deal: primary.id, target_pipeline: pipeline.id, target_stage: openStage.id });
const ownerBEdit = await ownerB.client.from("deals").update({ name: "forbidden" }).eq("id", primary.id).select("id");
const ownerBArchive = await ownerB.client.rpc("archive_deal", { target_deal: primary.id });
expect((ownerBRead.data?.length ?? 0) === 0 && !!ownerBMove.error && ((ownerBEdit.data?.length ?? 0) === 0 || !!ownerBEdit.error) && !!ownerBArchive.error, "cross-tenant Deal A blocked for Owner B");

const salesMembership = failIfError("Sales membership", await salesA.client.from("organization_members").select("organization_id, role, status").eq("organization_id", orgA).eq("user_id", salesA.userId).maybeSingle());
const salesRead = await salesA.client.from("deals").select("id").eq("id", primary.id);
const salesPipelineWrite = await salesA.client.from("pipelines").update({ name: `forbidden ${marker}` }).eq("id", pipeline.id).select("id");
const salesPipelineBlocked = !!salesPipelineWrite.error || (salesPipelineWrite.data?.length ?? 0) === 0;
expect((salesRead.data?.length ?? 0) === 1 && salesMembership?.status === "active" && salesMembership.role === "sales" && salesPipelineBlocked, `Sales policy check (role=${salesMembership?.role ?? "none"}, status=${salesMembership?.status ?? "none"}, pipelineBlocked=${salesPipelineBlocked})`);

const emptyOrg = memberships.find((membership) => membership.organization_id !== orgA)?.organization_id ?? null;
const emptyOrgDeals = emptyOrg ? failIfError("Empty org deals", await ownerA.client.from("deals").select("id").eq("organization_id", emptyOrg).is("archived_at", null)) : [];
const archived = await ownerA.client.rpc("archive_deal", { target_deal: primary.id });
if (archived.error) throw new Error(`Cleanup archive: ${archived.error.message}`);
const activePrimary = failIfError("Archive refresh", await ownerA.client.from("deals").select("id").eq("id", primary.id).is("archived_at", null));
expect(activePrimary.length === 0, "archive removes Deal A from active list");
const report = { fixture: { organizationId: orgA, companyId: company.id, contactId: contact.id, pipelineId: pipeline.id, dealId: primary.id }, transitions: { edit: true, move: true, won: true, reopenWon: true, lost: true, reopenLost: true, archive: true }, historyCount: history.length, auditCount: audit.length, bulk: { stage: true, owner: true, archive: true }, relations: { companyDeal: true, contactDeal: true }, kpis, crossTenant: true, sales: { membership: salesMembership, commercialRead: true, pipelineWriteBlocked: salesPipelineBlocked }, newOrg: { existingEmptyOrganization: emptyOrg, deals: emptyOrgDeals.length }, orgSwitch: { activeOrganizations: memberships.length, validatedEmptyOrganization: Boolean(emptyOrg) } };
console.log(JSON.stringify(report, null, 2));
