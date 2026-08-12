import React from "react";
import { ContactLifecycleStatus } from "../../types/crm";
import { CheckCircle2, UserCheck, UserX, Clock, Archive } from "lucide-react";

interface ContactStatusBadgeProps {
  status: ContactLifecycleStatus;
  archived?: boolean;
  className?: string;
}

export const ContactStatusBadge: React.FC<ContactStatusBadgeProps> = ({
  status,
  archived,
  className = "",
}) => {
  if (archived) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
      >
        <Archive className="h-3 w-3" />
        <span>Arquivado</span>
      </span>
    );
  }

  switch (status) {
    case "active":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${className}`}
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          <span>Ativo</span>
        </span>
      );
    case "customer":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${className}`}
        >
          <UserCheck className="h-3 w-3 text-indigo-600" />
          <span>Cliente</span>
        </span>
      );
    case "inactive":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
        >
          <Clock className="h-3 w-3 text-slate-500" />
          <span>Inativo</span>
        </span>
      );
    case "former_customer":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 ${className}`}
        >
          <UserX className="h-3 w-3 text-amber-600" />
          <span>Ex-cliente</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
        >
          <span>{status}</span>
        </span>
      );
  }
};
