/**
 * PREPARAÇÃO MULTI-TENANT & RLS (DOCUMENTAÇÃO):
 * Em uma implementação real com backend Supabase/PostgreSQL:
 * - Todos os dados empresariais terão a coluna `organization_id`.
 * - Usuários terão vínculo com organizações e papéis (roles).
 * - As permissões de acesso e o isolamento de dados serão garantidos via Supabase Row Level Security (RLS) no banco de dados, nunca apenas no cliente.
 * - O Super Admin da plataforma será separado do Admin da empresa.
 * - Dados de outra organização nunca serão fornecidos ao Copilot ou às buscas.
 * 
 * Este arquivo centraliza todos os dados simulados para prototipação do dashboard.
 */

import {
  DashboardMetric,
  RevenueDataPoint,
  PipelineStage,
  ForecastData,
  CRMTask,
  RiskDeal,
  SalesRepPerformance,
  LeadMetrics,
  LeadSource,
  ActivityFeedItem,
  CopilotInsight,
  CompanyAccount,
  UserProfile,
} from "../types/crm";

export const MOCK_USER_PROFILE: UserProfile = {
  name: "Mariana Costa",
  email: "mariana.costa@apextech.com.br",
  role: "Gestora Comercial",
  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  companyName: "Apex Enterprise B2B",
};

export const MOCK_COMPANIES: CompanyAccount[] = [
  {
    id: "comp-1",
    name: "Apex Enterprise B2B",
    plan: "SaaS Enterprise",
    active: true,
  },
  {
    id: "comp-2",
    name: "Vanguard Tech Ventures",
    plan: "Growth Plan",
    active: false,
  },
  {
    id: "comp-3",
    name: "Nexora Global Logistics",
    plan: "Scale Plan",
    active: false,
  },
];

export const MOCK_METRICS: DashboardMetric[] = [
  {
    id: "metric-receita",
    label: "Receita ganha",
    value: "R$ 286.450",
    numericValue: 286450,
    trend: 18.4,
    trendType: "positive",
    comparison: "vs. período anterior",
    tooltipText: "Valor de negócios marcados como ganhos no período.",
    iconName: "TrendingUp",
  },
  {
    id: "metric-pipeline",
    label: "Pipeline aberto",
    value: "R$ 842.300",
    numericValue: 842300,
    secondaryText: "47 negócios ativos",
    tooltipText: "Soma de negócios atualmente abertos.",
    iconName: "Filter",
  },
  {
    id: "metric-conversao",
    label: "Conversão comercial",
    value: "28,6%",
    numericValue: 28.6,
    trend: 3.2,
    trendType: "positive",
    comparison: "+3,2 p.p.",
    tooltipText: "Percentual de negócios considerados ganhos em relação à base definida para o período.",
    iconName: "Target",
  },
  {
    id: "metric-ticket",
    label: "Ticket médio",
    value: "R$ 18.940",
    numericValue: 18940,
    trend: 7.8,
    trendType: "positive",
    comparison: "vs. período anterior",
    tooltipText: "Receita ganha / quantidade de negócios ganhos.",
    iconName: "DollarSign",
  },
  {
    id: "metric-ganhos",
    label: "Negócios ganhos",
    value: "18",
    numericValue: 18,
    trend: 12.5,
    trendType: "positive",
    comparison: "vs. período anterior",
    tooltipText: "Quantidade de oportunidades com status Fechado Ganho no período.",
    iconName: "CheckCircle2",
  },
  {
    id: "metric-ciclo",
    label: "Ciclo médio de vendas",
    value: "24 dias",
    numericValue: 24,
    trend: -3,
    trendType: "positive", // A reduction in cycle duration is a positive improvement
    comparison: "-3 dias no ciclo",
    tooltipText: "Tempo médio entre criação e ganho de negócios concluídos.",
    iconName: "Clock",
  },
];

