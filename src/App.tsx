"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { MobileNavigation } from "./components/layout/MobileNavigation";
import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { MetricCard } from "./components/dashboard/MetricCard";
import { RevenueChartCard } from "./components/dashboard/RevenueChartCard";
import { PipelineOverview } from "./components/dashboard/PipelineOverview";
import { ForecastCard } from "./components/dashboard/ForecastCard";
import { ActivityList } from "./components/dashboard/ActivityList";
import { LeadSourceCard } from "./components/dashboard/LeadSourceCard";
import { QuickCreateModal } from "./components/modals/QuickCreateModal";
import { PipelineKanbanModal } from "./components/modals/PipelineKanbanModal";
import { SkeletonDashboard } from "./components/states/SkeletonDashboard";
import { EmptyDashboardState } from "./components/states/EmptyDashboardState";
import { ErrorDashboardState } from "./components/states/ErrorDashboardState";
import { PermissionState } from "./components/states/PermissionState";
import { ModulePlaceholder } from "./components/common/ModulePlaceholder";
import { LeadsPage } from "./components/leads/LeadsPage";
import { ContactsPage } from "./components/contacts/ContactsPage";
import { CompaniesPage } from "./components/companies/CompaniesPage";
import { DealsPage } from "./components/deals/DealsPage";
import { TasksPage } from "./components/tasks/TasksPage";
import { AgendaPage } from "./components/agenda/AgendaPage";
import { ProductsPage } from "./components/products/ProductsPage";
import { ProposalsPage } from "./components/proposals/ProposalsPage";
import { AutomationsPage } from "./components/automations/AutomationsPage";
import { useCRM } from "./context/CRMContext";
import { calculateLeadSources } from "./utils/crmMetrics";
import { getLocalDateString } from "./utils/formatters";
import { Toast } from "./components/common/Toast";
import { PeriodOption, UIStateMode } from "./types/crm";
import type { DashboardMetricsSnapshot } from "./lib/crm/dashboard/metrics";
import { Info } from "lucide-react";

