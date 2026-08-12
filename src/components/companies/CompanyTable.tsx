import React, { useState } from "react";
import {
  MoreVertical,
  Eye,
  Edit2,
  PlusCircle,
  Briefcase,
  UserPlus,
  Archive,
  Building2,
  Users,
  DollarSign,
  Calendar,
  ExternalLink,
  ChevronRight,
  Clock,
} from "lucide-react";
import { CompanyItem } from "../../types/crm";
import { CompanyStatusBadge } from "./CompanyStatusBadge";

interface CompanyTableProps {
  companies: CompanyItem[];
  selectedIds: string[];
  onSelectToggle: (id: string) => void;
  onSelectAllToggle: () => void;
  onOpenDrawer: (company: CompanyItem) => void;
  onEditCompany: (company: CompanyItem) => void;
  onCreateDeal: (company: CompanyItem) => void;
  onCreateContact: (company: CompanyItem) => void;
  onArchiveCompany: (company: CompanyItem) => void;
}

export const CompanyTable: React.FC<CompanyTableProps> = ({
  companies,
  selectedIds,
  onSelectToggle,
  onSelectAllToggle,
  onOpenDrawer,
  onEditCompany,
  onCreateDeal,
  onCreateContact,
  onArchiveCompany,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const allSelected =
    companies.length > 0 && companies.every((c) => selectedIds.includes(c.id));
  const isIndeterminate =
    selectedIds.length > 0 && !allSelected;

  const calculatePipeline = (company: CompanyItem) => {
    if (!company.deals || company.deals.length === 0) return 0;
    return company.deals
      .filter((d) => d.status === "open")
      .reduce((acc, d) => acc + (d.value || 0), 0);
  };

  const getOpenDealsCount = (company: CompanyItem) => {
    if (!company.deals) return 0;
    return company.deals.filter((d) => d.status === "open").length;
  };

  const getContactsCount = (company: CompanyItem) => {
    return company.contacts ? company.contacts.length : 0;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={onSelectAllToggle}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 min-w-[200px]">Empresa</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Responsável</th>
              <th className="py-3 px-3 text-center">Contatos</th>
              <th className="py-3 px-3 text-center">Negócios</th>
              <th className="py-3 px-3 text-right">Pipeline</th>
              <th className="py-3 px-3">Última Atividade</th>
              <th className="py-3 px-3">Próxima Tarefa</th>
              <th className="py-3 px-3 text-center w-12">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {companies.map((company) => {
              const isSelected = selectedIds.includes(company.id);
              const pipelineVal = calculatePipeline(company);
              const openDealsCount = getOpenDealsCount(company);
              const contactsCount = getContactsCount(company);

              return (
                <tr
                  key={company.id}
                  className={`hover:bg-slate-50/80 transition-colors group ${
                    isSelected ? "bg-indigo-50/30" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectToggle(company.id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                    />
                  </td>

                  {/* Empresa (Nome + Segmento/Legal) */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold shrink-0 shadow-2xs mt-0.5">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => onOpenDrawer(company)}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-sm truncate block text-left max-w-[220px]"
                          title={company.name}
                        >
                          {company.name}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                          <span className="truncate max-w-[140px]">{company.segment}</span>
                          {company.address?.city && (
                            <>
                              <span>•</span>
                              <span>{company.address.city}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    <CompanyStatusBadge status={company.status} />
                  </td>

                  {/* Responsável */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {company.ownerAvatar ? (
                        <img
                          src={company.ownerAvatar}
                          alt={company.ownerName}
                          className="h-6 w-6 rounded-full object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {company.ownerName.charAt(0)}
                        </div>
                      )}
                      <span className="text-slate-800 font-semibold truncate text-[11px]" title={company.ownerName}>
                        {company.ownerName}
                      </span>
                    </div>
                  </td>

                  {/* Contatos */}
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                      <Users className="h-3 w-3 text-slate-400" />
                      {contactsCount}
                    </span>
                  </td>

                  {/* Negócios */}
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                        openDealsCount > 0
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Briefcase className="h-3 w-3" />
                      {openDealsCount}
                    </span>
                  </td>

                  {/* Pipeline */}
                  <td className="py-3.5 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                    {pipelineVal > 0 ? (
                      <span className="text-emerald-700">
                        R$ {pipelineVal.toLocaleString("pt-BR")}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">R$ 0</span>
                    )}
                  </td>

                  {/* Última Atividade */}
                  <td className="py-3.5 px-3 max-w-[160px]">
                    <div className="text-[11px] text-slate-700 font-medium truncate" title={company.lastActivityText || "Sem registros"}>
                      {company.lastActivityText || "Sem registros recentes"}
                    </div>
                    {company.daysWithoutActivity !== undefined && (
                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        <span>há {company.daysWithoutActivity}d</span>
                      </div>
                    )}
                  </td>

                  {/* Próxima Tarefa */}
                  <td className="py-3.5 px-3 max-w-[160px]">
                    {company.nextTaskText ? (
                      <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg truncate" title={company.nextTaskText}>
                        {company.nextTaskText}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-normal">Sem agendamentos</span>
                    )}
                  </td>

                  {/* Menu Contextual de Ações */}
                  <td className="py-3.5 px-3 text-center relative">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === company.id ? null : company.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Opções da empresa"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeMenuId === company.id && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 py-1.5 text-xs font-semibold text-slate-700 animate-in fade-in duration-100">
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onOpenDrawer(company);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                            >
                              <Eye className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Visão 360° da Conta</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onEditCompany(company);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                              <span>Editar Cadastro</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onCreateDeal(company);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-purple-700 font-bold"
                            >
                              <Briefcase className="h-3.5 w-3.5 text-purple-600" />
                              <span>Criar Negócio</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onCreateContact(company);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-blue-700"
                            >
                              <UserPlus className="h-3.5 w-3.5 text-blue-600" />
                              <span>Adicionar Contato</span>
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onArchiveCompany(company);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              <span>Arquivar Empresa</span>
                            </button>
                          </div>
                        </>
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
