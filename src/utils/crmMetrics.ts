import { ActivityItem, DashboardMetric, DealItem, LeadItem, LeadSource, PipelineStage, TaskItem } from "../types/crm";

const active = <T extends { archivedAt?: string | null; isArchived?: boolean }>(items: T[]) =>
  items.filter((item) => !item.archivedAt && !item.isArchived);

export const calculateOpenPipeline = (deals: DealItem[]) =>
  active(deals).filter((deal) => deal.status === "open").reduce((sum, deal) => sum + deal.value, 0);

export const calculateWonDeals = (deals: DealItem[]) =>
  active(deals).filter((deal) => deal.status === "won");

export const calculateWeightedForecast = (deals: DealItem[]) =>
  active(deals).filter((deal) => deal.status === "open").reduce((sum, deal) => sum + deal.value * (deal.probability / 100), 0);

export const calculatePipelineStages = (deals: DealItem[]): PipelineStage[] => {
  const colors = ["#6366F1", "#3B82F6", "#8B5CF6", "#F59E0B", "#10B981"];
  const grouped = new Map<string, { name: string; count: number; value: number }>();
  active(deals).filter((deal) => deal.status === "open").forEach((deal) => {
    const current = grouped.get(deal.stageId) || { name: deal.stageName, count: 0, value: 0 };
    grouped.set(deal.stageId, { name: current.name, count: current.count + 1, value: current.value + deal.value });
  });
  return Array.from(grouped.entries()).map(([id, stage], index) => ({
    id,
    name: stage.name,
    dealsCount: stage.count,
    totalValue: stage.value,
    conversionRatePercent: 0,
    color: colors[index % colors.length],
  }));
};

export const calculateLeadSources = (leads: LeadItem[]): LeadSource[] => {
  const activeLeads = leads.filter((lead) => !lead.archivedAt && !lead.archived);
  const counts = new Map<string, number>();
  activeLeads.forEach((lead) => counts.set(lead.source, (counts.get(lead.source) || 0) + 1));
  const total = activeLeads.length || 1;
  return Array.from(counts.entries()).map(([name, count], index) => ({
    name,
    count,
    percentage: Math.round((count / total) * 100),
    color: ["#4F46E5", "#0EA5E9", "#10B981", "#8B5CF6", "#F59E0B"][index % 5],
  }));
};

export const calculateTodayTasks = (tasks: TaskItem[], date: string) =>
  tasks.filter((task) => !task.archivedAt && task.dueDate === date);

export const calculateTodayActivities = (activities: ActivityItem[], date: string) =>
  activities.filter((activity) => !activity.archivedAt && activity.startAt.startsWith(date));

export const calculateDashboardMetrics = (deals: DealItem[], leads: LeadItem[]): DashboardMetric[] => {
  const openPipeline = calculateOpenPipeline(deals);
  const won = calculateWonDeals(deals);
  const closed = active(deals).filter((deal) => deal.status === "won" || deal.status === "lost");
  const wonRevenue = won.reduce((sum, deal) => sum + deal.value, 0);
  const conversion = closed.length ? (won.length / closed.length) * 100 : 0;
  const ticket = won.length ? wonRevenue / won.length : 0;
  const forecast = calculateWeightedForecast(deals);
  const activeLeads = leads.filter((lead) => !lead.archivedAt && !lead.archived);
  return [
    { id: "metric-receita", label: "Receita ganha", value: `R$ ${wonRevenue.toLocaleString("pt-BR")}`, numericValue: wonRevenue, tooltipText: "Soma dos negócios ganhos.", iconName: "TrendingUp" },
    { id: "metric-pipeline", label: "Pipeline aberto", value: `R$ ${openPipeline.toLocaleString("pt-BR")}`, numericValue: openPipeline, secondaryText: `${active(deals).filter((deal) => deal.status === "open").length} negócios ativos`, tooltipText: "Soma de negócios abertos.", iconName: "Filter" },
    { id: "metric-conversao", label: "Conversão comercial", value: `${conversion.toFixed(1).replace(".", ",")}%`, numericValue: conversion, tooltipText: "Ganhos divididos por negócios ganhos e perdidos.", iconName: "Target" },
    { id: "metric-ticket", label: "Ticket médio", value: `R$ ${ticket.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, numericValue: ticket, tooltipText: "Receita ganha dividida pelos negócios ganhos.", iconName: "DollarSign" },
    { id: "metric-ganhos", label: "Negócios ganhos", value: String(won.length), numericValue: won.length, tooltipText: "Quantidade de negócios ganhos.", iconName: "CheckCircle2" },
    { id: "metric-leads", label: "Leads ativos", value: String(activeLeads.length), numericValue: activeLeads.length, tooltipText: "Leads ativos no estado compartilhado.", iconName: "Clock" },
  ];
};
