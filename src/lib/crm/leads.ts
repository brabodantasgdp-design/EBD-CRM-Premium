import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../types/database.types";
import type { LeadItem, LeadStatus, LeadSourceType } from "../../types/crm";

type Client = SupabaseClient<Database>;
type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asRecord(value: Json): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function mapLead(row: LeadRow, ownerName?: string): LeadItem {
  const names = row.name.trim().split(/\s+/);
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    firstName: names[0],
    lastName: names.slice(1).join(" "),
    company: row.company_name ?? "",
    companyName: row.company_name ?? undefined,
    email: row.email ?? "",
    phone: row.phone ?? "",
    status: row.status as LeadStatus,
    source: (row.source || "Site") as LeadSourceType,
    ownerId: row.owner_id ?? "",
    ownerName: ownerName || row.owner_id || "Sem responsável",
    score: row.score ?? 0,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    archived: Boolean(row.archived_at),
    convertedAt: row.converted_at ?? undefined,
    convertedContactId: row.converted_contact_id ?? undefined,
    convertedCompanyId: row.converted_company_id ?? undefined,
    convertedDealId: row.converted_deal_id ?? undefined,
    customFields: Object.entries(asRecord(row.custom_fields)).map(([label, value]) => ({ label, value: String(value) })),
    lastActivityText: row.converted_at ? "Convertido em negócio" : "Sem atividade",
    nextTaskText: "Nenhuma",
  };
}

async function ownerNames(client: Client, ids: (string | null)[]) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return new Map<string, string>();
  const { data } = await client.from("profiles").select("id, full_name").in("id", unique);
  return new Map((data ?? []).map((profile) => [profile.id, profile.full_name || profile.id]));
}

export async function listLeads(client: Client, organizationId: string) {
  const { data, error } = await client.from("leads").select("*").eq("organization_id", organizationId).is("archived_at", null).order("created_at", { ascending: false });
  if (error) throw error;
  const names = await ownerNames(client, (data ?? []).map((row) => row.owner_id));
  return (data ?? []).map((row) => mapLead(row, row.owner_id ? names.get(row.owner_id) : undefined));
}

export async function getLead(client: Client, organizationId: string, id: string) {
  const { data, error } = await client.from("leads").select("*").eq("organization_id", organizationId).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapLead(data) : null;
}

export async function createLead(client: Client, organizationId: string, userId: string, input: Partial<LeadItem>) {
  const { data, error } = await client.from("leads").insert({ organization_id: organizationId, created_by: userId, name: input.name?.trim() || "Novo Lead", company_name: (input.companyName || input.company || "").trim() || null, email: input.email?.trim() || null, phone: input.phone?.trim() || null, status: input.status || "new", source: input.source || "Site", owner_id: input.ownerId && uuidPattern.test(input.ownerId) ? input.ownerId : userId, score: input.score ?? null, tags: input.tags ?? [], custom_fields: {} }).select("*").single();
  if (error) throw error;
  return mapLead(data);
}

export async function updateLead(client: Client, organizationId: string, id: string, input: Partial<LeadItem>) {
  const payload: Database["public"]["Tables"]["leads"]["Update"] = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.company !== undefined || input.companyName !== undefined) payload.company_name = (input.companyName || input.company || "").trim() || null;
  if (input.email !== undefined) payload.email = input.email.trim() || null;
  if (input.phone !== undefined) payload.phone = input.phone.trim() || null;
  if (input.status !== undefined) payload.status = input.status;
  if (input.source !== undefined) payload.source = input.source;
  if (input.ownerId !== undefined && (!input.ownerId || uuidPattern.test(input.ownerId))) payload.owner_id = input.ownerId || null;
  if (input.score !== undefined) payload.score = input.score;
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.archivedAt !== undefined) payload.archived_at = input.archivedAt ?? null;
  const { data, error } = await client.from("leads").update(payload).eq("organization_id", organizationId).eq("id", id).select("*").single();
  if (error) throw error;
  return mapLead(data);
}

export async function archiveLead(client: Client, organizationId: string, id: string) {
  return updateLead(client, organizationId, id, { archivedAt: new Date().toISOString() });
}

export async function bulkUpdateLeads(client: Client, organizationId: string, ids: string[], input: Partial<LeadItem>) {
  if (!ids.length) return [];
  const payload: Database["public"]["Tables"]["leads"]["Update"] = {};
  if (input.status !== undefined) payload.status = input.status;
  if (input.ownerId !== undefined && (!input.ownerId || uuidPattern.test(input.ownerId))) payload.owner_id = input.ownerId || null;
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.archivedAt !== undefined) payload.archived_at = input.archivedAt ?? null;
  const { data, error } = await client.from("leads").update(payload).eq("organization_id", organizationId).in("id", ids).select("*");
  if (error) throw error;
  return (data ?? []).map((row) => mapLead(row));
}

export async function convertLead(client: Client, input: { leadId: string; pipelineId: string; stageId: string; companyName?: string; contactName?: string; dealName?: string; value?: number }) {
  const { data, error } = await client.rpc("convert_lead", { target_lead: input.leadId, target_pipeline: input.pipelineId, target_stage: input.stageId, target_company_name: input.companyName || null, target_contact_name: input.contactName || null, target_deal_name: input.dealName || null, target_value: input.value ?? 0 });
  if (error) throw error;
  return data;
}
