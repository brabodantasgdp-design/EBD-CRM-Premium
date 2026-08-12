import React, { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { MobileNavigation } from "./components/layout/MobileNavigation";
import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { MetricCard } from "./components/dashboard/MetricCard";
import { RevenueChartCard } from "./components/dashboard/RevenueChartCard";
import { PipelineOverview } from "./components/dashboard/PipelineOverview";
import { ForecastCard } from "./components/dashboard/ForecastCard";
import { RiskDealsList } from "./components/dashboard/RiskDealsList";
import { ActivityList } from "./components/dashboard/ActivityList";
import { TeamPerformance } from "./components/dashboard/TeamPerformance";
import { LeadSourceCard } from "./components/dashboard/LeadSourceCard";
import { RecentActivityFeed } from "./components/dashboard/RecentActivityFeed";
import { CopilotInsightCard } from "./components/dashboard/CopilotInsightCard";
import { QuickCreateModal } from "./components/modals/QuickCreateModal";
import { DealDetailModal } from "./components/modals/DealDetailModal";
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
import { CRMDataProvider } from "./context/CRMContext";
import { Toast } from "./components/common/Toast";
import { PeriodOption, UIStateMode, RiskDeal } from "./types/crm";
import {
  MOCK_METRICS,
  MOCK_REVENUE_EVOLUTION,
  MOCK_PIPELINE_STAGES,
  MOCK_FORECAST,
  MOCK_TASKS,
  MOCK_RISK_DEALS,
  MOCK_TEAM_PERFORMANCE,
  MOCK_LEAD_METRICS,
  MOCK_LEAD_SOURCES,
  MOCK_ACTIVITIES_FEED,
  MOCK_COPILOT_INSIGHT,
} from "./data/mockCrmData";
import { Info } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [currentPeriod, setCurrentPeriod] = useState<PeriodOption>("este_mes");
  const [uiState, setUiState] = useState<UIStateMode>("normal");
  const [leadsCount, setLeadsCount] = useState<number>(10);

  // Modals & Drawers state
  const [quickCreateOpen, setQuickCreateOpen] = useState<boolean>(false);
  const [quickCreateType, setQuickCreateType] = useState<string>("lead");
  const [selectedRiskDeal, setSelectedRiskDeal] = useState<RiskDeal | null>(null);
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
    <CRMDataProvider>
      <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col overflow-x-hidden">
        {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabSelect={(id) => setActiveTab(id)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        leadsCount={leadsCount}
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
          {activeTab === "leads" ? (
            <LeadsPage
              onShowToast={(msg) => showToast(msg)}
              currentPeriod={currentPeriod}
              onLeadsCountChange={(count) => setLeadsCount(count)}
            />
          ) : activeTab === "contatos" ? (
            <ContactsPage
              onShowToast={(msg) => showToast(msg)}
              currentPeriod={currentPeriod}
            />
          ) : activeTab === "empresas" ? (
            <CompaniesPage onOpenContactDetail={() => setActiveTab("contatos")} />
          ) : activeTab === "negocios" ? (
            <DealsPage
              onShowToast={(msg) => showToast(msg)}
              currentPeriod={currentPeriod}
            />
          ) : activeTab === "tarefas" ? (
            <TasksPage
              onShowToast={(msg) => showToast(msg)}
              onNavigateToEntity={(type) => {
                if (type === "deal") setActiveTab("negocios");
                else if (type === "contact") setActiveTab("contatos");
                else if (type === "company") setActiveTab("empresas");
                else if (type === "lead") setActiveTab("leads");
              }}
            />
          ) : activeTab === "agenda" ? (
            <AgendaPage
              onShowToast={(msg) => showToast(msg)}
              onNavigateToEntity={(type) => {
                if (type === "deal") setActiveTab("negocios");
                else if (type === "contact") setActiveTab("contatos");
                else if (type === "company") setActiveTab("empresas");
                else if (type === "lead") setActiveTab("leads");
              }}
            />
          ) : activeTab !== "dashboard" ? (
            <ModulePlaceholder
              moduleName={getTabTitle(activeTab)}
              onReturnToDashboard={() => setActiveTab("dashboard")}
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

              {uiState === "normal" && (
                <div className="space-y-5 sm:space-y-6 min-w-0">
                  {/* Row 1: Header Context Banner */}
                  <DashboardHeader
                    onOpenNewDeal={() => handleOpenQuickCreate("deal")}
                  />

                  {/* Row 2: KPIs Grid */}
                  <section aria-label="Métricas Principais">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                      {MOCK_METRICS.map((metric) => (
                        <MetricCard key={metric.id} metric={metric} />
                      ))}
                    </div>
                  </section>

                  {/* Row 3: Revenue Evolution Chart + Forecast Card */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="lg:col-span-2 min-w-0">
                      <RevenueChartCard data={MOCK_REVENUE_EVOLUTION} />
                    </div>
                    <div className="min-w-0">
                      <ForecastCard forecast={MOCK_FORECAST} />
                    </div>
                  </div>

                  {/* Row 4: Pipeline Overview + Deals at Risk */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="min-w-0">
                      <PipelineOverview
                        stages={MOCK_PIPELINE_STAGES}
                        onOpenPipelineModal={() => setKanbanOpen(true)}
                      />
                    </div>
                    <div id="section-risk-deals" className="min-w-0">
                      <RiskDealsList
                        deals={MOCK_RISK_DEALS}
                        onSelectDeal={(deal) => setSelectedRiskDeal(deal)}
                      />
                    </div>
                  </div>

                  {/* Row 5: Today Tasks + Team Performance */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div id="section-today-tasks" className="min-w-0">
                      <ActivityList
                        initialTasks={MOCK_TASKS}
                        onTaskCompleted={(name) =>
                          showToast(`Tarefa concluída: ${name}`)
                        }
                      />
                    </div>
                    <div className="min-w-0">
                      <TeamPerformance team={MOCK_TEAM_PERFORMANCE} />
                    </div>
                  </div>

                  {/* Row 6: Lead Metrics/Sources + Recent Activity + Copilot IA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="min-w-0">
                      <LeadSourceCard
                        leadMetrics={MOCK_LEAD_METRICS}
                        leadSources={MOCK_LEAD_SOURCES}
                      />
                    </div>
                    <div className="min-w-0">
                      <RecentActivityFeed activities={MOCK_ACTIVITIES_FEED} />
                    </div>
                    <div className="min-w-0">
                      <CopilotInsightCard
                        insight={MOCK_COPILOT_INSIGHT}
                        onSelectSuggestion={handleCopilotSuggestion}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Prototype Disclaimer Footer Notice */}
        <footer className="mt-auto bg-white border-t border-slate-200 py-3 px-4 sm:px-6 text-center text-[11px] text-slate-500 font-medium pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Info className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>
                Este protótipo utiliza dados simulados. Autenticação, banco de dados,
                permissões, RLS, IA e integrações ainda não estão conectados.
              </span>
            </div>
            <span className="text-slate-400 text-[10px]">
              Nexus CRM B2B • Protótipo de Front-end
            </span>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavigation
        activeTab={activeTab}
        onTabSelect={(id) => setActiveTab(id)}
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

      {selectedRiskDeal && (
        <DealDetailModal
          deal={selectedRiskDeal}
          onClose={() => setSelectedRiskDeal(null)}
          onActionSuccess={(msg) => showToast(msg)}
        />
      )}

      {kanbanOpen && (
        <PipelineKanbanModal
          stages={MOCK_PIPELINE_STAGES}
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
    </CRMDataProvider>
  );
}
