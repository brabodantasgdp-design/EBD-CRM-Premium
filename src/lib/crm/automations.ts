import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json, Tables, TablesInsert, TablesUpdate } from "../../types/database.types";

type Client = SupabaseClient<Database>;
type Automation = Tables<"automations">;
type Run = Tables<"automation_runs">;
type FollowUp = Tables<"follow_ups">;

export type AutomationCondition = { field: "value" | "probability" | "pipeline_id" | "stage_id" | "owner_id" | "source"; operator: "gt" | "gte" | "lt" | "lte" | "eq"; value: string | number };
export type AutomationAction = { type: "create_task" | "create_activity" | "create_follow_up" | "message_draft"; title?: string; description?: string; days?: number; channel?: string; content?: string; activityType?: "meeting" | "call" | "email" | "note" | "follow_up" };
export type AutomationEvent = { organizationId: string; eventType: string; entityType: "deal" | "lead" | "task" | "activity" | "proposal"; entityId: string; context: Record<string, unknown>; chainId?: string; depth?: number };

const triggerTypes = ["deal.stage_changed", "deal.won", "deal.lost", "lead.created", "lead.converted", "task.overdue", "activity.completed", "proposal.accepted", "proposal.expired"] as const;
const actionTypes = ["create_task", "create_activity", "create_follow_up", "message_draft"] as const;

function asJson(value: unknown): Json { return value as Json; }
function validateConditions(value: unknown): AutomationCondition[] {
  if (!Array.isArray(value)) throw new Error("conditions_invalid");
  return value.map((condition) => {
    const item = condition as AutomationCondition;
    if (!["value", "probability", "pipeline_id", "stage_id", "owner_id", "source"].includes(item.field) || !["gt", "gte", "lt", "lte", "eq"].includes(item.operator) || (typeof item.value !== "string" && typeof item.value !== "number")) throw new Error("condition_invalid");
    return item;
  });
}
function validateActions(value: unknown): AutomationAction[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error("actions_required");
  return value.map((action) => {
    const item = action as AutomationAction;
    if (!actionTypes.includes(item.type)) throw new Error("action_invalid");
    if (item.days !== undefined && (!Number.isInteger(item.days) || item.days < 0 || item.days > 365)) throw new Error("days_invalid");
    if (item.type === "message_draft" && !item.content?.trim()) throw new Error("message_content_required");
    return item;
  });
}

export async function listAutomations(client: Client, organizationId: string) {
  const { data, error } = await client.from("automations").select("*").eq("organization_id", organizationId).is("archived_at", null).order("created_at", { ascending: false });
  if (error) throw error; return data ?? [];
}
export async function createAutomation(client: Client, organizationId: string, userId: string, input: { name: string; description?: string; triggerType: string; conditions?: unknown; actions: unknown }) {
  const name = input.name.trim(); if (!name || !triggerTypes.includes(input.triggerType as typeof triggerTypes[number])) throw new Error("automation_invalid");
  const conditions = validateConditions(input.conditions ?? []); const actions = validateActions(input.actions);
  const payload: TablesInsert<"automations"> = { organization_id: organizationId, name, description: input.description?.trim() || null, trigger_type: input.triggerType, conditions: asJson(conditions), actions: asJson(actions), created_by: userId };
  const { data, error } = await client.from("automations").insert(payload).select("*").single(); if (error) throw error; return data;
}
export async function updateAutomation(client: Client, organizationId: string, id: string, input: { name?: string; description?: string; triggerType?: string; conditions?: unknown; actions?: unknown; status?: string }) {
  const payload: TablesUpdate<"automations"> = {};
  if (input.name !== undefined) { if (!input.name.trim()) throw new Error("name_required"); payload.name = input.name.trim(); }
  if (input.description !== undefined) payload.description = input.description.trim() || null;
  if (input.triggerType !== undefined) { if (!triggerTypes.includes(input.triggerType as typeof triggerTypes[number])) throw new Error("trigger_invalid"); payload.trigger_type = input.triggerType; }
  if (input.conditions !== undefined) payload.conditions = asJson(validateConditions(input.conditions));
  if (input.actions !== undefined) payload.actions = asJson(validateActions(input.actions));
  if (input.status !== undefined) { if (!["draft", "active", "paused", "archived"].includes(input.status)) throw new Error("status_invalid"); payload.status = input.status; if (input.status === "archived") payload.archived_at = new Date().toISOString(); }
  const { data, error } = await client.from("automations").update(payload).eq("id", id).eq("organization_id", organizationId).select("*").single(); if (error) throw error; return data;
}
export async function listRuns(client: Client, organizationId: string, automationId?: string) {
  let query = client.from("automation_runs").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100);
  if (automationId) query = query.eq("automation_id", automationId);
  const { data, error } = await query; if (error) throw error; return data ?? [];
}
function compare(actual: unknown, condition: AutomationCondition) { const expected = condition.value; if (condition.operator === "eq") return String(actual) === String(expected); const a = Number(actual); const b = Number(expected); if (!Number.isFinite(a) || !Number.isFinite(b)) return false; return condition.operator === "gt" ? a > b : condition.operator === "gte" ? a >= b : condition.operator === "lt" ? a < b : a <= b; }
function conditionsMatch(conditions: AutomationCondition[], context: Record<string, unknown>) { return conditions.every((condition) => compare(context[condition.field], condition)); }

