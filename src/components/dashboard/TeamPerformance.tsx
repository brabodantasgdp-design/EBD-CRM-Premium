import React from "react";
import { Users, Award, TrendingUp } from "lucide-react";
import { SalesRepPerformance } from "../../types/crm";

interface TeamPerformanceProps {
  team: SalesRepPerformance[];
}

export const TeamPerformance: React.FC<TeamPerformanceProps> = ({ team }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Performance comercial
              </h3>
              <p className="text-xs text-slate-500">
                Ranking de desempenho da equipe de vendas
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            4 Vendedores
          </span>
        </div>

        {/* Desktop Table / Mobile Card Layout */}
        <div className="space-y-3">
          {team.map((rep) => (
            <div
              key={rep.id}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Rep Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={rep.avatar}
                    alt={rep.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                  />
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-slate-900 text-white text-[9px] font-black flex items-center justify-center">
                    #{rep.rank}
                  </span>
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {rep.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {rep.role}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 sm:flex items-center gap-3 sm:gap-6 text-left sm:text-right border-t sm:border-0 border-slate-200/60 pt-2 sm:pt-0">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">
                    Receita
                  </p>
                  <p className="text-xs font-extrabold text-slate-900">
                    {rep.formattedRevenue}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">
                    Ganhos
                  </p>
                  <p className="text-xs font-extrabold text-emerald-600">
                    {rep.wonDeals} negócios
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">
                    Conversão
                  </p>
                  <p className="text-xs font-extrabold text-indigo-600">
                    {rep.conversionRatePercent}%
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full sm:w-28 shrink-0">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                  <span>Meta</span>
                  <span>{rep.metaProgressPercent}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${rep.metaProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Receita acumulada pela equipe: <strong className="text-slate-800">R$ 286.450</strong></span>
        <span className="text-[10px] text-slate-400">Meta média atingida: 78.5%</span>
      </div>
    </div>
  );
};
