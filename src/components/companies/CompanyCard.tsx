import React, { useState } from "react";
import {
  MoreVertical,
  Building2,
  Eye,
  Edit2,
  Briefcase,
  UserPlus,
  Archive,
  Users,
  Clock,
  ChevronRight,
} from "lucide-react";
import { CompanyItem } from "../../types/crm";
import { CompanyStatusBadge } from "./CompanyStatusBadge";

interface CompanyCardProps {
  company: CompanyItem;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
  onOpenDrawer: (company: CompanyItem) => void;
  onEditCompany: (company: CompanyItem) => void;
  onCreateDeal: (company: CompanyItem) => void;
  onCreateContact: (company: CompanyItem) => void;
  onArchiveCompany: (company: CompanyItem) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  isSelected,
  onSelectToggle,
  onOpenDrawer,
  onEditCompany,
  onCreateDeal,
  onCreateContact,
  onArchiveCompany,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const calculatePipeline = (c: CompanyItem) => {
    if (!c.deals) return 0;
    return c.deals
      .filter((d) => d.status === "open")
      .reduce((acc, d) => acc + (d.value || 0), 0);
  };

  const openDealsCount = company.deals ? company.deals.filter((d) => d.status === "open").length : 0;
  const contactsCount = company.contacts ? company.contacts.length : 0;
  const pipelineVal = calculatePipeline(company);

  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 ${
        isSelected ? "ring-2 ring-indigo-600/30 bg-indigo-50/20" : ""
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectToggle(company.id)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 mt-1 cursor-pointer shrink-0"
          />

          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold shrink-0 shadow-2xs">
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <button
              onClick={() => onOpenDrawer(company)}
              className="font-bold text-slate-900 text-base hover:text-indigo-600 text-left truncate block max-w-[200px]"
            >
              {company.name}
            </button>
            <div className="text-xs font-medium text-slate-500 truncate mt-0.5">
              {company.segment}
              {company.city && ` • ${company.city}`}
            </div>
          </div>
        </div>

        {/* Menu Contextual */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 py-1.5 text-xs font-semibold text-slate-700 animate-in fade-in duration-100">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenDrawer(company);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                >
                  <Eye className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Visão 360° da Conta</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEditCompany(company);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                >
                  <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>Editar Cadastro</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onCreateDeal(company);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-purple-700 font-bold"
                >
                  <Briefcase className="h-3.5 w-3.5 text-purple-600" />
                  <span>Criar Negócio</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
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
                    setMenuOpen(false);
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
      </div>

      {/* Row 2: Status & Owner */}
      <div className="flex items-center justify-between gap-2 py-2 border-y border-slate-100 my-2">
        <CompanyStatusBadge status={company.status} />

        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          {company.ownerAvatar ? (
            <img
              src={company.ownerAvatar}
              alt={company.ownerName}
              className="h-5 w-5 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
              {company.ownerName.charAt(0)}
            </div>
          )}
          <span className="font-semibold text-slate-800">{company.ownerName}</span>
        </div>
      </div>

      {/* Row 3: Metrics Grid (Contatos, Negócios, Pipeline) */}
      <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 rounded-xl my-2 border border-slate-100">
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Contatos</span>
          <span className="text-sm font-extrabold text-slate-800">{contactsCount}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Negócios</span>
          <span className="text-sm font-extrabold text-purple-700">{openDealsCount}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Pipeline</span>
          <span className="text-sm font-extrabold text-emerald-700">
            {pipelineVal > 0 ? `R$ ${pipelineVal.toLocaleString("pt-BR")}` : "R$ 0"}
          </span>
        </div>
      </div>

      {/* Row 4: Activity & Task */}
      <div className="space-y-1.5 text-xs font-medium text-slate-600 pt-1">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate text-slate-700">
            {company.lastActivityText || "Sem atividade recente"}
          </span>
        </div>

        {company.nextTaskText && (
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-800 font-semibold text-[11px] truncate">
            Próxima: {company.nextTaskText}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
        <button
          onClick={() => onOpenDrawer(company)}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <span>Abrir Visão 360°</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
