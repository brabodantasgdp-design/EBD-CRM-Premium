import React, { useState } from "react";
import { X, Briefcase, Check, User, Building2, Users } from "lucide-react";
import { CompanyItem, ContactDeal, ContactItem } from "../../types/crm";
import { MOCK_OWNERS } from "../../data/mockContactsData";
import { useCRM } from "../../context/CRMContext";
import { hasSupabaseConfiguration } from "../../lib/supabase/env";

interface CreateDealFromCompanyModalProps {
  company: CompanyItem;
  availableContacts?: ContactItem[];
  availableOwners?: { id: string; name: string; avatar: string }[];
  onClose: () => void;
  onSaveDeal: (newDeal: ContactDeal, selectedContactId?: string) => void;
}

export const CreateDealFromCompanyModal: React.FC<CreateDealFromCompanyModalProps> = ({
  company,
  availableContacts = [],
  availableOwners = MOCK_OWNERS,
  onClose,
  onSaveDeal,
}) => {
  const { members } = useCRM();
  const owners = hasSupabaseConfiguration() ? members : availableOwners;
  const [dealName, setDealName] = useState(`Oportunidade - ${company.name}`);
  const [pipelineName, setPipelineName] = useState("Vendas B2B Complexas");
  const [stageName, setStageName] = useState("Qualificação");
  const [value, setValue] = useState("48000");
  const [expectedCloseDate, setExpectedCloseDate] = useState("30/09/2026");
  const [ownerId, setOwnerId] = useState<string>(
    company.ownerId || owners[0]?.id || "usr-1"
  );
  const [selectedContactId, setSelectedContactId] = useState<string>(
    availableContacts[0]?.id || ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numValue = parseFloat(value.replace(/\D/g, "")) || 0;
    const formattedVal = `R$ ${numValue.toLocaleString("pt-BR")}`;
    const selectedOwner = owners.find((o) => o.id === ownerId) || {
      id: company.ownerId,
      name: company.ownerName,
    };

    const newDeal: ContactDeal = {
      id: `deal-${Date.now()}`,
      name: dealName.trim() || `Oportunidade - ${company.name}`,
      value: numValue,
      formattedValue: formattedVal,
      pipelineName: pipelineName,
      stageName: stageName,
      assigneeName: selectedOwner.name,
      ownerId: selectedOwner.id,
      ownerName: selectedOwner.name,
      expectedCloseDate: expectedCloseDate,
      status: "open",
    };

    onSaveDeal(newDeal, selectedContactId || undefined);
  };

  const currentSelectedOwner = availableOwners.find((o) => o.id === ownerId) || {
    name: company.ownerName,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-2xl text-purple-600 border border-purple-100">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Criar Negócio na Empresa
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Vinculado automaticamente a <strong className="text-slate-800">{company.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nome da Oportunidade *
            </label>
            <input
              type="text"
              required
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              placeholder="Ex: Licenciamento Nexus CRM Enterprise"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600"
            />
          </div>

          {/* Contact Selector */}
          {availableContacts.length > 0 && (
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span>Contato Principal Vinculado (Opcional)</span>
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600"
              >
                <option value="">Nenhum contato específico</option>
                {availableContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.jobTitle || "Sem cargo"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Owner Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-indigo-600" />
              <span>Responsável Comercial *</span>
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600"
            >
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} {owner.id === company.ownerId ? "(Responsável da Empresa)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pipeline</label>
              <select
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              >
                <option value="Vendas B2B Complexas">Vendas B2B Complexas</option>
                <option value="Customer Success & Expansão">Customer Success & Expansão</option>
                <option value="Prospecção Direta">Prospecção Direta</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Etapa</label>
              <select
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              >
                <option value="Qualificação">Qualificação</option>
                <option value="Diagnóstico">Diagnóstico</option>
                <option value="Proposta">Proposta Comercial</option>
                <option value="Negociação">Negociação</option>
                <option value="Fechamento">Fechamento</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Valor Estimado (R$)
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="48000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Previsão de Fechamento
              </label>
              <input
                type="text"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                placeholder="30/09/2026"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600"
              />
            </div>
          </div>

          {/* Context Banner */}
          <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl text-[11px] text-purple-900 space-y-1">
            <div className="flex justify-between font-medium">
              <span>Empresa Vinculada:</span>
              <span className="font-bold text-slate-900">{company.name}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Responsável Selecionado:</span>
              <span className="font-bold text-indigo-600">{currentSelectedOwner.name}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Criar Oportunidade</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
