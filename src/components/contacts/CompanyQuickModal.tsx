import React from "react";
import { Building2, X, Info, ExternalLink, Briefcase, Users, ShieldAlert } from "lucide-react";
import { ContactCompany } from "../../types/crm";

interface CompanyQuickModalProps {
  companyName: string;
  companyData?: ContactCompany;
  onClose: () => void;
}

export const CompanyQuickModal: React.FC<CompanyQuickModalProps> = ({
  companyName,
  companyData,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {companyName}
              </h3>
              <p className="text-xs text-slate-500">Visualização de Empresa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="py-4 space-y-3.5">
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-start gap-2.5">
            <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-900 leading-relaxed font-medium">
              Módulo de <strong>Gestão de Empresas</strong> em desenvolvimento no roadmap. As informações abaixo referem-se à conta vinculada no CRM.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Razão Social:</span>
              <span className="font-bold text-slate-900">{companyName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Segmento:</span>
              <span className="font-semibold text-slate-800">
                {companyData?.segment || "Tecnologia & Serviços B2B"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Porte Estimado:</span>
              <span className="font-semibold text-slate-800">
                {companyData?.size || "100–250 funcionários"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Negócios Ativos:</span>
              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {companyData?.openDealsCount ?? 1} oportunidade(s)
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
};
