import React from "react";
import { Users, Sparkles, CheckCircle2, PhoneCall, TrendingUp, AlertCircle } from "lucide-react";
import { LeadSummaryMetrics } from "../../data/mockLeadsData";

interface LeadMetricsProps {
  metrics: LeadSummaryMetrics;
}

export const LeadMetrics: React.FC<LeadMetricsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 my-3">
      {/* Total de leads */}
      <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
          <Users className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500 truncate">Total de leads</p>
          <p className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {metrics.totalLeads}
          </p>
        </div>
      </div>

      {/* Novos no período */}
      <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500 truncate">Novos no período</p>
          <p className="text-base sm:text-lg font-bold text-blue-900 tracking-tight leading-tight">
            {metrics.newInPeriod}
          </p>
        </div>
      </div>

      {/* Qualificados */}
      <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500 truncate">Qualificados</p>
          <p className="text-base sm:text-lg font-bold text-emerald-900 tracking-tight leading-tight">
            {metrics.qualified}
          </p>
        </div>
      </div>

      {/* Em contato */}
      <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
          <PhoneCall className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500 truncate">Em contato</p>
          <p className="text-base sm:text-lg font-bold text-amber-900 tracking-tight leading-tight">
            {metrics.inContact}
          </p>
        </div>
      </div>

      {/* Conversão em oportunidade */}
      <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500 truncate">Taxa conversão</p>
          <p className="text-base sm:text-lg font-bold text-indigo-900 tracking-tight leading-tight">
            {metrics.conversionRatePercent}%
          </p>
        </div>
      </div>

      {/* Sem atividade */}
      <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500 truncate">Sem atividade</p>
          <p className="text-base sm:text-lg font-bold text-rose-900 tracking-tight leading-tight">
            {metrics.noActivityCount}
          </p>
        </div>
      </div>
    </div>
  );
};
