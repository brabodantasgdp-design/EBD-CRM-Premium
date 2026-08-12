import React from "react";
import { ContactSummaryMetrics } from "../../types/crm";
import { Users, UserCheck, Award, Sparkles, Briefcase, Clock } from "lucide-react";

interface ContactMetricsProps {
  metrics: ContactSummaryMetrics;
}

export const ContactMetrics: React.FC<ContactMetricsProps> = ({ metrics }) => {
  const cards = [
    {
      id: "total",
      label: "Total de Contatos",
      value: metrics.totalContacts,
      subtext: "Base cadastrada",
      icon: Users,
      color: "bg-slate-50 text-slate-700 border-slate-200",
      iconColor: "text-slate-600 bg-slate-100",
    },
    {
      id: "active",
      label: "Contatos Ativos",
      value: metrics.activeContacts,
      subtext: "Relacionamento ativo",
      icon: UserCheck,
      color: "bg-emerald-50/50 text-emerald-900 border-emerald-200/60",
      iconColor: "text-emerald-600 bg-emerald-100/80",
    },
    {
      id: "customers",
      label: "Clientes",
      value: metrics.customers,
      subtext: "Contratos ativos",
      icon: Award,
      color: "bg-indigo-50/50 text-indigo-900 border-indigo-200/60",
      iconColor: "text-indigo-600 bg-indigo-100/80",
    },
    {
      id: "new",
      label: "Novos no Período",
      value: metrics.newInPeriod,
      subtext: "Período selecionado",
      icon: Sparkles,
      color: "bg-purple-50/50 text-purple-900 border-purple-200/60",
      iconColor: "text-purple-600 bg-purple-100/80",
    },
    {
      id: "deals",
      label: "Com Negócio Aberto",
      value: metrics.withOpenDeals,
      subtext: "Pipeline ativo",
      icon: Briefcase,
      color: "bg-amber-50/50 text-amber-900 border-amber-200/60",
      iconColor: "text-amber-600 bg-amber-100/80",
    },
    {
      id: "inactive",
      label: "Sem Atividade",
      value: metrics.withoutRecentActivity,
      subtext: "Há mais de 30 dias",
      icon: Clock,
      color: "bg-rose-50/50 text-rose-900 border-rose-200/60",
      iconColor: "text-rose-600 bg-rose-100/80",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`p-3 rounded-2xl border transition-all duration-200 hover:shadow-xs flex flex-col justify-between ${card.color}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-600 line-clamp-1">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-xl shrink-0 ${card.iconColor}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-black tracking-tight text-slate-900">
                {card.value}
              </div>
              <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
