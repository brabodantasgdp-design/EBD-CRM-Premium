import React, { useState } from "react";
import { X, Briefcase, Check, User } from "lucide-react";
import { ContactItem, ContactDeal } from "../../types/crm";
import { MOCK_OWNERS } from "../../data/mockContactsData";

interface CreateDealFromContactModalProps {
  contact: ContactItem;
  onClose: () => void;
  onSaveDeal: (newDeal: ContactDeal) => void;
  availableOwners?: { id: string; name: string; avatar: string }[];
}

export const CreateDealFromContactModal: React.FC<CreateDealFromContactModalProps> = ({
  contact,
  onClose,
  onSaveDeal,
  availableOwners = MOCK_OWNERS,
}) => {
  const [dealName, setDealName] = useState(`Oportunidade - ${contact.companyName || contact.fullName}`);
  const [pipelineName, setPipelineName] = useState("Vendas B2B Direct");
  const [stageName, setStageName] = useState("Diagnóstico");
  const [value, setValue] = useState("35000");
  const [expectedCloseDate, setExpectedCloseDate] = useState("30/09/2026");
  const [ownerId, setOwnerId] = useState<string>(contact.ownerId || availableOwners[0]?.id || "usr-1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numValue = parseFloat(value.replace(/\D/g, "")) || 0;
    const formattedVal = `R$ ${numValue.toLocaleString("pt-BR")}`;
    const selectedOwner = availableOwners.find((o) => o.id === ownerId) || {
      id: contact.ownerId,
      name: contact.ownerName,
    };

    const newDeal: ContactDeal = {
      id: `deal-${Date.now()}`,
      name: dealName.trim() || `Oportunidade ${contact.fullName}`,
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

    onSaveDeal(newDeal);
  };

  const currentSelectedOwner = availableOwners.find((o) => o.id === ownerId) || {
    name: contact.ownerName,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Criar Negócio para Contato
              </h3>
              <p className="text-xs text-slate-500">
                Vincule uma nova oportunidade ao contato
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nome da Oportunidade / Negócio *
            </label>
            <input
              type="text"
              required
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-indigo-600" />
              <span>Responsável Comercial *</span>
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
            >
              {availableOwners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} {owner.id === contact.ownerId ? "(Responsável do Contato)" : ""}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Herdado por padrão do responsável comercial do contato ({contact.ownerName}).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pipeline</label>
              <select
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="Vendas B2B Direct">Vendas B2B Direct</option>
                <option value="Vendas Complexas">Vendas Complexas</option>
                <option value="Customer Success">Customer Success</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Etapa Inicial</label>
              <select
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="Mapeamento">Mapeamento</option>
                <option value="Diagnóstico">Diagnóstico</option>
                <option value="Demonstração">Demonstração</option>
                <option value="Proposta">Proposta</option>
                <option value="Negociação">Negociação</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Valor Estimado (R$)</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ex: 45.000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Fechamento Previsto</label>
              <input
                type="text"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-slate-600">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Pré-preenchimento automático:</span>
            <div className="flex justify-between font-medium">
              <span>Contato Vinculado:</span>
              <span className="font-bold text-slate-900">{contact.fullName}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Empresa:</span>
              <span className="font-bold text-slate-900">{contact.companyName || "Sem empresa"}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Responsável Selecionado:</span>
              <span className="font-bold text-indigo-600">{currentSelectedOwner.name}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Criar Negócio Mock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
