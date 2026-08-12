import React, { useState } from "react";
import { X, XCircle, AlertTriangle } from "lucide-react";
import { LeadItem, DisqualificationReason } from "../../types/crm";

interface LeadDisqualificationModalProps {
  isOpen: boolean;
  lead: LeadItem | null;
  onClose: () => void;
  onConfirmDisqualify: (
    leadId: string,
    reason: DisqualificationReason,
    note?: string
  ) => void;
}

export const LeadDisqualificationModal: React.FC<LeadDisqualificationModalProps> = ({
  isOpen,
  lead,
  onClose,
  onConfirmDisqualify,
}) => {
  if (!isOpen || !lead) return null;

  const [reason, setReason] = useState<DisqualificationReason>("Sem fit");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onConfirmDisqualify(lead.id, reason, note.trim());
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden z-10 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-rose-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-900">
                Desqualificar Lead
              </h2>
              <p className="text-xs text-rose-700">
                {lead.name} • {lead.company || "Sem empresa"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-100/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium leading-relaxed">
              Registrar o motivo exato de desqualificação é fundamental para alimentar os relatórios futuros de conversão e perda.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Motivo da Desqualificação <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) =>
                setReason(e.target.value as DisqualificationReason)
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="Sem fit">Sem fit (Perfil não aderente)</option>
              <option value="Sem orçamento">Sem orçamento para projeto</option>
              <option value="Sem interesse">Sem interesse demonstrado</option>
              <option value="Dados inválidos">Dados de contato inválidos</option>
              <option value="Duplicado">Lead duplicado na base</option>
              <option value="Concorrente">Optou por concorrente</option>
              <option value="Outro">Outro motivo</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Observações Adicionais (Opcional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Descreva brevemente o contexto da desqualificação..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
            />
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
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-xs active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? "Gravando..." : "Confirmar Desqualificação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
