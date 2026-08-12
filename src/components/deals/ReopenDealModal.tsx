import React, { useState } from "react";
import { RotateCcw, X, GitBranch } from "lucide-react";
import { DealItem } from "../../types/crm";
import { MOCK_PIPELINES } from "../../data/mockPipelinesData";

interface ReopenDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DealItem | null;
  onConfirm: (
    pipelineId: string,
    stageId: string,
    stageName: string,
    probability: number
  ) => void;
}

export const ReopenDealModal: React.FC<ReopenDealModalProps> = ({
  isOpen,
  onClose,
  deal,
  onConfirm,
}) => {
  const [pipelineId, setPipelineId] = useState("pipe-b2b");
  const [stageId, setStageId] = useState("stg-qual");

  if (!isOpen || !deal) return null;

  const activePipe = MOCK_PIPELINES.find((p) => p.id === pipelineId) || MOCK_PIPELINES[0];

  const handlePipelineChange = (pId: string) => {
    setPipelineId(pId);
    const pipe = MOCK_PIPELINES.find((p) => p.id === pId);
    if (pipe && pipe.stages.length > 0) {
      setStageId(pipe.stages[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stg = activePipe.stages.find((s) => s.id === stageId) || activePipe.stages[0];
    onConfirm(pipelineId, stg.id, stg.name, stg.probability);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-blue-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Reabrir Negócio</h3>
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
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5" /> Selecione o Funil / Pipeline
            </label>
            <select
              value={pipelineId}
              onChange={(e) => handlePipelineChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
            >
              {MOCK_PIPELINES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Etapa Inicial para Reabertura
            </label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
            >
              {activePipe.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.probability}%)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs"
            >
              Confirmar Reabertura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
