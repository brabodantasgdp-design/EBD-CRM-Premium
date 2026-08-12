import React from "react";
import { Building2, UserCheck, Target, Briefcase, AlertTriangle, DollarSign } from "lucide-react";
import { CompanySummaryMetrics } from "../../types/crm";

interface CompanyMetricsProps {
  metrics: CompanySummaryMetrics;
}

export const CompanyMetrics: React.FC<CompanyMetricsProps> = ({ metrics }) => {
  const cards = [
    {
      id: "total",
      label: "Total de Empresas",
      value: metrics.totalCompanies,
      subtext: "Organizações ativas na base",
      icon: Building2,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      id: "clientes",
      label: "Clientes",
      value: metrics.customers,
      subtext: "Contratos vigentes B2B",
      icon: UserCheck,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      id: "prospects",
      label: "Prospects",
      value: metrics.prospects,
      subtext: "Em prospecção comercial",
      icon: Target,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      id: "negocios",
      label: "Com Negócio Aberto",
      value: metrics.withOpenDeals,
      subtext: "Oportunidades em andamento",
      icon: Briefcase,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
    {
      id: "sem_atividade",
      label: "Sem Atividade (+30d)",
      value: metrics.withoutActivity,
      subtext: "Exigem reengajamento",
      icon: AlertTriangle,
      color: metrics.withoutActivity > 0 ? "text-amber-600 bg-amber-50 border-amber-100" : "text-slate-500 bg-slate-50 border-slate-100",
    },
    {
      id: "pipeline",
      label: "Pipeline das Empresas",
      value: metrics.formattedPipelineValue,
      subtext: "Soma das oportunidades ativas",
      icon: DollarSign,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      isHighlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
              card.isHighlight ? "ring-2 ring-emerald-500/20 bg-gradient-to-b from-white to-emerald-50/30" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500 truncate" title={card.label}>
                {card.label}
              </span>
              <div className={`p-2 rounded-xl border shrink-0 ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-1">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate" title={card.subtext}>
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
