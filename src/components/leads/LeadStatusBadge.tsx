import React from "react";
import { LeadStatus } from "../../types/crm";
import { Sparkles, PhoneCall, CheckCircle2, Clock, ArrowUpRight, XCircle } from "lucide-react";

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export const LeadStatusBadge: React.FC<LeadStatusBadgeProps> = ({ status, className = "" }) => {
  switch (status) {
    case "new":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shrink-0 ${className}`}
          title="Lead recém-chegado ao pipeline"
        >
          <Sparkles className="h-3 w-3 text-blue-500 shrink-0" />
          <span>Novo</span>
        </span>
      );
    case "contacted":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0 ${className}`}
          title="Primeiro contato em andamento"
        >
          <PhoneCall className="h-3 w-3 text-amber-500 shrink-0" />
          <span>Em contato</span>
        </span>
      );
    case "qualified":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 ${className}`}
          title="Lead qualificado com interesse confirmado"
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
          <span>Qualificado</span>
        </span>
      );
    case "nurturing":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 shrink-0 ${className}`}
          title="Em fluxo de nutrição de conteúdo"
        >
          <Clock className="h-3 w-3 text-purple-500 shrink-0" />
          <span>Nutrição</span>
        </span>
      );
    case "converted":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shrink-0 ${className}`}
          title="Convertido em Contato/Negócio"
        >
          <ArrowUpRight className="h-3 w-3 text-indigo-500 shrink-0" />
          <span>Convertido</span>
        </span>
      );
    case "disqualified":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shrink-0 ${className}`}
          title="Lead desqualificado"
        >
          <XCircle className="h-3 w-3 text-rose-500 shrink-0" />
          <span>Desqualificado</span>
        </span>
      );
    default:
      return null;
  }
};