export async function dryRunAutomation(client: Client, organizationId: string, id: string, context: Record<string, unknown>) {
  const { data, error } = await client.from("automations").select("*").eq("id", id).eq("organization_id", organizationId).single(); if (error) throw error;
  const conditions = (data.conditions ?? []) as AutomationCondition[]; const actions = (data.actions ?? []) as AutomationAction[];
  return { matches: conditionsMatch(conditions, context), trigger: data.trigger_type, conditions, actions };
}

async function runAction(client: Client, event: AutomationEvent, automation: Automation, action: AutomationAction, userId: string) {
  const days = action.days ?? 0; const when = new Date(Date.now() + days * 86400000).toISOString();
  if (action.type === "create_task") {
    const { data, error } = await client.from("tasks").insert({ organization_id: event.organizationId, title: action.title?.trim() || automation.name, description: action.description?.trim() || null, status: "pending", due_date: when.slice(0, 10), due_at: when, owner_id: (event.context.owner_id as string) || userId, created_by: userId, entity_type: event.entityType === "deal" || event.entityType === "lead" ? event.entityType : null, entity_id: event.entityType === "deal" || event.entityType === "lead" ? event.entityId : null }).select("id").single();
    if (error) throw new Error("task_action_failed"); return { type: action.type, id: data.id };
  }
  if (action.type === "create_activity") {
    const { data, error } = await client.from("activities").insert({ organization_id: event.organizationId, type: action.activityType || "follow_up", title: action.title?.trim() || automation.name, description: action.description?.trim() || null, status: "scheduled", start_at: when, owner_id: (event.context.owner_id as string) || userId, created_by: userId, entity_type: event.entityType === "deal" || event.entityType === "lead" ? event.entityType : null, entity_id: event.entityType === "deal" || event.entityType === "lead" ? event.entityId : null }).select("id").single();
    if (error) throw new Error("activity_action_failed"); return { type: action.type, id: data.id };
  }
  if (action.type === "create_follow_up") {
    const { data, error } = await client.from("follow_ups").insert({ organization_id: event.organizationId, entity_type: event.entityType === "deal" || event.entityType === "lead" ? event.entityType : "deal", entity_id: event.entityId, type: "reminder", status: "scheduled", scheduled_for: when, owner_id: (event.context.owner_id as string) || userId, created_by: userId, source: "automation", automation_id: automation.id, payload: { title: action.title || automation.name } }).select("id").single();
    if (error) throw new Error("follow_up_action_failed"); return { type: action.type, id: data.id };
  }
  return { type: action.type, draft: { channel: action.channel || "internal", content: action.content, entityType: event.entityType, entityId: event.entityId, createdBy: userId } };
}

