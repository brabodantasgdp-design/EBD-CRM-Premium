import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  CheckSquare,
  Calendar,
  Package,
  FileText,
  BarChart3,
  Bot,
  Settings,
  ChevronRight,
  ChevronDown,
  Building,
  UserCheck,
  Zap,
  Sparkles,
  LogOut,
  SlidersHorizontal,
  Layers,
  X,
} from "lucide-react";
import { MOCK_COMPANIES, MOCK_USER_PROFILE } from "../../data/mockCrmData";
import { CompanyAccount } from "../../types/crm";
import { OrganizationSwitcher } from "../auth/OrganizationSwitcher";
import { useCRM } from "../../context/CRMContext";

interface SidebarProps {
  activeTab: string;
  onTabSelect: (tabId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  leadsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabSelect,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  leadsCount,
}) => {
  const router = useRouter();
  const { leads } = useCRM();
  const activeLeadsCount = leads.filter((lead) => !lead.archivedAt && !lead.archived).length;
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyAccount>(MOCK_COMPANIES[0]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const mainNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "leads",
      label: "Leads",
      icon: UserCheck,
      badge: String(activeLeadsCount),
    },
    { id: "contatos", label: "Contatos", icon: Users },
    { id: "empresas", label: "Empresas", icon: Building2 },
    { id: "negocios", label: "Negócios", icon: Briefcase, badge: "47" },
    { id: "tarefas", label: "Tarefas", icon: CheckSquare, badge: "4" },
    { id: "agenda", label: "Agenda", icon: Calendar },
    { id: "produtos", label: "Produtos", icon: Package },
    { id: "propostas", label: "Propostas", icon: FileText },
    { id: "relatorios", label: "Relatórios", icon: BarChart3 },
    { id: "automacoes", label: "Automações", icon: Zap },
    { id: "copilot", label: "Copilot IA", icon: Bot, isAi: true },
  ];

  const handleSelectNav = (id: string) => {
    onTabSelect(id);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800/80 transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-900/30 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col">
                <span className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
                  Nexus<span className="text-indigo-400 font-extrabold">CRM</span>
                  <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                    B2B
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium truncate">
                  Enterprise Suite
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            aria-label="Alternar menu lateral"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform duration-300 ${
                collapsed ? "" : "rotate-180"
              }`}
            />
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            className="flex lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Organization switcher demonstrativo. Na implementação real, a troca de organização deverá validar membership, permissões e isolamento de dados no backend/RLS. */}
        {(!collapsed || mobileOpen) && <OrganizationSwitcher />}
        {false && (!collapsed || mobileOpen) && (
          <div className="p-3 border-b border-slate-800/60 relative">
            <button
              onClick={() => setCompanyMenuOpen(!companyMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-800/50">
                  <Building className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {selectedCompany.name}
                  </p>
                  <p className="text-[10px] text-indigo-300 font-medium">
                    {selectedCompany.plan}
                  </p>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown menu */}
            {companyMenuOpen && (
              <div className="absolute left-3 right-3 top-16 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-1 z-50">
                <p className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Mudar Organização
                </p>
                {MOCK_COMPANIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCompany(c);
                      setCompanyMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 text-xs rounded-lg transition-colors ${
                      c.id === selectedCompany.id
                        ? "bg-indigo-600/30 text-indigo-200 font-medium border border-indigo-500/30"
                        : "hover:bg-slate-700/60 text-slate-300"
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {c.id === selectedCompany.id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation Items Scroll Area */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Link
                key={item.id}
                href={`/${item.id}`}
                onClick={onMobileClose}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 relative group ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                }`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-white"
                      : item.isAi
                      ? "text-purple-400 group-hover:text-purple-300"
                      : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />

                {(!collapsed || mobileOpen) && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}

                {(!collapsed || mobileOpen) && item.badge && (
                  <span
                    data-testid={item.id === "leads" ? "leads-sidebar-badge" : undefined}
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {(!collapsed || mobileOpen) && item.isAi && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <Sparkles className="h-2.5 w-2.5 text-purple-300" />
                    AI
                  </span>
                )}

                {/* Collapsed tooltip */}
                {collapsed && !mobileOpen && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap border border-slate-700">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}

          <div className="my-2 border-t border-slate-800/80" />

          {/* Configurações */}
          <Link
            href="/configuracoes"
            onClick={onMobileClose}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
              activeTab === "configuracoes"
                ? "bg-indigo-600 text-white font-semibold"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
            }`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {(!collapsed || mobileOpen) && (
              <span className="flex-1 text-left truncate">Configurações</span>
            )}
          </Link>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 relative">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 text-left p-1 rounded-xl hover:bg-slate-800/80 w-full transition-colors"
            >
              <img
                src={MOCK_USER_PROFILE.avatar}
                alt={MOCK_USER_PROFILE.name}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0"
              />
              {(!collapsed || mobileOpen) && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {MOCK_USER_PROFILE.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {MOCK_USER_PROFILE.role}
                  </p>
                </div>
              )}
            </button>
          </div>

          {/* User popup menu */}
          {userMenuOpen && (!collapsed || mobileOpen) && (
            <div className="absolute left-3 right-3 bottom-16 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-1.5 z-50 space-y-1">
              <div className="px-2 py-1.5 border-b border-slate-700/60 mb-1">
                <p className="text-xs font-semibold text-white">
                  {MOCK_USER_PROFILE.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {MOCK_USER_PROFILE.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  onTabSelect("configuracoes");
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-700/60 rounded-lg transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Preferências de Conta
              </button>
              <button
                onClick={async () => {
                  setUserMenuOpen(false);
                  await fetch("/api/auth/logout", { method: "POST" });
                  router.replace("/login");
                  router.refresh();
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair do sistema
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
