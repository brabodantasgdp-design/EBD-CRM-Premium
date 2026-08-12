import React from "react";
import { UserCheck, TrendingUp, PieChart as PieIcon } from "lucide-react";
import { LeadMetrics, LeadSource } from "../../types/crm";

interface LeadSourceCardProps {
  leadMetrics: LeadMetrics;
  leadSources: LeadSource[];
}

export const LeadSourceCard: React.FC<LeadSourceCardProps> = ({
  leadMetrics,
  leadSources,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Novos leads e Origens
              </h3>
              <p className="text-xs text-slate-500">
                Aquisição de prospects no período
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            +{leadMetrics.growthPercent}%
          </span>
        </div>

        {/* Lead Top Key Metrics Summary */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Total de Leads</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">
              {leadMetrics.totalNewLeads}
            </p>
            <p className="text-[10px] text-emerald-600 font-medium">
              +{leadMetrics.growthPercent}% vs. anterior
            </p>
          </div>
          <div className="border-l border-slate-200 pl-3">
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Qualificados</p>
            <p className="text-lg font-extrabold text-indigo-600 mt-0.5">
              {leadMetrics.qualifiedCount} ({leadMetrics.qualificationRatePercent}%)
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Taxa de qualificação
            </p>
          </div>
        </div>

        {/* Lead Source Breakdown Bars */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-800 mb-2">
            Origem dos Leads
          </p>

          {leadSources.map((source) => (
            <div key={source.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: source.color }}
                  />
                  <span>{source.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    {source.count} leads
                  </span>
                  <span className="font-bold text-slate-900 w-8 text-right">
                    {source.percentage}%
                  </span>
                </div>
              </div>

              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${source.percentage}%`,
                    backgroundColor: source.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Canal com maior conversão: <strong className="text-slate-800">Indicação (31%)</strong></span>
      </div>
    </div>
  );
};
