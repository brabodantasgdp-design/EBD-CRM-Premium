import React from "react";
import { ShieldX, Lock } from "lucide-react";

export const PermissionState: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-10 sm:p-16 border border-slate-200 text-center my-6 shadow-xs max-w-xl mx-auto space-y-4">
      <div className="h-16 w-16 bg-slate-100 text-slate-600 rounded-3xl flex items-center justify-center mx-auto border border-slate-200">
        <ShieldX className="h-8 w-8" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          Permissão restrita
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Você não possui permissão de acesso para visualizar estes indicadores. Entre em contato com o administrador da conta.
        </p>
      </div>

      <div className="pt-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200">
          <Lock className="h-3.5 w-3.5" />
          Permissão restrita (Estado simulado para testes de UX)
        </span>
      </div>
    </div>
  );
};
