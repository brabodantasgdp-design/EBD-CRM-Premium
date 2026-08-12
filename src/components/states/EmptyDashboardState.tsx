import React from "react";
import { Filter, Calendar, RefreshCw } from "lucide-react";

interface EmptyDashboardStateProps {
  onResetFilter: () => void;
}

export const EmptyDashboardState: React.FC<EmptyDashboardStateProps> = ({
  onResetFilter,
}) => {
  return (
    <div className="bg-white rounded-3xl p-10 sm:p-16 border border-slate-200 text-center my-6 shadow-xs max-w-xl mx-auto space-y-4">
      <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto border border-indigo-100">
        <Filter className="h-8 w-8" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          Nenhum negócio encontrado neste período
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Não há registros de vendas ou oportunidades correspondentes ao filtro
          selecionado. Experimente ampliar o intervalo de datas.
        </p>
      </div>

      <div className="pt-2">
        <button
          onClick={onResetFilter}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Calendar className="h-4 w-4" />
          <span>Alterar período para "Este mês"</span>
        </button>
      </div>
    </div>
  );
};
