import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  UserCheck,
  Briefcase,
  CheckSquare,
  MoreHorizontal,
  Plus,
  Users,
  Building2,
  Calendar,
  Package,
  FileText,
  BarChart3,
  Bot,
  Settings,
  X,
} from "lucide-react";

interface MobileNavigationProps {
  activeTab: string;
  onTabSelect: (tabId: string) => void;
  onOpenQuickCreate: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onTabSelect,
  onOpenQuickCreate,
}) => {
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const mainTabs = [
    { id: "dashboard", label: "Início", icon: LayoutDashboard },
    { id: "leads", label: "Leads", icon: UserCheck, badge: "126" },
    { id: "negocios", label: "Negócios", icon: Briefcase, badge: "47" },
    { id: "tarefas", label: "Tarefas", icon: CheckSquare, badge: "4" },
  ];

  const extraTabs = [
    { id: "contatos", label: "Contatos", icon: Users },
    { id: "empresas", label: "Empresas", icon: Building2 },
    { id: "agenda", label: "Agenda", icon: Calendar },
    { id: "produtos", label: "Produtos", icon: Package },
    { id: "propostas", label: "Propostas", icon: FileText },
    { id: "relatorios", label: "Relatórios", icon: BarChart3 },
    { id: "copilot", label: "Copilot IA", icon: Bot },
    { id: "configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <>
      {/* Floating Action Button for Quick Create on Mobile */}
      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 lg:hidden pointer-events-auto">
        <button
          onClick={onOpenQuickCreate}
          className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Ação Rápida de Criar"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex items-center justify-around">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={`/${tab.id === "dashboard" ? "dashboard" : tab.id}`}
                className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-colors relative ${
                  isActive
                    ? "text-indigo-600 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-extrabold bg-indigo-600 text-white rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                  {tab.label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setMoreSheetOpen(true)}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-colors ${
              moreSheetOpen ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              Mais
            </span>
          </button>
        </div>
      </nav>

      {/* "Mais" Bottom Sheet Drawer */}
      {moreSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl p-5 border-t border-slate-200 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900">
                Outros Módulos do CRM
              </span>
              <button
                onClick={() => setMoreSheetOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 py-2">
              {extraTabs.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <Link
                    key={item.id}
                    href={`/${item.id}`}
                    onClick={() => setMoreSheetOpen(false)}
                    className={`flex flex-col items-center p-3 rounded-2xl transition-colors border ${
                      isActive
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                        : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-1.5 text-indigo-600" />
                    <span className="text-[11px] text-center font-semibold truncate w-full">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
