import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import type { TaskItem } from "../../types/crm";

type Client = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["tasks"]["Row"];

function mapTask(row: Row, resolvedOwnerName?: string): TaskItem {
  const ownerName = row.owner_id ? (resolvedOwnerName || "Responsável indisponível") : "Sem responsável";
  return { id: row.id, organizationId: row.organization_id, title: row.title, description: row.description || undefined, status: row.status as TaskItem["status"], priority: (row.priority || "medium") as TaskItem["priority"], ownerId: row.owner_id || "", ownerName, dueDate: row.due_date || (row.due_at ? row.due_at.slice(0, 10) : ""), dueTime: row.due_at ? new Date(row.due_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }) : undefined, entityType: row.entity_type as TaskItem["entityType"], entityId: row.entity_id || undefined, createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at, completedAt: row.completed_at, archivedAt: row.archived_at };
}

async function ownerNames(client: Client, ids: (string | null)[]) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return new Map<string, string>();
  const { data } = await client.from("profiles").select("id, full_name").in("id", unique);
  return new Map((data || []).map((item) => [item.id, item.full_name || "Responsável indisponível"]));
}

async function ownerName(client: Client, id: string | null) {
  if (!id) return undefined;
  return (await ownerNames(client, [id])).get(id);
}

export async function listTasks(client: Client, organizationId: string) {
  const { data, error } = await client.from("tasks").select("*").eq("organization_id", organizationId).is("archived_at", null).order("due_date", { ascending: true });
  if (error) throw error;
  const names = await ownerNames(client, (data || []).map((row) => row.owner_id));
  return (data || []).map((row) => mapTask(row, row.owner_id ? names.get(row.owner_id) : undefined));
}

export async function getTask(client: Client, organizationId: string, id: string) {
  const { data, error } = await client.from("tasks").select("*").eq("organization_id", organizationId).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapTask(data, await ownerName(client, data.owner_id)) : null;
}

export async function createTask(client: Client, organizationId: string, userId: string, input: Partial<TaskItem>) {
  const { data, error } = await client.from("tasks").insert({ organization_id: organizationId, created_by: userId, title: input.title?.trim() || "Nova tarefa", description: input.description || null, status: "pending", priority: input.priority || "medium", due_date: input.dueDate || null, due_at: input.dueTime && input.dueDate ? `${input.dueDate}T${input.dueTime}:00` : null, owner_id: input.ownerId || userId, entity_type: input.entityType || null, entity_id: input.entityId || null }).select("*").single();
  if (error) throw error;
  return mapTask(data, await ownerName(client, data.owner_id));
}

export async function updateTask(client: Client, organizationId: string, id: string, input: Partial<TaskItem>) {
  const payload: Database["public"]["Tables"]["tasks"]["Update"] = {};
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.description !== undefined) payload.description = input.description || null;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.dueDate !== undefined) payload.due_date = input.dueDate || null;
  if (input.dueTime !== undefined || input.dueDate !== undefined) payload.due_at = input.dueDate && input.dueTime ? `${input.dueDate}T${input.dueTime}:00` : null;
  if (input.ownerId !== undefined) payload.owner_id = input.ownerId || null;
  const { data, error } = await client.from("tasks").update(payload).eq("organization_id", organizationId).eq("id", id).select("*").single();
  if (error) throw error;
  return mapTask(data, await ownerName(client, data.owner_id));
}

export async function completeTask(client: Client, organizationId: string, id: string) { return changeStatus(client, organizationId, id, "completed", new Date().toISOString()); }
export async function reopenTask(client: Client, organizationId: string, id: string) { return changeStatus(client, organizationId, id, "pending", null); }
async function changeStatus(client: Client, organizationId: string, id: string, status: string, completedAt: string | null) {
  const { data, error } = await client.from("tasks").update({ status, completed_at: completedAt }).eq("organization_id", organizationId).eq("id", id).select("*").single();
  if (error) throw error;
  return mapTask(data, await ownerName(client, data.owner_id));
}
export async function archiveTask(client: Client, organizationId: string, id: string) { const { data, error } = await client.from("tasks").update({ archived_at: new Date().toISOString() }).eq("organization_id", organizationId).eq("id", id).select("*").single(); if (error) throw error; return mapTask(data, await ownerName(client, data.owner_id)); }
export async function bulkUpdateTasks(client: Client, organizationId: string, ids: string[], updates: Database["public"]["Tables"]["tasks"]["Update"]) { const { data, error } = await client.from("tasks").update(updates).eq("organization_id", organizationId).in("id", ids).select("*"); if (error) throw error; return data || []; }
