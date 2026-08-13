import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "../../types/database.types";

type Client = SupabaseClient<Database>;
export type ProductRow = Tables<"products">;
export type ProductInput = Pick<TablesInsert<"products">, "name" | "description" | "sku" | "unit" | "unit_price" | "cost_price" | "status" | "category">;

function validate(input: ProductInput) {
  const name = input.name?.trim();
  const price = Number(input.unit_price ?? 0);
  if (!name) throw new Error("name_required");
  if (!Number.isFinite(price) || price < 0) throw new Error("price_invalid");
  return { ...input, name, unit_price: price, cost_price: input.cost_price == null ? null : Number(input.cost_price), sku: input.sku?.trim() || null, description: input.description?.trim() || null, category: input.category?.trim() || null };
}

export async function listProducts(client: Client, organizationId: string, query?: string, status?: string) {
  let request = client.from("products").select("*").eq("organization_id", organizationId).is("archived_at", null).order("name");
  if (query?.trim()) request = request.ilike("name", `%${query.trim()}%`);
  if (status && status !== "all") request = request.eq("status", status);
  const { data, error } = await request;
  if (error) throw error;
  return data ?? [];
}

export async function createProduct(client: Client, organizationId: string, input: ProductInput) {
  const payload: TablesInsert<"products"> = { ...validate(input), organization_id: organizationId };
  const { data, error } = await client.from("products").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateProduct(client: Client, organizationId: string, id: string, input: Partial<ProductInput>) {
  const payload: TablesUpdate<"products"> = {};
  if (input.name !== undefined) { const name = input.name.trim(); if (!name) throw new Error("name_required"); payload.name = name; }
  if (input.description !== undefined) payload.description = input.description?.trim() || null;
  if (input.sku !== undefined) payload.sku = input.sku?.trim() || null;
  if (input.unit !== undefined) payload.unit = input.unit.trim() || "un";
  if (input.unit_price !== undefined) { const price = Number(input.unit_price); if (!Number.isFinite(price) || price < 0) throw new Error("price_invalid"); payload.unit_price = price; }
  if (input.cost_price !== undefined) payload.cost_price = input.cost_price == null ? null : Number(input.cost_price);
  if (input.status !== undefined) payload.status = input.status;
  if (input.category !== undefined) payload.category = input.category?.trim() || null;
  const { data, error } = await client.from("products").update(payload).eq("id", id).eq("organization_id", organizationId).select("*").single();
  if (error) throw error;
  return data;
}

export async function archiveProduct(client: Client, organizationId: string, id: string) {
  const { data, error } = await client.from("products").update({ archived_at: new Date().toISOString(), status: "inactive" }).eq("id", id).eq("organization_id", organizationId).select("*").single();
  if (error) throw error;
  return data;
}