export async function dispatchAutomationEvent(client: Client, userId: string, event: AutomationEvent) {
  const depth = event.depth ?? 0; if (depth > 3) return { processed: 0, skipped: "depth_limit" };
  const { data: automations, error } = await client.from("automations").select("*").eq("organization_id", event.organizationId).eq("status", "active").is("archived_at", null).eq("trigger_type", event.eventType);
  if (error) throw error; let processed = 0;
  for (const automation of automations ?? []) {
    const idempotencyKey = `${event.eventType}:${event.entityType}:${event.entityId}:${event.chainId || "root"}`;
    const { data: existing } = await client.from("automation_runs").select("id,status").eq("organization_id", event.organizationId).eq("automation_id", automation.id).eq("idempotency_key", idempotencyKey).maybeSingle();
    if (existing) continue;
    const conditions = (automation.conditions ?? []) as AutomationCondition[];
    const runInsert: TablesInsert<"automation_runs"> = { organization_id: event.organizationId, automation_id: automation.id, trigger_entity_type: event.entityType, trigger_entity_id: event.entityId, event_type: event.eventType, idempotency_key: idempotencyKey, event_chain_id: event.chainId || crypto.randomUUID(), depth, status: conditionsMatch(conditions, event.context) ? "running" : "skipped", started_at: new Date().toISOString(), context: asJson(event.context) };
    const { data: run, error: runError } = await client.from("automation_runs").insert(runInsert).select("*").single();
    if (runError || !run) { if (runError?.code === "23505") continue; throw runError; }
    if (run.status === "skipped") { await client.from("automation_runs").update({ finished_at: new Date().toISOString(), result: { reason: "conditions_not_met" } }).eq("id", run.id); continue; }
    try { const result = []; for (const action of validateActions(automation.actions)) result.push(await runAction(client, event, automation, action, userId)); await client.from("automation_runs").update({ status: "success", finished_at: new Date().toISOString(), result: asJson({ actions: result }) }).eq("id", run.id); processed += 1; }
    catch { await client.from("automation_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_code: "ACTION_FAILED", error_message_sanitized: "A ação não pôde ser executada." }).eq("id", run.id); }
  }
  return { processed };
}

export async function retryAutomationRun(client: Client, userId: string, organizationId: string, runId: string) {
  const { data: run, error } = await client.from("automation_runs").select("*").eq("id", runId).eq("organization_id", organizationId).single();
  if (error || !run || run.status !== "failed" || run.attempt >= 3) throw new Error("retry_not_allowed");
  const { data: automation, error: automationError } = await client.from("automations").select("*").eq("id", run.automation_id).eq("organization_id", organizationId).single();
  if (automationError || !automation) throw new Error("automation_not_found");
  await client.from("automation_runs").update({ status: "running", attempt: run.attempt + 1, started_at: new Date().toISOString(), error_code: null, error_message_sanitized: null }).eq("id", run.id);
  try {
    const event: AutomationEvent = { organizationId, eventType: run.event_type, entityType: run.trigger_entity_type as AutomationEvent["entityType"], entityId: run.trigger_entity_id, context: (run.context || {}) as Record<string, unknown>, chainId: run.event_chain_id, depth: run.depth };
    const results = []; for (const action of validateActions(automation.actions)) results.push(await runAction(client, event, automation, action, userId));
    const { data: updated } = await client.from("automation_runs").update({ status: "success", finished_at: new Date().toISOString(), result: asJson({ actions: results }) }).eq("id", run.id).select("*").single(); return updated;
  } catch { await client.from("automation_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_code: "ACTION_FAILED", error_message_sanitized: "A ação não pôde ser executada." }).eq("id", run.id); throw new Error("retry_failed"); }
}

export async function listFollowUps(client: Client, organizationId: string) { const { data, error } = await client.from("follow_ups").select("*").eq("organization_id", organizationId).is("archived_at", null).order("scheduled_for", { ascending: true }); if (error) throw error; return data ?? []; }
export async function createFollowUp(client: Client, organizationId: string, userId: string, input: { entityType: "lead" | "contact" | "company" | "deal"; entityId: string; type: "task" | "activity" | "reminder" | "message_draft"; scheduledFor: string; ownerId?: string; payload?: Record<string, unknown> }) { const { data, error } = await client.from("follow_ups").insert({ organization_id: organizationId, entity_type: input.entityType, entity_id: input.entityId, type: input.type, scheduled_for: input.scheduledFor, owner_id: input.ownerId || userId, created_by: userId, payload: asJson(input.payload || {}) }).select("*").single(); if (error) throw error; return data; }
export async function updateFollowUp(client: Client, organizationId: string, id: string, status: "completed" | "cancelled") { const { data, error } = await client.from("follow_ups").update({ status, completed_at: status === "completed" ? new Date().toISOString() : null, cancelled_at: status === "cancelled" ? new Date().toISOString() : null }).eq("organization_id", organizationId).eq("id", id).select("*").single(); if (error) throw error; return data; }
export async function processDueFollowUps(client: Client, organizationId: string, limit = 50) { const { data, error } = await client.from("follow_ups").update({ processed_at: new Date().toISOString(), processing_attempts: 1, status: "completed", completed_at: new Date().toISOString() }).eq("organization_id", organizationId).eq("status", "scheduled").is("processed_at", null).lte("scheduled_for", new Date().toISOString()).is("archived_at", null).limit(limit).select("id"); if (error) throw error; return data ?? []; }
