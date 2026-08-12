import React, { useState } from "react";
import { XCircle, X, AlertTriangle } from "lucide-react";
import { DealItem } from "../../types/crm";
import { MOCK_LOSS_REASONS } from "../../data/mockPipelinesData";

interface MarkLostModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DealItem | null;
  onConfirm: (reason: string, note?: string) => void;
}

export const MarkLostModal: React.FC<MarkLostModalProps> = ({
  isOpen,
  onClose,
  deal,
  onConfirm,
}) => {
  const [reason, setReason] = useState(MOCK_LOSS_REASONS[0]);
  const [note, setNote] = useState("");

  if (!isOpen || !deal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason, note.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Marcar como Perdido
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">{deal.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Motivo Principal de Perda <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-hidden"
            >
              {MOCK_LOSS_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Observações / Detalhes do Feedback
            </label>
            <textarea
              rows={3}
              placeholder="Ex: O cliente optou pelo concorrente X por conta do preço e integração pronta..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-hidden resize-none"
            />
          </div>

          <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-100 flex items-start gap-2 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              O negócio mudará o status para <strong>Perdido</strong> e os KPIs comerciais do funil serão atualizados.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs"
            >
              Confirmar Perda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
