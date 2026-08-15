import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/database.types";

type Client = SupabaseClient<Database>;
export type ReportPeriod = "hoje" | "7dias" | "30dias" | "este_mes" | "3_meses" | "personalizado";

export interface ReportQuery {
  period: ReportPeriod;
  pipelineId?: string;
  ownerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReportsSnapshot {
  period: ReportQuery & { startDate: string; endDate: string };
  empty: boolean;
  filters: { pipelines: Array<{ id: string; name: string }>; owners: Array<{ id: string; name: string }> };
  funnel: Array<{ id: string; name: string; color: string; deals: number; value: number }>;
  closed: { won: number; lost: number; wonValue: number; lostValue: number; winRate: number };
  kpis: { revenue: number; forecast: number; averageTicket: number; openPipeline: number };
  leads: { active: number; created: number; converted: number; conversionRate: number };
  proposals: { total: number; sent: number; accepted: number; rejected: number; value: number; acceptanceRate: number };
  tasks: { created: number; completed: number; overdue: number };
  activities: { total: number; completed: number; scheduled: number };
  owners: Array<{ id: string; name: string; deals: number; wonValue: number }>;
  products: { available: boolean; items: number; value: number };
}

function civilToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function validDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function dateRange(query: ReportQuery) {
  const end = validDate(query.endDate) ? query.endDate! : civilToday();
  if (query.period === "personalizado" && validDate(query.startDate)) return { start: query.startDate!, end };
  const date = new Date(`${end}T00:00:00`);
  if (query.period === "hoje") return { start: end, end };
  if (query.period === "7dias") date.setDate(date.getDate() - 6);
  else if (query.period === "30dias") date.setDate(date.getDate() - 29);
  else if (query.period === "3_meses") date.setMonth(date.getMonth() - 3);
  else date.setDate(1);
  return { start: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`, end };
}

const inRange = (value: string | null | undefined, range: { start: string; end: string }) => {
  if (!value) return false;
  const day = value.slice(0, 10);
  return day >= range.start && day <= range.end;
};

export async function getReports(client: Client, organizationId: string, query: ReportQuery): Promise<ReportsSnapshot> {
  const range = dateRange(query);
  const [{ data: deals, error: dealsError }, { data: stages, error: stagesError }, { data: pipelines, error: pipelinesError }, { data: leads, error: leadsError }, { data: proposals, error: proposalsError }, { data: tasks, error: tasksError }, { data: activities, error: activitiesError }] = await Promise.all([
    client.from("deals").select("id,value,probability,status,stage_id,pipeline_id,owner_id,created_at,won_at,lost_at").eq("organization_id", organizationId).is("archived_at", null),
    client.from("pipeline_stages").select("id,name,color,position,pipeline_id").eq("organization_id", organizationId).is("archived_at", null).order("position"),
    client.from("pipelines").select("id,name").eq("organization_id", organizationId).is("archived_at", null).order("name"),
    client.from("leads").select("id,status,owner_id,created_at,converted_at").eq("organization_id", organizationId).is("archived_at", null),
    client.from("proposals").select("id,status,total,created_at").eq("organization_id", organizationId).is("archived_at", null),
    client.from("tasks").select("id,status,due_date,created_at,completed_at").eq("organization_id", organizationId).is("archived_at", null),
    client.from("activities").select("id,status,start_at,created_at").eq("organization_id", organizationId).is("archived_at", null),
  ]);
  const error = dealsError || stagesError || pipelinesError || leadsError || proposalsError || tasksError || activitiesError;
  if (error) throw error;

  const allDeals = (deals ?? []).filter((deal) => (!query.pipelineId || deal.pipeline_id === query.pipelineId) && (!query.ownerId || deal.owner_id === query.ownerId));
  const openDeals = allDeals.filter((deal) => deal.status === "open");
  const won = allDeals.filter((deal) => deal.status === "won" && inRange(deal.won_at ?? deal.created_at, range));
  const lost = allDeals.filter((deal) => deal.status === "lost" && inRange(deal.lost_at ?? deal.created_at, range));
  const closedTotal = won.length + lost.length;
  const today = civilToday();
  const activeLeads = (leads ?? []).filter((lead) => !["converted", "lost"].includes(lead.status));
  const periodLeads = (leads ?? []).filter((lead) => inRange(lead.created_at, range));
  const convertedLeads = (leads ?? []).filter((lead) => inRange(lead.converted_at, range));
  const periodProposals = (proposals ?? []).filter((proposal) => inRange(proposal.created_at, range));
  const periodTasks = (tasks ?? []).filter((task) => inRange(task.created_at, range));
  const periodActivities = (activities ?? []).filter((activity) => inRange(activity.start_at ?? activity.created_at, range));
  const stageMap = new Map((stages ?? []).map((stage) => [stage.id, { id: stage.id, name: stage.name, color: stage.color ?? "#6366F1", deals: 0, value: 0 }]));
  openDeals.forEach((deal) => { const stage = stageMap.get(deal.stage_id); if (stage) { stage.deals += 1; stage.value += Number(deal.value); } });

  const ownerIds = [...new Set(allDeals.map((deal) => deal.owner_id).filter(Boolean))] as string[];
  const { data: profiles } = ownerIds.length ? await client.from("profiles").select("id,full_name").in("id", ownerIds) : { data: [] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name || "Responsável indisponível"]));
  const ownerMap = new Map<string, { id: string; name: string; deals: number; wonValue: number }>();
  allDeals.forEach((deal) => { if (!deal.owner_id) return; const row = ownerMap.get(deal.owner_id) ?? { id: deal.owner_id, name: profileMap.get(deal.owner_id) ?? "Responsável indisponível", deals: 0, wonValue: 0 }; row.deals += 1; if (deal.status === "won") row.wonValue += Number(deal.value); ownerMap.set(deal.owner_id, row); });

  return {
    period: { ...query, startDate: range.start, endDate: range.end }, empty: allDeals.length === 0 && (leads ?? []).length === 0 && (proposals ?? []).length === 0,
    filters: { pipelines: (pipelines ?? []).map((pipeline) => ({ id: pipeline.id, name: pipeline.name })), owners: [...ownerMap.values()].map(({ id, name }) => ({ id, name })) },
    funnel: [...stageMap.values()].sort((a, b) => (stages ?? []).find((stage) => stage.id === a.id)?.position! - (stages ?? []).find((stage) => stage.id === b.id)?.position!),
    closed: { won: won.length, lost: lost.length, wonValue: won.reduce((sum, deal) => sum + Number(deal.value), 0), lostValue: lost.reduce((sum, deal) => sum + Number(deal.value), 0), winRate: closedTotal ? won.length / closedTotal * 100 : 0 },
    kpis: { revenue: won.reduce((sum, deal) => sum + Number(deal.value), 0), forecast: openDeals.reduce((sum, deal) => sum + Number(deal.value) * Number(deal.probability) / 100, 0), averageTicket: won.length ? won.reduce((sum, deal) => sum + Number(deal.value), 0) / won.length : 0, openPipeline: openDeals.reduce((sum, deal) => sum + Number(deal.value), 0) },
    leads: { active: activeLeads.length, created: periodLeads.length, converted: convertedLeads.length, conversionRate: periodLeads.length ? convertedLeads.length / periodLeads.length * 100 : 0 },
    proposals: { total: periodProposals.length, sent: periodProposals.filter((item) => item.status === "sent").length, accepted: periodProposals.filter((item) => item.status === "accepted").length, rejected: periodProposals.filter((item) => item.status === "rejected").length, value: periodProposals.reduce((sum, item) => sum + Number(item.total ?? 0), 0), acceptanceRate: periodProposals.length ? periodProposals.filter((item) => item.status === "accepted").length / periodProposals.length * 100 : 0 },
    tasks: { created: periodTasks.length, completed: periodTasks.filter((item) => item.status === "completed").length, overdue: periodTasks.filter((item) => item.status !== "completed" && Boolean(item.due_date && item.due_date < today)).length },
    activities: { total: periodActivities.length, completed: periodActivities.filter((item) => item.status === "completed").length, scheduled: periodActivities.filter((item) => item.status === "scheduled").length },
    owners: [...ownerMap.values()], products: { available: false, items: 0, value: 0 },
  };
}
