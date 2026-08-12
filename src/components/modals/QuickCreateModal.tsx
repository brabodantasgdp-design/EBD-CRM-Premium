import React, { useState } from "react";
import { X, UserPlus, Briefcase, CheckSquare, PhoneCall, Sparkles } from "lucide-react";

interface QuickCreateModalProps {
  initialType?: string;
  onClose: () => void;
  onSubmitSuccess: (msg: string) => void;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  initialType = "lead",
  onClose,
  onSubmitSuccess,
}) => {
  const [activeType, setActiveType] = useState<string>(initialType);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let actionLabel = "Novo lead cadastrado com sucesso!";
    if (activeType === "deal") actionLabel = "Novo negócio adicionado ao pipeline!";
    if (activeType === "task") actionLabel = "Nova tarefa agendada!";
    if (activeType === "activity") actionLabel = "Atividade registrada com sucesso!";

    onSubmitSuccess(actionLabel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ação Rápida de Criação
              </h3>
              <p className="text-xs text-slate-500">
                Adicione registros ao seu CRM
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

        {/* Action Type Tabs */}
        <div className="grid grid-cols-4 gap-1.5 my-4 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveType("lead")}
            className={`flex flex-col items-center p-2 rounded-lg text-xs font-bold transition-all ${
              activeType === "lead"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserPlus className="h-4 w-4 mb-1" />
            Lead
          </button>
          <button
            type="button"
            onClick={() => setActiveType("deal")}
            className={`flex flex-col items-center p-2 rounded-lg text-xs font-bold transition-all ${
              activeType === "deal"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Briefcase className="h-4 w-4 mb-1" />
            Negócio
          </button>
          <button
            type="button"
            onClick={() => setActiveType("task")}
            className={`flex flex-col items-center p-2 rounded-lg text-xs font-bold transition-all ${
              activeType === "task"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckSquare className="h-4 w-4 mb-1" />
            Tarefa
          </button>
          <button
            type="button"
            onClick={() => setActiveType("activity")}
            className={`flex flex-col items-center p-2 rounded-lg text-xs font-bold transition-all ${
              activeType === "activity"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PhoneCall className="h-4 w-4 mb-1" />
            Atividade
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Empresa / Organização *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Grupo Horizonte, Nexora Corp..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contato Principal
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ex: Carlos Silva (Diretor de Compras)"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-900"
            />
          </div>

          {(activeType === "deal" || activeType === "lead") && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valor Estimado (R$)
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ex: 45.000"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-900"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações / Próximo Passo
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes relevantes da oportunidade..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-900"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/30 transition-all"
            >
              Salvar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
