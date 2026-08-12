import React from "react";
import { LeadItem } from "../../types/crm";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { MoreVertical, Eye, Edit3, ArrowUpRight, XCircle, Calendar, Building2 } from "lucide-react";

interface LeadTableProps {
  leads: LeadItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenDetail: (lead: LeadItem) => void;
  onOpenEdit: (lead: LeadItem) => void;
  onOpenConvert: (lead: LeadItem) => void;
  onOpenDisqualify: (lead: LeadItem) => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenDetail,
  onOpenEdit,
  onOpenConvert,
  onOpenDisqualify,
}) => {
  const isAllSelected = leads.length > 0 && selectedIds.length === leads.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < leads.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                />
              </th>
              <th className="py-3 px-3 min-w-[200px]">Lead / Contato</th>
              <th className="py-3 px-3 min-w-[160px]">Empresa & Cargo</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Lead Score</th>
              <th className="py-3 px-3 min-w-[130px]">Responsável</th>
              <th className="py-3 px-3 min-w-[140px]">Origem / Tarefa</th>
              <th className="py-3 px-3 whitespace-nowrap">Criado em</th>
              <th className="py-3 px-3 text-right w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {leads.map((lead) => {
              const isSelected = selectedIds.includes(lead.id);

              return (
                <tr
                  key={lead.id}
                  className={`group transition-colors hover:bg-slate-50/80 cursor-pointer ${
                    isSelected ? "bg-indigo-50/40" : ""
                  }`}
                  onClick={() => onOpenDetail(lead)}
                >
                  {/* Selection Checkbox */}
                  <td
                    className="py-3 px-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(lead.id)}
                      className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                    />
                  </td>

                  {/* 1. Lead / Contato (Nome da pessoa + email + fone) */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                        {lead.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {lead.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {lead.email || lead.phone || "Sem e-mail informado"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* 2. Empresa & Cargo */}
                  <td className="py-3 px-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{lead.company || "Sem empresa"}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {lead.jobTitle || "Cargo não informado"}
                      </p>
                    </div>
                  </td>

                  {/* 3. Status */}
                  <td className="py-3 px-3">
                    <LeadStatusBadge status={lead.status} />
                  </td>

                  {/* 4. Lead Score */}
                  <td className="py-3 px-3">
                    <LeadScoreBadge score={lead.score} />
                  </td>

                  {/* 5. Responsável */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {lead.ownerAvatar ? (
                        <img
                          src={lead.ownerAvatar}
                          alt={lead.ownerName}
                          className="h-5 w-5 rounded-full object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {lead.ownerName.charAt(0)}
                        </div>
                      )}
                      <span className="truncate font-medium text-slate-700">
                        {lead.ownerName}
                      </span>
                    </div>
                  </td>

                  {/* 6. Origem / Tarefa */}
                  <td className="py-3 px-3">
                    <div className="space-y-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold inline-block">
                        {lead.source}
                      </span>
                      {lead.nextTaskText && lead.nextTaskText !== "Nenhuma" ? (
                        <p className="text-[10px] text-indigo-700 font-medium truncate max-w-[130px] flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0 text-indigo-500" />
                          <span>{lead.nextTaskText}</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400">Sem tarefas</p>
                      )}
                    </div>
                  </td>

                  {/* 7. Criado em */}
                  <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                    {lead.createdAt}
                  </td>

                  {/* 8. Ações */}
                  <td
                    className="py-3 px-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onOpenDetail(lead)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Ver Detalhes do Lead"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onOpenEdit(lead)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Editar Lead"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      {lead.status !== "converted" ? (
                        <button
                          onClick={() => onOpenConvert(lead)}
                          className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Converter em Oportunidade"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <span
                          className="p-1 text-slate-300 cursor-not-allowed"
                          title="Lead já convertido"
                        >
                          <ArrowUpRight className="h-4 w-4 opacity-40" />
                        </span>
                      )}
                      {lead.status !== "disqualified" && (
                        <button
                          onClick={() => onOpenDisqualify(lead)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Desqualificar Lead"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
