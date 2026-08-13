import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/database.types";

type Client = SupabaseClient<Database>;
export type DashboardPeriod = "hoje" | "7dias" | "30dias" | "este_mes";

export interface DashboardMetricsSnapshot {
  openPipeline: number;
  forecast: number;
  wonDeals: number;
  wonRevenue: number;
  winRate: number;
  averageTicket: number;
  activeLeads: number;
  newLeads: number;
  convertedLeads: number;
  pendingTasks: number;
  overdueTasks: number;
  todayTasks: number;
  todayActivities: number;
  nextActivities: number;
  pipelineStages: Array<{ id: string; name: string; position: number; color: string; dealsCount: number; totalValue: number }>;
  revenueHistory: Array<{ periodLabel: string; receita: number; receitaAnterior: number; negocios: number; negociosAnterior: number }>;
}

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function periodStart(period: DashboardPeriod) {
  const date = new Date(`${localDate()}T00:00:00`);
  if (period === "hoje") return localDate();
  if (period === "7dias") date.setDate(date.getDate() - 6);
  else if (period === "30dias") date.setDate(date.getDate() - 29);
  else if (period === "este_mes") date.setDate(1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function getDashboardMetrics(client: Client, organizationId: string, period: DashboardPeriod = "este_mes"): Promise<DashboardMetricsSnapshot> {
  const today = localDate();
  const start = periodStart(period);
  const [{ data: deals, error: dealsError }, { data: stages, error: stagesError }, { data: leads, error: leadsError }, { data: tasks, error: tasksError }, { data: activities, error: activitiesError }] = await Promise.all([
    client.from("deals").select("id, value, probability, status, stage_id, won_at, lost_at, created_at, updated_at").eq("organization_id", organizationId).is("archived_at", null),
    client.from("pipeline_stages").select("id, name, position, color").eq("organization_id", organizationId).is("archived_at", null).order("position"),
    client.from("leads").select("status, converted_at, created_at").eq("organization_id", organizationId).is("archived_at", null),
    client.from("tasks").select("status, due_date").eq("organization_id", organizationId).is("archived_at", null),
    client.from("activities").select("status, start_at").eq("organization_id", organizationId).is("archived_at", null),
  ]);
  if (dealsError || stagesError || leadsError || tasksError || activitiesError) throw dealsError || stagesError || leadsError || tasksError || activitiesError;
  const allDeals = deals ?? [];
  const scopedDeals = allDeals.filter((deal) => (deal.won_at || deal.lost_at || deal.updated_at || deal.created_at).slice(0, 10) >= start);
  const open = allDeals.filter((deal) => deal.status === "open");
  const won = scopedDeals.filter((deal) => deal.status === "won");
  const closed = scopedDeals.filter((deal) => deal.status === "won" || deal.status === "lost");
  const activeLeads = leads ?? [];
  const periodLeads = activeLeads.filter((lead) => lead.created_at.slice(0, 10) >= start);
  const todayTasks = (tasks ?? []).filter((task) => task.due_date === today);
  const pendingTasks = (tasks ?? []).filter((task) => task.status === "pending");
  const todayActivities = (activities ?? []).filter((activity) => activity.start_at.slice(0, 10) === today);
  const openByStage = new Map<string, { dealsCount: number; totalValue: number }>();
  open.forEach((deal) => { const current = openByStage.get(deal.stage_id) ?? { dealsCount: 0, totalValue: 0 }; openByStage.set(deal.stage_id, { dealsCount: current.dealsCount + 1, totalValue: current.totalValue + Number(deal.value) }); });
  return {
    openPipeline: open.reduce((sum, deal) => sum + Number(deal.value), 0),
    forecast: open.reduce((sum, deal) => sum + Number(deal.value) * Number(deal.probability) / 100, 0),
    wonDeals: won.length,
    wonRevenue: won.reduce((sum, deal) => sum + Number(deal.value), 0),
    winRate: closed.length ? won.length / closed.length * 100 : 0,
    averageTicket: won.length ? won.reduce((sum, deal) => sum + Number(deal.value), 0) / won.length : 0,
    activeLeads: activeLeads.filter((lead) => !["converted", "lost"].includes(lead.status)).length,
    newLeads: periodLeads.length,
    convertedLeads: activeLeads.filter((lead) => lead.converted_at && lead.converted_at.slice(0, 10) >= start).length,
    pendingTasks: pendingTasks.length,
    overdueTasks: pendingTasks.filter((task) => Boolean(task.due_date && task.due_date < today)).length,
    todayTasks: todayTasks.length,
    todayActivities: todayActivities.length,
    nextActivities: (activities ?? []).filter((activity) => activity.status === "scheduled" && activity.start_at.slice(0, 10) >= today).length,
    pipelineStages: (stages ?? []).map((stage) => ({ id: stage.id, name: stage.name, position: stage.position, color: stage.color ?? "#6366F1", ...(openByStage.get(stage.id) ?? { dealsCount: 0, totalValue: 0 }) })),
    revenueHistory: won.map((deal) => ({ periodLabel: (deal.won_at || deal.updated_at).slice(0, 7), receita: Number(deal.value), receitaAnterior: 0, negocios: 1, negociosAnterior: 0 })),
  };
}
