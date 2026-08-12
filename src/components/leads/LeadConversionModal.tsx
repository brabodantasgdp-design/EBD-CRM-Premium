import React, { useState } from "react";
import { X, ArrowUpRight, Building2, User, DollarSign, CheckCircle2 } from "lucide-react";
import { LeadItem } from "../../types/crm";

interface LeadConversionModalProps {
  isOpen: boolean;
  lead: LeadItem | null;
  onClose: () => void;
  onConfirmConvert: (leadId: string, convertedData: any) => void;
}

export const LeadConversionModal: React.FC<LeadConversionModalProps> = ({
  isOpen,
  lead,
  onClose,
  onConfirmConvert,
}) => {
  const [contactName, setContactName] = useState(lead?.name || "");
  const [companyName, setCompanyName] = useState(
    lead?.company || "Empresa a definir"
  );
  const [dealName, setDealName] = useState(
    `Projeto Expansão ${lead?.company || lead?.name || "Novo Lead"}`
  );
  const [pipelineName, setPipelineName] = useState("Vendas B2B");
  const [stageName, setStageName] = useState("Qualificação");
  const [estimatedValue, setEstimatedValue] = useState("45000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !lead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onConfirmConvert(lead.id, {
        contactName,
        companyName,
        dealName,
        pipelineName,
        stageName,
        estimatedValue: parseFloat(estimatedValue) || 45000,
        convertedAt: new Date().toLocaleDateString("pt-BR"),
      });
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Converter Lead em Oportunidade
              </h2>
              <p className="text-xs text-emerald-100">
                Demonstração visual da vinculação de Contato, Empresa e Negócio no pipeline.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium leading-relaxed">
              Esta é uma simulação de conversão. Em produção, este fluxo gerará as entidades reais no banco de dados. No protótipo, o status do lead <strong>{lead.name}</strong> será alterado localmente para <strong>Convertido</strong> e a reconversão ficará bloqueada.
            </p>
          </div>

          {/* Contato Criado */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-indigo-600" />
              <span>Nome do Contato</span>
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-900"
            />
          </div>

          {/* Empresa Criada */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-indigo-600" />
              <span>Nome da Empresa</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-900"
            />
          </div>

          {/* Negócio Criado */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-indigo-600" />
              <span>Nome do Negócio / Oportunidade</span>
            </label>
            <input
              type="text"
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-900"
            />
          </div>

          {/* Grid: Pipeline, Etapa e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pipeline
              </label>
              <select
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-medium"
              >
                <option value="Vendas B2B">Vendas B2B</option>
                <option value="Expansão Base">Expansão Base</option>
                <option value="Parcerias">Parcerias</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Etapa
              </label>
              <select
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-medium"
              >
                <option value="Qualificação">Qualificação</option>
                <option value="Diagnóstico">Diagnóstico</option>
                <option value="Proposta">Proposta</option>
                <option value="Negociação">Negociação</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                <span>Valor (R$)</span>
              </label>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 font-medium"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-xs active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? "Convertendo..." : "Converter (Simulado)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
