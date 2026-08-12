import React, { useState } from "react";
import {
  Building2,
  User,
  Calendar,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Eye,
  Edit2,
  Clock,
  RotateCcw,
  Archive,
} from "lucide-react";
import { DealItem } from "../../types/crm";

interface DealsTableProps {
  deals: DealItem[];
  onOpenDetail: (deal: DealItem) => void;
  onEditDeal: (deal: DealItem) => void;
  onMarkWon: (deal: DealItem) => void;
  onMarkLost: (deal: DealItem) => void;
  onReopen: (deal: DealItem) => void;
  onArchiveDeal?: (deal: DealItem) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
}

export const DealsTable: React.FC<DealsTableProps> = ({
  deals,
  onOpenDetail,
  onEditDeal,
  onMarkWon,
  onMarkLost,
  onReopen,
  onArchiveDeal,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}) => {
  const [sortField, setSortField] = useState<"value" | "date" | "name">("value");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const handleSort = (field: "value" | "date" | "name") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedDeals = [...deals].sort((a, b) => {
    if (sortField === "value") {
      const valA = a.value || 0;
      const valB = b.value || 0;
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }
    if (sortField === "date") {
      const dateA = a.expectedCloseDate || "";
      const dateB = b.expectedCloseDate || "";
      return sortOrder === "asc"
        ? dateA.localeCompare(dateB)
        : dateB.localeCompare(dateA);
    }
    if (sortField === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    return 0;
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);

  if (deals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-base">Nenhum negócio encontrado</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Tente ajustar os filtros selecionados ou crie uma nova oportunidade comercial.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {onToggleSelect && (
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      sortedDeals.length > 0 &&
                      selectedIds?.length === sortedDeals.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectAll?.(sortedDeals.map((d) => d.id));
                      } else {
                        onSelectAll?.([]);
                      }
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
              )}
              <th className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>Negócio</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3.5 px-4">Empresa & Contato</th>
              <th className="py-3.5 px-4">Funil & Etapa</th>
              <th className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => handleSort("value")}
                  className="flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>Valor</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3.5 px-4">Responsável</th>
              <th className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => handleSort("date")}
                  className="flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>Fechamento</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {sortedDeals.map((deal) => {
              const isSelected = selectedIds?.includes(deal.id);
              return (
                <tr
                  key={deal.id}
                  data-testid={`deal-row-${deal.id}`}
                  onClick={() => onOpenDetail(deal)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                    isSelected ? "bg-indigo-50/40" : ""
                  }`}
                >
                  {onToggleSelect && (
                    <td
                      className="py-3.5 px-3 w-10 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(isSelected)}
                        onChange={() => onToggleSelect(deal.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                  )}
                  {/* Deal Name */}
                <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-indigo-600">
                  <div>{deal.name}</div>
                  {deal.source && (
                    <span className="text-[11px] font-normal text-slate-400">
                      Origem: {deal.source}
                    </span>
                  )}
                </td>

                {/* Company & Contact */}
                <td className="py-3.5 px-4">
                  <div className="flex flex-col text-xs">
                    {deal.companyName ? (
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {deal.companyName}
                      </span>
                    ) : (
                      <span className="text-slate-400">Sem empresa</span>
                    )}
                    {deal.contactName && (
                      <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        {deal.contactName}
                      </span>
                    )}
                  </div>
                </td>

                {/* Pipeline & Stage */}
                <td className="py-3.5 px-4">
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold text-indigo-700">
                      {deal.stageName}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {deal.pipelineName}
                    </span>
                  </div>
                </td>

                {/* Value */}
                <td className="py-3.5 px-4 font-extrabold text-slate-900">
                  {deal.formattedValue || formatCurrency(deal.value)}
                </td>

                {/* Owner */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      {(deal.ownerName || "U").charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-slate-700">
                      {deal.ownerName}
                    </span>
                  </div>
                </td>

                {/* Expected Close */}
                <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{deal.expectedCloseDate}</span>
                  </div>
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4">
                  {deal.status === "open" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                      Aberto
                    </span>
                  )}
                  {deal.status === "won" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ganho
                    </span>
                  )}
                  {deal.status === "lost" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                      <XCircle className="w-3.5 h-3.5" /> Perdido
                    </span>
                  )}
                </td>

                {/* Actions Dropdown */}
                <td className="py-3.5 px-4 text-right relative">
                  <button
                    data-testid={`deal-actions-${deal.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionMenuId(actionMenuId === deal.id ? null : deal.id);
                    }}
                    className="p-1.5 hover:bg-slate-200/80 text-slate-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {actionMenuId === deal.id && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuId(null);
                        }}
                      />
                      <div className="absolute right-4 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-left divide-y divide-slate-100">
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDetail(deal);
                              setActionMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            Ver Detalhe 360°
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditDeal(deal);
                              setActionMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            Editar Negócio
                          </button>
                        </div>

                        <div className="py-1">
                          {deal.status === "open" ? (
                            <>
                              <button
                                data-testid={`mark-deal-won-${deal.id}`}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkWon(deal);
                                  setActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Marcar como Ganho
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkLost(deal);
                                  setActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                Marcar como Perdido
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReopen(deal);
                                setActionMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 flex items-center gap-2 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                              Reabrir Negócio
                            </button>
                          )}
                          {onArchiveDeal && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onArchiveDeal(deal);
                                setActionMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                            >
                              <Archive className="w-3.5 h-3.5 text-amber-600" />
                              Arquivar Negócio
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-slate-100">
        {sortedDeals.map((deal) => (
          <div
            key={deal.id}
            onClick={() => onOpenDetail(deal)}
            className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-snug">
                  {deal.name}
                </h4>
                <div className="text-xs text-indigo-700 font-semibold mt-0.5">
                  {deal.stageName} ({deal.pipelineName})
                </div>
              </div>

              <span className="text-base font-extrabold text-slate-900 shrink-0">
                {deal.formattedValue || formatCurrency(deal.value)}
              </span>
            </div>

            <div className="mt-2.5 space-y-1 text-xs text-slate-600">
              {deal.companyName && (
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{deal.companyName}</span>
                </div>
              )}
              {deal.contactName && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{deal.contactName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1 text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Fechamento: {deal.expectedCloseDate}</span>
              </div>

              <div>
                {deal.status === "open" && (
                  <span className="text-blue-700 font-semibold">Aberto</span>
                )}
                {deal.status === "won" && (
                  <span className="text-emerald-700 font-bold">✓ Ganho</span>
                )}
                {deal.status === "lost" && (
                  <span className="text-rose-700 font-bold">✕ Perdido</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
