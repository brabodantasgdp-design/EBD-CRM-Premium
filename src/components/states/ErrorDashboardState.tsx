import React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

interface ErrorDashboardStateProps {
  onRetry: () => void;
}

export const ErrorDashboardState: React.FC<ErrorDashboardStateProps> = ({
  onRetry,
}) => {
  return (
    <div className="bg-white rounded-3xl p-10 sm:p-16 border border-slate-200 text-center my-6 shadow-xs max-w-xl mx-auto space-y-4">
      <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto border border-rose-100">
        <AlertOctagon className="h-8 w-8" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          Não foi possível carregar estes dados
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Ocorreu uma instabilidade na consulta às métricas do CRM. Por favor,
          tente recarregar os dados novamente.
        </p>
      </div>

      <div className="pt-2">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Tentar novamente</span>
        </button>
      </div>
    </div>
  );
};
