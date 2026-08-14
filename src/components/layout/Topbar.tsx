import React, { useState } from "react";
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  Menu,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Briefcase,
  CheckSquare,
  PhoneCall,
  Eye,
  RefreshCw,
  X,
} from "lucide-react";
import { PeriodOption, UIStateMode } from "../../types/crm";

interface TopbarProps {
  currentPeriod: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
  uiState: UIStateMode;
  onUiStateChange: (state: UIStateMode) => void;
  onOpenQuickCreate: (type?: string) => void;
  onToggleMobileSidebar: () => void;
  activeTabTitle: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentPeriod,
  onPeriodChange,
  uiState,
  onUiStateChange,
  onOpenQuickCreate,
  onToggleMobileSidebar,
  activeTabTitle,
}) => {
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [demoStateMenuOpen, setDemoStateMenuOpen] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA")
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const periodLabels: Record<PeriodOption, string> = {
    hoje: "Hoje",
    "7dias": "Últimos 7 dias",
    "30dias": "Últimos 30 dias",
    este_mes: "Este mês",
    trimestre: "Este trimestre",
    personalizado: "Personalizado",
  };

  const notifications = [
    {
      id: "n1",
      title: "Proposta vencendo",
      message: "Proposta do Grupo Horizonte vence amanhã (R$ 31.500)",
      time: "há 10 min",
      type: "warning",
    },
    {
      id: "n2",
      title: "Novo lead recebido",
      message: "Lead 'Diretor de TI - Inova Tech' preencheu formulário",
      time: "há 25 min",
      type: "info",
    },
    {
      id: "n3",
      title: "Negócio ganho!",
      message: "Camila Rocha fechou 'Projeto Nexora' (R$ 62.000)",
      time: "há 1 h",
      type: "success",
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left Area: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight shrink-0">
                {activeTabTitle === "Dashboard Executivo" ? (
                  <>
                    <span className="sm:hidden">Dashboard</span>
                    <span className="hidden sm:inline">Dashboard Executivo</span>
                  </>
                ) : (
                  activeTabTitle
                )}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Dados operacionais
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-500 font-medium mt-0.5 truncate">
              Multi-empresa CRM SaaS • B2B Enterprise
            </p>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 relative min-w-0">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empresas, contatos, negócios ou tarefas (Press /)"
              className="w-full pl-10 pr-12 py-2 text-xs bg-slate-100/80 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder-slate-400 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs hidden sm:inline-block">
              ⌘K / Ctrl+K
            </kbd>
          </div>

          {/* Search Dropdown Results */}
          {/* Busca global demonstrativa com dados simulados */}
          {searchFocused && searchQuery.length > 0 && (
            <div className="hidden absolute left-0 right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-left">
              <p className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Resultados Demonstrativos
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="w-full flex items-center justify-between p-2 text-xs hover:bg-slate-50 rounded-lg text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="font-semibold">Construtora Atlas</span>
                  <span className="text-slate-400 text-[11px]">R$ 48.000 • Negociação</span>
                </div>
                <span className="text-[10px] text-indigo-600 font-medium">Ver negócio</span>
              </button>
              <button
                onClick={() => setSearchQuery("")}
                className="w-full flex items-center justify-between p-2 text-xs hover:bg-slate-50 rounded-lg text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-semibold">Grupo Horizonte</span>
                  <span className="text-slate-400 text-[11px]">Mariana Costa</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Ver contato</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Area: Actions, Period, State Switcher, Quick Create, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Demo UI State Tester Badge
              NOTA: O UX Tester é uma ferramenta de desenvolvimento/demonstração.
              Em ambiente de produção, este componente deve ser desativado ou protegido por feature flag.
          */}
          <div className="relative hidden">
            <button
              onClick={() => setDemoStateMenuOpen(!demoStateMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs font-semibold border border-amber-200 transition-colors"
              title="Ferramenta Dev: Simular estados da interface"
            >
              <span className="px-1 py-0.2 bg-amber-200/80 text-amber-950 text-[9px] font-black rounded uppercase tracking-wider">DEV</span>
              <span className="hidden xl:inline text-[11px] text-amber-900/90 font-medium">Simular estado:</span>
              <span className="capitalize text-amber-900 font-bold text-[11px]">
                {uiState === "normal"
                  ? "Normal"
                  : uiState === "loading"
                  ? "Carregando"
                  : uiState === "empty"
                  ? "Vazio"
                  : uiState === "error"
                  ? "Erro"
                  : "Permissão restrita"}
              </span>
              <ChevronDown className="h-3 w-3 text-amber-700" />
            </button>

            {demoStateMenuOpen && (
              <div className="absolute right-0 top-11 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50">
                <div className="px-2 py-1 text-[10px] font-bold uppercase text-amber-700 tracking-wider flex items-center justify-between">
                  <span>Simular Estado (DEV)</span>
                </div>
                {(
                  [
                    { id: "normal", label: "Normal", desc: "Fluxo padrão com dados" },
                    { id: "loading", label: "Carregando", desc: "Loading Skeleton" },
                    { id: "empty", label: "Vazio", desc: "Sem resultados" },
                    { id: "error", label: "Erro", desc: "Falha na requisição" },
                    { id: "no_permission", label: "Permissão restrita", desc: "Estado simulado" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onUiStateChange(s.id);
                      setDemoStateMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                      uiState === s.id
                        ? "bg-amber-50 text-amber-900 font-bold border border-amber-200"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div>{s.label}</div>
                    <div className="text-[10px] font-normal text-slate-400">
                      {s.desc}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Period Selector Dropdown 
              NOTA: Filtros e ações da topbar poderão ser contextuais por módulo.
          */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setPeriodMenuOpen(!periodMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>{periodLabels[currentPeriod]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {periodMenuOpen && (
              <div className="absolute right-0 top-11 w-44 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50">
                {(
                  [
                    "hoje",
                    "7dias",
                    "30dias",
                    "este_mes",
                    "trimestre",
                    "personalizado",
                  ] as PeriodOption[]
                ).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      onPeriodChange(p);
                      setPeriodMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      currentPeriod === p
                        ? "bg-indigo-50 text-indigo-700 font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Notificações"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900">
                    Notificações (3)
                  </span>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100 text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-900">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Create Button "+ Criar" */}
          <div className="relative">
            <button
              onClick={() => setQuickCreateOpen(!quickCreateOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Criar</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-80" />
            </button>

            {quickCreateOpen && (
              <div className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 text-left">
                <button
                  onClick={() => {
                    setQuickCreateOpen(false);
                    onOpenQuickCreate("lead");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
                  Novo lead
                </button>
                <button
                  onClick={() => {
                    setQuickCreateOpen(false);
                    onOpenQuickCreate("deal");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium transition-colors"
                >
                  <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                  Novo negócio
                </button>
                <button
                  onClick={() => {
                    setQuickCreateOpen(false);
                    onOpenQuickCreate("task");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium transition-colors"
                >
                  <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                  Nova tarefa
                </button>
                <button
                  onClick={() => {
                    setQuickCreateOpen(false);
                    onOpenQuickCreate("activity");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium transition-colors"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-purple-600" />
                  Registrar atividade
                </button>
              </div>
            )}
          </div>

          {/* Profile Badge */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 ring-2 ring-indigo-500/20" aria-label="Conta autenticada">
              NX
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
