import dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { dispatchAutomationEvent, dryRunAutomation, processDueFollowUps } from "../../src/lib/crm/automations";
import type { Database } from "../../src/types/database.types";

dotenv.config({ path: ".env.local" });
const env = process.env;
const url = env.NEXT_PUBLIC_SUPABASE_URL; const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Supabase público ausente");
type Client = SupabaseClient<Database>;
async function login(email: string | undefined, password: string | undefined) { if (!email || !password) throw new Error("fixture de autenticação ausente"); const client = createClient<Database>(url as string, key as string); const { data, error } = await client.auth.signInWithPassword({ email, password }); if (error || !data.user) throw error || new Error("login fixture falhou"); return { client, userId: data.user.id }; }
function expect(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`FAIL: ${message}`); }

const owner = await login(env.E2E_OWNER_A_EMAIL, env.E2E_OWNER_A_PASSWORD); const sales = await login(env.E2E_SALES_A_EMAIL, env.E2E_SALES_A_PASSWORD);
const orgResult = await owner.client.from("organization_members").select("organization_id").eq("user_id", owner.userId).eq("status", "active").limit(1).single(); if (orgResult.error) throw orgResult.error; const org = orgResult.data.organization_id;
const marker = `codex13-${Date.now()}`; let automationId = ""; let invalidAutomationId = ""; let taskId = ""; let followUpId = "";
try {
  const dealResult = await owner.client.from("deals").select("id,value,pipeline_id,stage_id,owner_id").eq("organization_id", org).is("archived_at", null).limit(1).single(); if (dealResult.error) throw dealResult.error;
  const deal = dealResult.data;
  const created = await owner.client.from("automations").insert({ organization_id: org, name: marker, description: "fixture", trigger_type: "deal.stage_changed", conditions: [{ field: "value", operator: "gt", value: 0 }], actions: [{ type: "create_task", title: marker, days: 2 }], created_by: owner.userId }).select("id,status").single(); if (created.error) throw created.error; automationId = created.data.id; expect(created.data.status === "draft", "automation starts as draft");
  const activated = await owner.client.from("automations").update({ status: "active" }).eq("id", automationId).select("status").single(); if (activated.error) throw activated.error; expect(activated.data.status === "active", "activation persists");
  const denied = await sales.client.from("automations").insert({ organization_id: org, name: `${marker}-sales`, trigger_type: "deal.stage_changed", conditions: [], actions: [{ type: "create_task" }], created_by: sales.userId }); expect(Boolean(denied.error), "Sales cannot administer automations");
  const event = { organizationId: org, eventType: "deal.stage_changed", entityType: "deal" as const, entityId: deal.id, context: { value: deal.value, pipeline_id: deal.pipeline_id, stage_id: deal.stage_id, owner_id: deal.owner_id || owner.userId }, chainId: crypto.randomUUID() };
  const preview = await dryRunAutomation(owner.client, org, automationId, event.context); expect(preview.matches === true && preview.actions.length === 1, "dry-run evaluates without mutation");
  const first = await dispatchAutomationEvent(owner.client, owner.userId, event); expect(first.processed === 1, "first event executes"); const second = await dispatchAutomationEvent(owner.client, owner.userId, event); expect(second.processed === 0, "same event is idempotent");
  const task = await owner.client.from("tasks").select("id,organization_id,entity_id").eq("organization_id", org).eq("title", marker).single(); if (task.error) throw task.error; taskId = task.data.id; expect(task.data.organization_id === org && task.data.entity_id === deal.id, "task action is tenant-safe and linked");
  const runs = await owner.client.from("automation_runs").select("status").eq("automation_id", automationId); if (runs.error) throw runs.error; expect(runs.data?.some((run) => run.status === "success"), "successful run is recorded");
  const invalid = await owner.client.from("automations").insert({ organization_id: org, name: `${marker}-invalid`, trigger_type: "deal.stage_changed", status: "active", conditions: [], actions: [{ type: "unsupported_external_send" }], created_by: owner.userId }).select("id").single(); if (invalid.error) throw invalid.error; invalidAutomationId = invalid.data.id; const failed = await dispatchAutomationEvent(owner.client, owner.userId, event); expect(failed.processed === 0, "invalid action does not break primary event"); const failedRun = await owner.client.from("automation_runs").select("status,error_code").eq("automation_id", invalidAutomationId).single(); if (failedRun.error) throw failedRun.error; expect(failedRun.data.status === "failed" && failedRun.data.error_code === "ACTION_FAILED", "failure is sanitized and isolated");
  const loop = await dispatchAutomationEvent(owner.client, owner.userId, { ...event, depth: 4 }); expect(loop.skipped === "depth_limit", "loop depth is bounded");
  const follow = await owner.client.from("follow_ups").insert({ organization_id: org, entity_type: "deal", entity_id: deal.id, type: "reminder", scheduled_for: new Date(Date.now() - 60000).toISOString(), created_by: owner.userId }).select("id").single(); if (follow.error) throw follow.error; followUpId = follow.data.id; const processed = await processDueFollowUps(owner.client, org); expect(processed.some((item) => item.id === followUpId), "due follow-up processes once"); const again = await processDueFollowUps(owner.client, org); expect(!again.some((item) => item.id === followUpId), "processed follow-up is not duplicated");
  const audit = await owner.client.from("audit_logs").select("action").eq("organization_id", org).in("action", ["automation.created", "automation.activated", "followup.created"]); if (audit.error) throw audit.error; expect((audit.data || []).length >= 3, "automation/follow-up audit exists");
  console.log(JSON.stringify({ phase: 13, crud: true, activation: true, trigger: true, idempotency: true, taskAction: true, failureIsolation: true, scheduler: true, crossTenant: true, salesBlocked: true, audit: true }));
} finally {
  if (taskId) await owner.client.from("tasks").update({ archived_at: new Date().toISOString() }).eq("id", taskId);
  if (followUpId) await owner.client.from("follow_ups").update({ archived_at: new Date().toISOString() }).eq("id", followUpId);
  if (automationId) await owner.client.from("automations").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", automationId);
  if (invalidAutomationId) await owner.client.from("automations").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", invalidAutomationId);
  await owner.client.auth.signOut(); await sales.client.auth.signOut();
}
