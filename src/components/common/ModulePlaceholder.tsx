import React from "react";
import { ArrowLeft, Sparkles, Info } from "lucide-react";

interface ModulePlaceholderProps {
  moduleName: string;
  onReturnToDashboard: () => void;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  moduleName,
  onReturnToDashboard,
}) => {
  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs max-w-xl mx-auto my-8 text-center space-y-6">
      <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto border border-indigo-100">
        <Sparkles className="h-8 w-8" />
      </div>

      <div className="space-y-3">
        <div>
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-slate-100 text-slate-600 border border-slate-200 inline-block mb-3">
            Módulo em preparação
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {moduleName}
          </h2>
        </div>

        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Este módulo será desenvolvido em uma próxima etapa do protótipo.
        </p>
      </div>

      <div className="pt-2">
        <button
          onClick={onReturnToDashboard}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Dashboard</span>
        </button>
      </div>

      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-center gap-1.5 max-w-md mx-auto text-left">
        <Info className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
        <span>
          Este protótipo utiliza dados simulados. Autenticação, banco de dados, permissões, RLS, IA e integrações ainda não estão conectados.
        </span>
      </div>
    </div>
  );
};

