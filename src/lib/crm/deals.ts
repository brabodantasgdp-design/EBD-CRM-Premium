import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyItem, ContactItem, DealItem, PipelineEntity, PipelineStageEntity } from "../../types/crm";
import type { Database, Json } from "../../types/database.types";

type Client = SupabaseClient<Database>;
type DealRow = Database["public"]["Tables"]["deals"]["Row"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function record(value: Json): Record<string, Json> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Json> : {};
}

function mapStage(row: Database["public"]["Tables"]["pipeline_stages"]["Row"]): PipelineStageEntity {
  return { id: row.id, pipelineId: row.pipeline_id, name: row.name, position: row.position, probability: row.probability, color: row.color ?? undefined, stageType: row.stage_type as PipelineStageEntity["stageType"] };
}

export async function listPipelines(client: Client, organizationId: string): Promise<PipelineEntity[]> {
  const [{ data: pipelines, error: pipelineError }, { data: stages, error: stageError }] = await Promise.all([
    client.from("pipelines").select("*").eq("organization_id", organizationId).is("archived_at", null).order("position"),
    client.from("pipeline_stages").select("*").eq("organization_id", organizationId).is("archived_at", null).order("position"),
  ]);
  if (pipelineError) throw pipelineError;
  if (stageError) throw stageError;
  return (pipelines ?? []).map((pipeline) => ({
    id: pipeline.id, organizationId: pipeline.organization_id, name: pipeline.name, description: pipeline.description ?? undefined,
    status: pipeline.status as PipelineEntity["status"], isDefault: pipeline.is_default, position: pipeline.position,
    stages: (stages ?? []).filter((stage) => stage.pipeline_id === pipeline.id).map(mapStage),
  }));
}

export async function listStages(client: Client, organizationId: string, pipelineId: string) {
  const { data, error } = await client.from("pipeline_stages").select("*").eq("organization_id", organizationId).eq("pipeline_id", pipelineId).is("archived_at", null).order("position");
  if (error) throw error;
  return (data ?? []).map(mapStage);
}

export async function createPipeline(client: Client, organizationId: string, userId: string, input: { name: string; description?: string; stages?: Array<Pick<PipelineStageEntity, "name" | "probability" | "color" | "stageType">> }) {
  const { data, error } = await client.from("pipelines").insert({ organization_id: organizationId, name: input.name.trim(), description: input.description?.trim() || null, created_by: userId, position: 99 }).select("*").single();
  if (error) throw error;
  if (input.stages?.length) {
    const { error: stageError } = await client.from("pipeline_stages").insert(input.stages.map((stage, position) => ({ organization_id: organizationId, pipeline_id: data.id, name: stage.name.trim(), position, probability: stage.probability, color: stage.color || null, stage_type: stage.stageType })));
    if (stageError) throw stageError;
  }
  return data;
}

export async function updatePipeline(client: Client, organizationId: string, id: string, input: { name?: string; description?: string; status?: string; isDefault?: boolean; position?: number }) {
  const payload: Database["public"]["Tables"]["pipelines"]["Update"] = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.description !== undefined) payload.description = input.description.trim() || null;
  if (input.status !== undefined) payload.status = input.status;
  if (input.isDefault !== undefined) payload.is_default = input.isDefault;
  if (input.position !== undefined) payload.position = input.position;
  const { data, error } = await client.from("pipelines").update(payload).eq("organization_id", organizationId).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

async function ownerNames(client: Client, ids: (string | null)[]) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return new Map<string, string>();
  const { data } = await client.from("profiles").select("id, full_name").in("id", unique);
  return new Map((data ?? []).map((profile) => [profile.id, profile.full_name || profile.id]));
}