export const MOCK_REVENUE_EVOLUTION: RevenueDataPoint[] = [
  { periodLabel: "Semana 1", receita: 42000, receitaAnterior: 36000, negocios: 4, negociosAnterior: 3 },
  { periodLabel: "Semana 2", receita: 55000, receitaAnterior: 44000, negocios: 6, negociosAnterior: 4 },
  { periodLabel: "Semana 3", receita: 48000, receitaAnterior: 50000, negocios: 5, negociosAnterior: 5 },
  { periodLabel: "Semana 4", receita: 71000, receitaAnterior: 58000, negocios: 8, negociosAnterior: 6 },
  { periodLabel: "Semana 5", receita: 69450, receitaAnterior: 52000, negocios: 7, negociosAnterior: 5 },
];

export const MOCK_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "stage-qual",
    name: "Qualificação",
    dealsCount: 14,
    totalValue: 175000,
    conversionRatePercent: 100,
    color: "#6366F1", // Indigo
  },
  {
    id: "stage-diag",
    name: "Diagnóstico",
    dealsCount: 11,
    totalValue: 214500,
    conversionRatePercent: 78.5,
    color: "#3B82F6", // Blue
  },
  {
    id: "stage-prop",
    name: "Proposta",
    dealsCount: 9,
    totalValue: 198000,
    conversionRatePercent: 64.2,
    color: "#0EA5E9", // Sky
  },
  {
    id: "stage-neg",
    name: "Negociação",
    dealsCount: 8,
    totalValue: 187800,
    conversionRatePercent: 57.1,
    color: "#8B5CF6", // Purple
  },
  {
    id: "stage-fech",
    name: "Fechamento",
    dealsCount: 5,
    totalValue: 67000,
    conversionRatePercent: 35.7,
    color: "#10B981", // Emerald
  },
];

export const MOCK_FORECAST: ForecastData = {
  monthlyGoal: 350000,
  closedValue: 286450,
  probableValue: 332700,
  remainingGoal: 63550,
  closedPercent: 81.8,
  probablePercent: 95.0,
};

export const MOCK_TASKS: CRMTask[] = [
  {
    id: "task-1",
    time: "09:30",
    type: "Ligação",
    companyName: "Grupo Horizonte",
    assigneeName: "Mariana Costa",
    assigneeAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    status: "pendente",
    isMine: true,
    priority: "media",
  },
  {
    id: "task-2",
    time: "11:00",
    type: "Reunião",
    companyName: "TechWave Sistemas",
    assigneeName: "Lucas Mendes",
    assigneeAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    status: "atrasada",
    isMine: false,
    priority: "alta",
  },
  {
    id: "task-3",
    time: "14:30",
    type: "Follow-up",
    companyName: "Construtora Atlas",
    assigneeName: "Mariana Costa",
    assigneeAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    status: "pendente",
    isMine: true,
    priority: "alta",
  },
  {
    id: "task-4",
    time: "16:00",
    type: "Demo comercial",
    companyName: "Nexora Logística",
    assigneeName: "Camila Rocha",
    assigneeAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    status: "pendente",
    isMine: false,
    priority: "media",
  },
  {
    id: "task-5",
    time: "17:15",
    type: "Proposta",
    companyName: "Inova Varejo S/A",
    assigneeName: "Rafael Souza",
    assigneeAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    status: "concluida",
    isMine: false,
    priority: "baixa",
  },
];

export const MOCK_RISK_DEALS: RiskDeal[] = [
  {
    id: "risk-1",
    companyName: "Construtora Atlas",
    value: 48000,
    formattedValue: "R$ 48.000",
    stage: "Negociação",
    reason: "Sem interação há 7 dias",
    daysWithoutInteraction: 7,
    assigneeName: "Mariana Costa",
    riskLevel: "alto",
  },
  {
    id: "risk-2",
    companyName: "Grupo Horizonte",
    value: 31500,
    formattedValue: "R$ 31.500",
    stage: "Proposta",
    reason: "Proposta vence amanhã",
    daysWithoutInteraction: 3,
    assigneeName: "Lucas Mendes",
    riskLevel: "medio",
  },
  {
    id: "risk-3",
    companyName: "Nexora Logística",
    value: 62000,
    formattedValue: "R$ 62.000",
    stage: "Negociação",
    reason: "Data prevista de fechamento atrasada",
    daysWithoutInteraction: 5,
    assigneeName: "Camila Rocha",
    riskLevel: "alto",
  },
];

