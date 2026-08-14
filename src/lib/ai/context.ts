import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";

type Client = SupabaseClient<Database>;
export type EntityType = "lead" | "contact" | "company" | "deal";
export type CopilotContext = { organizationId: string; entityType?: EntityType; entityId?: string; facts: Array<{ source: string; data: Record<string, unknown> }>; contextUsed: string[] };
const safe = (value: unknown) => typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
const trim = (value: string | null | undefined, max = 500) => (value || "").slice(0, max);

export async function buildEntityContext(client: Client, organizationId: string, entityType: EntityType, entityId: string): Promise<CopilotContext> {
  const facts: CopilotContext["facts"] = [];
  if (entityType === "deal") {
    const { data: deal, error } = await client.from("deals").select("id,name,value,currency,probability,status,pipeline_id,stage_id,expected_close_date,owner_id,company_id,contact_id,created_at,updated_at").eq("organization_id", organizationId).eq("id", entityId).maybeSingle(); if (error || !deal) throw new Error("entity_not_found");
    facts.push({ source: "deal", data: { ...deal, name: trim(deal.name) } });
    const [{ data: stages }, { data: pipeline }, { data: activities }, { data: tasks }, { data: proposals }, { data: history }] = await Promise.all([
      client.from("pipeline_stages").select("id,name,position,probability").eq("organization_id", organizationId).eq("pipeline_id", deal.pipeline_id).is("archived_at", null),
      client.from("pipelines").select("id,name").eq("organization_id", organizationId).eq("id", deal.pipeline_id).maybeSingle(),
      client.from("activities").select("type,title,status,start_at").eq("organization_id", organizationId).eq("entity_type", "deal").eq("entity_id", entityId).is("archived_at", null).order("start_at", { ascending: false }).limit(10),
      client.from("tasks").select("title,status,priority,due_date").eq("organization_id", organizationId).eq("entity_type", "deal").eq("entity_id", entityId).is("archived_at", null).order("due_date", { ascending: true }).limit(10),
      client.from("proposals").select("number,status,total,valid_until").eq("organization_id", organizationId).eq("deal_id", entityId).is("archived_at", null).limit(10),
      client.from("deal_stage_history").select("from_stage_id,to_stage_id,created_at,note").eq("organization_id", organizationId).eq("deal_id", entityId).order("created_at", { ascending: false }).limit(10),
    ]); facts.push({ source: "deal_relations", data: { pipeline: safe(pipeline), stages: stages || [], activities: activities || [], tasks: tasks || [], proposals: proposals || [], stageHistory: history || [] } });
  } else {
    let entity: Record<string, unknown> | null = null; let entityError = false;
    if (entityType === "lead") { const result = await client.from("leads").select("id,name,company_name,email,phone,status,source,score,owner_id,tags,converted_at,created_at,updated_at").eq("organization_id", organizationId).eq("id", entityId).maybeSingle(); entity = result.data as Record<string, unknown> | null; entityError = Boolean(result.error); }
    if (entityType === "company") { const result = await client.from("companies").select("id,name,legal_name,domain,segment,size,status,owner_id,tags,created_at,updated_at").eq("organization_id", organizationId).eq("id", entityId).maybeSingle(); entity = result.data as Record<string, unknown> | null; entityError = Boolean(result.error); }
    if (entityType === "contact") { const result = await client.from("contacts").select("id,full_name,email,phone,job_title,company_id,lifecycle_status,owner_id,tags,created_at,updated_at").eq("organization_id", organizationId).eq("id", entityId).maybeSingle(); entity = result.data as Record<string, unknown> | null; entityError = Boolean(result.error); }
    if (entityError || !entity) throw new Error("entity_not_found"); facts.push({ source: entityType, data: entity });
    const [{ data: activities }, { data: tasks }] = await Promise.all([
      client.from("activities").select("type,title,status,start_at").eq("organization_id", organizationId).eq("entity_type", entityType).eq("entity_id", entityId).is("archived_at", null).order("start_at", { ascending: false }).limit(10),
      client.from("tasks").select("title,status,priority,due_date").eq("organization_id", organizationId).eq("entity_type", entityType).eq("entity_id", entityId).is("archived_at", null).order("due_date", { ascending: true }).limit(10),
    ]); facts.push({ source: `${entityType}_relations`, data: { activities: activities || [], tasks: tasks || [] } });
  }
  return { organizationId, entityType, entityId, facts, contextUsed: facts.map((fact) => fact.source) };
}

export async function buildGlobalContext(client: Client, organizationId: string): Promise<CopilotContext> {
  const [{ data: deals }, { data: leads }, { data: tasks }, { data: activities }] = await Promise.all([
    client.from("deals").select("id,name,value,status,probability,expected_close_date,stage_id").eq("organization_id", organizationId).eq("status", "open").is("archived_at", null).order("value", { ascending: false }).limit(20),
    client.from("leads").select("id,name,status,source,score").eq("organization_id", organizationId).is("archived_at", null).limit(20),
    client.from("tasks").select("title,status,due_date,priority").eq("organization_id", organizationId).eq("status", "pending").is("archived_at", null).order("due_date").limit(20),
    client.from("activities").select("type,title,status,start_at").eq("organization_id", organizationId).is("archived_at", null).order("start_at", { ascending: false }).limit(20),
  ]); return { organizationId, facts: [{ source: "open_deals", data: { items: deals || [] } }, { source: "leads", data: { items: leads || [] } }, { source: "pending_tasks", data: { items: tasks || [] } }, { source: "recent_activities", data: { items: activities || [] } }], contextUsed: ["open_deals", "leads", "pending_tasks", "recent_activities"] };
}