export async function listDeals(client: Client, organizationId: string): Promise<DealItem[]> {
  const { data, error } = await client.from("deals").select("*").eq("organization_id", organizationId).is("archived_at", null).order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const [owners, companies, contacts, stages, pipelines, history] = await Promise.all([
    ownerNames(client, rows.map((row) => row.owner_id)),
    client.from("companies").select("id, name").eq("organization_id", organizationId),
    client.from("contacts").select("id, full_name").eq("organization_id", organizationId),
    client.from("pipeline_stages").select("id, name, pipeline_id").eq("organization_id", organizationId),
    client.from("pipelines").select("id, name").eq("organization_id", organizationId),
    client.from("deal_stage_history").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
  ]);
  const companyNames = new Map((companies.data ?? []).map((item) => [item.id, item.name]));
  const contactNames = new Map((contacts.data ?? []).map((item) => [item.id, item.full_name]));
  const stageNames = new Map((stages.data ?? []).map((item) => [item.id, { name: item.name, pipelineId: item.pipeline_id }]));
  const pipelineNames = new Map((pipelines.data ?? []).map((item) => [item.id, item.name]));
  const histories = new Map<string, DealItem["stageHistory"]>();
  for (const item of history.data ?? []) {
    const current = histories.get(item.deal_id) ?? [];
    current.push({ id: item.id, dealId: item.deal_id, fromStageId: item.from_stage_id ?? undefined, toStageId: item.to_stage_id, toStageName: stageNames.get(item.to_stage_id)?.name ?? item.to_stage_id, changedBy: item.changed_by ?? "", changedAt: item.created_at, note: item.note ?? undefined });
    histories.set(item.deal_id, current);
  }
  return rows.map((row) => {
    const stage = stageNames.get(row.stage_id);
    return {
      id: row.id, organizationId: row.organization_id, name: row.name, companyId: row.company_id ?? undefined, companyName: row.company_id ? companyNames.get(row.company_id) : undefined,
      contactId: row.contact_id ?? undefined, contactName: row.contact_id ? contactNames.get(row.contact_id) : undefined, pipelineId: row.pipeline_id, pipelineName: pipelineNames.get(row.pipeline_id) ?? row.pipeline_id,
      stageId: row.stage_id, stageName: stage?.name ?? row.stage_id, value: Number(row.value), formattedValue: `R$ ${Number(row.value).toLocaleString("pt-BR")}`,
      probability: row.probability, ownerId: row.owner_id ?? undefined, ownerName: row.owner_id ? owners.get(row.owner_id) : undefined,
      expectedCloseDate: row.expected_close_date ?? "", status: row.status as DealItem["status"], lossReason: row.loss_reason ?? undefined, lossNote: row.loss_note ?? undefined,
      wonAt: row.won_at ?? undefined, lostAt: row.lost_at ?? undefined, archivedAt: row.archived_at, tags: row.tags, customFields: Object.entries(record(row.custom_fields)).map(([label, value]) => ({ label, value: String(value) })),
      createdAt: row.created_at, updatedAt: row.updated_at, stageHistory: histories.get(row.id) ?? [],
    };
  });
}

export async function createDeal(client: Client, organizationId: string, userId: string, input: Partial<DealItem>) {
  const { data, error } = await client.from("deals").insert({ organization_id: organizationId, created_by: userId, name: input.name?.trim() || "Novo Negócio", company_id: input.companyId || null, contact_id: input.contactId || null, pipeline_id: input.pipelineId!, stage_id: input.stageId!, owner_id: input.ownerId && uuidPattern.test(input.ownerId) ? input.ownerId : userId, value: Number(input.value || 0), currency: "BRL", probability: Number(input.probability ?? 0), status: input.status || "open", expected_close_date: input.expectedCloseDate || null, tags: input.tags ?? [], custom_fields: {} }).select("*").single();
  if (error) throw error;
  return data as DealRow;
}

export async function updateDeal(client: Client, organizationId: string, id: string, input: Partial<DealItem>) {
  const payload: Database["public"]["Tables"]["deals"]["Update"] = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.companyId !== undefined) payload.company_id = input.companyId || null;
  if (input.contactId !== undefined) payload.contact_id = input.contactId || null;
  if (input.ownerId !== undefined && (!input.ownerId || uuidPattern.test(input.ownerId))) payload.owner_id = input.ownerId || null;
  if (input.value !== undefined) payload.value = Number(input.value);
  if (input.expectedCloseDate !== undefined) payload.expected_close_date = input.expectedCloseDate || null;
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.lossReason !== undefined) payload.loss_reason = input.lossReason || null;
  if (input.lossNote !== undefined) payload.loss_note = input.lossNote || null;
  const { data, error } = await client.from("deals").update(payload).eq("id", id).eq("organization_id", organizationId).select("*").single();
  if (error) throw error;
  return data as DealRow;
}

export async function getDeal(client: Client, organizationId: string, id: string) {
  const { data, error } = await client.from("deals").select("*").eq("organization_id", organizationId).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listDealHistory(client: Client, organizationId: string, dealId: string) {
  const { data, error } = await client.from("deal_stage_history").select("*").eq("organization_id", organizationId).eq("deal_id", dealId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