export const MOCK_TEAM_PERFORMANCE: SalesRepPerformance[] = [
  {
    id: "rep-1",
    name: "Mariana Costa",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    role: "Senior Enterprise AE",
    revenue: 96400,
    formattedRevenue: "R$ 96.400",
    wonDeals: 6,
    conversionRatePercent: 32.0,
    metaProgressPercent: 96,
    rank: 1,
  },
  {
    id: "rep-2",
    name: "Lucas Mendes",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "Mid-Market Account Executive",
    revenue: 74800,
    formattedRevenue: "R$ 74.800",
    wonDeals: 5,
    conversionRatePercent: 27.0,
    metaProgressPercent: 83,
    rank: 2,
  },
  {
    id: "rep-3",
    name: "Camila Rocha",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    role: "Account Executive",
    revenue: 67250,
    formattedRevenue: "R$ 67.250",
    wonDeals: 4,
    conversionRatePercent: 29.0,
    metaProgressPercent: 75,
    rank: 3,
  },
  {
    id: "rep-4",
    name: "Rafael Souza",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    role: "Inside Sales Representative",
    revenue: 48000,
    formattedRevenue: "R$ 48.000",
    wonDeals: 3,
    conversionRatePercent: 22.0,
    metaProgressPercent: 60,
    rank: 4,
  },
];

export const MOCK_LEAD_METRICS: LeadMetrics = {
  totalNewLeads: 126,
  growthPercent: 14.0,
  qualifiedCount: 38,
  qualificationRatePercent: 30.1,
  weeklyTrend: [18, 22, 25, 29, 32],
};

export const MOCK_LEAD_SOURCES: LeadSource[] = [
  { name: "Indicação", percentage: 31, count: 39, color: "#4F46E5" }, // Indigo
  { name: "Site Direct", percentage: 26, count: 33, color: "#0EA5E9" }, // Sky
  { name: "Prospecção Ativa", percentage: 19, count: 24, color: "#10B981" }, // Emerald
  { name: "LinkedIn B2B", percentage: 14, count: 18, color: "#8B5CF6" }, // Purple
  { name: "Eventos & Feiras", percentage: 7, count: 9, color: "#F59E0B" }, // Amber
  { name: "Outros Canais", percentage: 3, count: 3, color: "#64748B" }, // Slate
];

export const MOCK_ACTIVITIES_FEED: ActivityFeedItem[] = [
  {
    id: "act-1",
    user: {
      name: "Mariana Costa",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
    action: "moveu o negócio",
    target: "Expansão Grupo Horizonte (R$ 31.500) para Negociação",
    timestamp: "há 12 min",
    type: "deal_moved",
  },
  {
    id: "act-2",
    user: {
      name: "Lucas Mendes",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    action: "registrou uma ligação com",
    target: "TechWave Sistemas - Alinhamento Técnico",
    timestamp: "há 28 min",
    type: "call_logged",
  },
  {
    id: "act-3",
    user: {
      name: "Camila Rocha",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    },
    action: "ganhou o negócio",
    target: "Projeto Nexora Digital (R$ 62.000 🎉)",
    timestamp: "há 1 h",
    type: "deal_won",
  },
  {
    id: "act-4",
    user: {
      name: "Rafael Souza",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    action: "adicionou uma nova proposta ao negócio",
    target: "Construtora Atlas (Revisão v2.1)",
    timestamp: "há 2 h",
    type: "proposal_added",
  },
];

export const MOCK_COPILOT_INSIGHT: CopilotInsight = {
  id: "copilot-1",
  text: "Seu pipeline está saudável, mas R$ 141 mil estão concentrados em negócios sem atividade recente. Priorize Construtora Atlas e Grupo Horizonte para assegurar o atingimento da meta do mês.",
  badgeText: "Insight simulado",
  suggestions: [
    { id: "sug-1", label: "Ver negócios em risco", actionType: "filter_risk" },
    { id: "sug-2", label: "Analisar pipeline", actionType: "analyze_pipeline" },
    { id: "sug-3", label: "Preparar follow-ups", actionType: "prepare_followups" },
  ],
};