export function AppContent({ module = "dashboard" }: { module?: string }) {
  const router = useRouter();
  const { leads } = useCRM();
  const [currentPeriod, setCurrentPeriod] = useState<PeriodOption>("este_mes");
  const [dashboardSnapshot, setDashboardSnapshot] = useState<DashboardMetricsSnapshot | null>(null);
  const [dashboardError, setDashboardError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setDashboardSnapshot(null);
    setDashboardError(false);
    fetch(`/api/dashboard/metrics?period=${currentPeriod === "trimestre" || currentPeriod === "personalizado" ? "este_mes" : currentPeriod}`, { cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("dashboard metrics"); return response.json() as Promise<{ metrics: DashboardMetricsSnapshot }>; })
      .then((payload) => { if (!cancelled) setDashboardSnapshot(payload.metrics); })
      .catch(() => { if (!cancelled) setDashboardError(true); });
    return () => { cancelled = true; };
  }, [currentPeriod]);
  const dashboardMetrics = useMemo(() => {
    const snapshot = dashboardSnapshot;
    const currency = (value: number) => `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
    return [
      { id: "metric-receita", label: "Receita ganha", value: currency(snapshot?.wonRevenue ?? 0), numericValue: snapshot?.wonRevenue ?? 0, tooltipText: "Soma dos negócios ganhos no período.", iconName: "TrendingUp" },
      { id: "metric-pipeline", label: "Pipeline aberto", value: currency(snapshot?.openPipeline ?? 0), numericValue: snapshot?.openPipeline ?? 0, secondaryText: `${(snapshot?.pipelineStages ?? []).reduce((sum, stage) => sum + stage.dealsCount, 0)} negócios ativos`, tooltipText: "Soma do valor dos negócios abertos na organização.", iconName: "Filter" },
      { id: "metric-conversao", label: "Conversão comercial", value: `${(snapshot?.winRate ?? 0).toFixed(1).replace(".", ",")}%`, numericValue: snapshot?.winRate ?? 0, tooltipText: "Negócios ganhos divididos por ganhos e perdas no período.", iconName: "Target" },
      { id: "metric-ticket", label: "Ticket médio", value: currency(snapshot?.averageTicket ?? 0), numericValue: snapshot?.averageTicket ?? 0, tooltipText: "Valor médio dos negócios ganhos no período.", iconName: "DollarSign" },
      { id: "metric-ganhos", label: "Negócios ganhos", value: String(snapshot?.wonDeals ?? 0), numericValue: snapshot?.wonDeals ?? 0, tooltipText: "Quantidade de negócios ganhos no período.", iconName: "CheckCircle2" },
      { id: "metric-leads", label: "Leads ativos", value: String(snapshot?.activeLeads ?? 0), numericValue: snapshot?.activeLeads ?? 0, tooltipText: "Leads ativos na organização atual.", iconName: "Clock" },
    ];
  }, [dashboardSnapshot]);
  const dashboardStages = (dashboardSnapshot?.pipelineStages ?? []).map((stage) => ({ id: stage.id, name: stage.name, dealsCount: stage.dealsCount, totalValue: stage.totalValue, conversionRatePercent: 0, color: stage.color }));
  const dashboardLeadSources = calculateLeadSources(leads);
  const weightedForecast = dashboardSnapshot?.forecast ?? 0;
  const revenueChartData = dashboardSnapshot?.revenueHistory ?? [];
  const activeTab = module;
  const navigateTo = (tab: string) => {
    router.push(`/${tab === "dashboard" ? "dashboard" : tab}`);
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [uiState, setUiState] = useState<UIStateMode>("normal");

  // Modals & Drawers state
  const [quickCreateOpen, setQuickCreateOpen] = useState<boolean>(false);
  const [quickCreateType, setQuickCreateType] = useState<string>("lead");
  const [kanbanOpen, setKanbanOpen] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handlePeriodChange = (period: PeriodOption) => {
    setCurrentPeriod(period);
    showToast(`Período alterado para: ${period.replace("_", " ").toUpperCase()}`);
  };

  const handleOpenQuickCreate = (type: string = "lead") => {
    setQuickCreateType(type);
    setQuickCreateOpen(true);
  };

  const handleCopilotSuggestion = (actionType: string) => {
    if (actionType === "filter_risk") {
      const riskEl = document.getElementById("section-risk-deals");
      if (riskEl) {
        riskEl.scrollIntoView({ behavior: "smooth" });
        showToast("Destacando negócios em risco que exigem atenção.");
      }
    } else if (actionType === "analyze_pipeline") {
      setKanbanOpen(true);
    } else if (actionType === "prepare_followups") {
      const tasksEl = document.getElementById("section-today-tasks");
      if (tasksEl) {
        tasksEl.scrollIntoView({ behavior: "smooth" });
        showToast("Listando tarefas e chamadas de follow-up prioritárias.");
      }
    }
  };

  const getTabTitle = (id: string) => {
    const titles: Record<string, string> = {
      dashboard: "Dashboard Executivo",
      leads: "Gestão de Leads",
      contatos: "Lista de Contatos",
      empresas: "Cadastro de Empresas",
      negocios: "Funil de Negócios",
      tarefas: "Tarefas e Compromissos",
      agenda: "Agenda Comercial",
      produtos: "Catálogo de Produtos",
      propostas: "Propostas Comerciais",
      relatorios: "Relatórios de Performance",
      automacoes: "Automações de Vendas",
      copilot: "Copilot IA Assistente",
      configuracoes: "Configurações da Conta",
    };
    return titles[id] || "Dashboard";
  };

  return (
      <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col overflow-x-hidden">
        {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabSelect={navigateTo}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area Wrapper */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Topbar */}
        <Topbar
          currentPeriod={currentPeriod}
          onPeriodChange={handlePeriodChange}
          uiState={uiState}
          onUiStateChange={setUiState}
          onOpenQuickCreate={handleOpenQuickCreate}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          activeTabTitle={getTabTitle(activeTab)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto pb-6 lg:pb-12 min-w-0">
          {module === "leads" ? (
            <LeadsPage
              onShowToast={(msg) => showToast(msg)}
              currentPeriod={currentPeriod}
            />
          ) : module === "contatos" ? (
            <ContactsPage
              onShowToast={(msg) => showToast(msg)}
              currentPeriod={currentPeriod}
            />
          ) : module === "empresas" ? (
            <CompaniesPage onOpenContactDetail={() => navigateTo("contatos")} />
          ) : module === "negocios" ? (
            <DealsPage
              onShowToast={(msg) => showToast(msg)}
              currentPeriod={currentPeriod}
            />
          ) : module === "tarefas" ? (
            <TasksPage
              onShowToast={(msg) => showToast(msg)}
              onNavigateToEntity={(type) => {
                if (type === "deal") navigateTo("negocios");
                else if (type === "contact") navigateTo("contatos");
                else if (type === "company") navigateTo("empresas");
                else if (type === "lead") navigateTo("leads");
              }}
            />
          ) : module === "agenda" ? (
            <AgendaPage
              onShowToast={(msg) => showToast(msg)}
              onNavigateToEntity={(type) => {
                if (type === "deal") navigateTo("negocios");
                else if (type === "contact") navigateTo("contatos");
                else if (type === "company") navigateTo("empresas");
                else if (type === "lead") navigateTo("leads");
              }}
            />
          ) : module === "produtos" ? (
            <ProductsPage />
          ) : module === "propostas" ? (
            <ProposalsPage />
          ) : module === "automacoes" ? (
            <AutomationsPage />
          ) : module !== "dashboard" ? (
            <ModulePlaceholder
              moduleName={getTabTitle(activeTab)}
              onReturnToDashboard={() => navigateTo("dashboard")}
            />
          ) : (
            <>
              {/* UI State Renderings */}
              {uiState === "loading" && <SkeletonDashboard />}

              {uiState === "empty" && (
                <EmptyDashboardState
                  onResetFilter={() => {
                    setCurrentPeriod("este_mes");
                    setUiState("normal");
                  }}
                />
              )}

              {uiState === "error" && (
                <ErrorDashboardState onRetry={() => setUiState("normal")} />
              )}

              {uiState === "no_permission" && <PermissionState />}

              {uiState === "normal" && dashboardError && <ErrorDashboardState onRetry={() => window.location.reload()} />}
              {uiState === "normal" && !dashboardError && !dashboardSnapshot && <SkeletonDashboard />}
              {uiState === "normal" && !dashboardError && dashboardSnapshot && (
                <div className="space-y-5 sm:space-y-6 min-w-0">
                  {/* Row 1: Header Context Banner */}
                  <DashboardHeader
                    onOpenNewDeal={() => handleOpenQuickCreate("deal")}
                  />

                  {/* Row 2: KPIs Grid */}
                  <section aria-label="Métricas Principais">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                      {dashboardMetrics.map((metric) => (
                        <MetricCard key={metric.id} metric={metric} />
                      ))}
                    </div>
                  </section>

                  {/* Row 3: Revenue Evolution Chart + Forecast Card */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="lg:col-span-2 min-w-0">
                      <RevenueChartCard data={revenueChartData} />
                    </div>
                    <div className="min-w-0">
                      <ForecastCard
                        forecast={{
                          monthlyGoal: 0,
                          closedValue: dashboardSnapshot.wonRevenue,
                          probableValue: weightedForecast,
                          remainingGoal: 0,
                          closedPercent: 0,
                          probablePercent: 0,
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 4: Pipeline Overview */}
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div className="min-w-0">
                      <PipelineOverview
                        stages={dashboardStages}
                        onOpenPipelineModal={() => setKanbanOpen(true)}
                      />
                    </div>
                  </div>

                  {/* Row 5: Today Tasks */}
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div id="section-today-tasks" className="min-w-0">
                      <ActivityList
                        onTaskCompleted={(name) =>
                          showToast(`Tarefa concluída: ${name}`)
                        }
                      />
                    </div>
                  </div>

                  {/* Row 6: Lead Sources */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="min-w-0">
                      <LeadSourceCard
                        leadMetrics={{ totalNewLeads: dashboardSnapshot.newLeads, growthPercent: 0, qualifiedCount: dashboardSnapshot.convertedLeads, qualificationRatePercent: 0, weeklyTrend: [] }}
                        leadSources={dashboardLeadSources}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Operational data footer */}
        <footer className="mt-auto bg-white border-t border-slate-200 py-3 px-4 sm:px-6 text-center text-[11px] text-slate-500 font-medium pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Info className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>
                Dashboard alimentado por dados reais da organização ativa.
              </span>
            </div>
            <span className="text-slate-400 text-[10px]">
              Nexus CRM B2B • Dados operacionais
            </span>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavigation
        activeTab={activeTab}
        onTabSelect={navigateTo}
        onOpenQuickCreate={() => handleOpenQuickCreate("lead")}
      />

      {/* Modals & Drawers */}
      {quickCreateOpen && (
        <QuickCreateModal
          initialType={quickCreateType}
          onClose={() => setQuickCreateOpen(false)}
          onSubmitSuccess={(msg) => showToast(msg)}
        />
      )}

      {kanbanOpen && (
        <PipelineKanbanModal
            stages={dashboardStages}
          onClose={() => setKanbanOpen(false)}
          onOpenNewDeal={() => {
            setKanbanOpen(false);
            handleOpenQuickCreate("deal");
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
