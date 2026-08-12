import React from "react";
import { AlertTriangle, ChevronRight, Clock, ShieldAlert, User } from "lucide-react";
import { RiskDeal } from "../../types/crm";

interface RiskDealsListProps {
  deals: RiskDeal[];
  onSelectDeal: (deal: RiskDeal) => void;
}

export const RiskDealsList: React.FC<RiskDealsListProps> = ({
  deals,
  onSelectDeal,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Negócios que precisam de atenção
              </h3>
              <p className="text-xs text-slate-500">
                3 oportunidades ativas com risco de perda
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            Atenção Prioritária
          </span>
        </div>

        {/* Deals List */}
        <div className="space-y-3">
          {deals.map((deal) => {
            const isHighRisk = deal.riskLevel === "alto";

            return (
              <div
                key={deal.id}
                onClick={() => onSelectDeal(deal)}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-200 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {deal.companyName}
                    </span>
                    <span className="font-extrabold text-xs text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                      {deal.formattedValue}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isHighRisk
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {isHighRisk ? "Risco Alto" : "Risco Médio"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      Etapa: <strong>{deal.stage}</strong>
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-medium text-rose-600">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {deal.reason}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200/60">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <User className="h-3 w-3 text-slate-400" />
                    <span>{deal.assigneeName}</span>
                  </div>

                  <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 group-hover:bg-indigo-50 rounded-lg transition-colors">
                    <span>Ver negócio</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Notice */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[11px] font-medium">
          R$ 141.500 em risco de estagnação
        </span>
        <span className="text-[10px] text-slate-400 font-medium">
          Alertas gerados por regras operacionais
        </span>
      </div>
    </div>
  );
};
