import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json, Tables, TablesInsert } from "../../types/database.types";

type Client = SupabaseClient<Database>;
export type ProposalRow = Tables<"proposals">;
export type ProposalItemRow = Tables<"proposal_items">;
export type ProposalItemInput = { productId?: string | null; description?: string; quantity: number; unitPrice?: number; discount?: number; position?: number };

export async function listProposals(client: Client, organizationId: string, dealId?: string) {
  let request = client.from("proposals").select("*").eq("organization_id", organizationId).is("archived_at", null).order("created_at", { ascending: false });
  if (dealId) request = request.eq("deal_id", dealId);
  const { data: proposals, error } = await request;
  if (error) throw error;
  const rows = proposals ?? [];
  const { data: items, error: itemError } = rows.length ? await client.from("proposal_items").select("*").eq("organization_id", organizationId).in("proposal_id", rows.map((row) => row.id)).order("position") : { data: [], error: null };
  if (itemError) throw itemError;
  return rows.map((proposal) => ({ ...proposal, items: (items ?? []).filter((item) => item.proposal_id === proposal.id) }));
}

export async function getProposal(client: Client, organizationId: string, id: string) {
  const results = await listProposals(client, organizationId, undefined);
  return results.find((proposal) => proposal.id === id) ?? null;
}

export async function createProposal(client: Client, organizationId: string, input: { dealId: string; title: string; currency?: string; validUntil?: string; notes?: string; discount?: number; companyId?: string | null; contactId?: string | null; items: ProposalItemInput[] }) {
  const items: Json[] = input.items.map((item, position) => ({ product_id: item.productId ?? null, description: item.description?.trim() ?? "", quantity: Number(item.quantity), unit_price: item.unitPrice == null ? null : Number(item.unitPrice), discount: Number(item.discount ?? 0), position }));
  const { data, error } = await client.rpc("create_proposal", { target_org: organizationId, target_deal: input.dealId, target_title: input.title.trim(), target_currency: input.currency ?? "BRL", target_valid_until: input.validUntil || null, target_notes: input.notes?.trim() || null, target_discount: Number(input.discount ?? 0), target_company: input.companyId ?? null, target_contact: input.contactId ?? null, target_items: items });
  if (error) throw error;
  const created = Array.isArray(data) ? data[0] : data;
  if (!created) throw new Error("proposal_not_created");
  return getProposal(client, organizationId, created.id);
}

export async function updateProposal(client: Client, organizationId: string, id: string, input: { title?: string; status?: ProposalRow["status"]; validUntil?: string | null; notes?: string | null; discount?: number }) {
  const payload: Partial<TablesInsert<"proposals">> = {};
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.status !== undefined) payload.status = input.status;
  if (input.validUntil !== undefined) payload.valid_until = input.validUntil;
  if (input.notes !== undefined) payload.notes = input.notes;
  if (input.discount !== undefined) payload.discount = Number(input.discount);
  const { data, error } = await client.from("proposals").update(payload).eq("organization_id", organizationId).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function replaceProposalItems(client: Client, organizationId: string, proposalId: string, items: ProposalItemInput[]) {
  const payload: Json[] = items.map((item, position) => ({ product_id: item.productId ?? null, description: item.description?.trim() ?? "", quantity: Number(item.quantity), unit_price: item.unitPrice == null ? null : Number(item.unitPrice), discount: Number(item.discount ?? 0), position }));
  const { data, error } = await client.rpc("replace_proposal_items", { target_org: organizationId, target_proposal: proposalId, target_items: payload });
  if (error) throw error;
  return getProposal(client, organizationId, Array.isArray(data) ? data[0]?.id : data?.id ?? proposalId);
}

export async function archiveProposal(client: Client, organizationId: string, id: string) {
  const { data, error } = await client.from("proposals").update({ archived_at: new Date().toISOString() }).eq("organization_id", organizationId).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}
