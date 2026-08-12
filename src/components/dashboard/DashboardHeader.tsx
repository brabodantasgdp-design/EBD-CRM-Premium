import React from "react";
import { Plus, Sparkles, TrendingUp } from "lucide-react";
import { MOCK_USER_PROFILE } from "../../data/mockCrmData";

interface DashboardHeaderProps {
  onOpenNewDeal: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onOpenNewDeal,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
      {/* Decorative subtle background glow */}
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-1/3 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Bom dia, {MOCK_USER_PROFILE.name.split(" ")[0]} 👋
          </h2>
        </div>
        <p className="text-slate-300 text-xs sm:text-sm font-medium">
          Veja como sua operação comercial está evoluindo neste período.
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-3">
        <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-indigo-300">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
          <span>Meta do mês: <strong className="text-white">81,8%</strong> atingida</span>
        </div>

        <button
          onClick={onOpenNewDeal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>+ Novo negócio</span>
        </button>
      </div>
    </div>
  );
};
