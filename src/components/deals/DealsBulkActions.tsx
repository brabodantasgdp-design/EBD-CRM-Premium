import React, { useState } from "react";
import { GitBranch, User, Archive, X, Check } from "lucide-react";
import { PipelineStageConfig } from "../../data/mockPipelinesData";

interface DealsBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkUpdateStage: (stageId: string, stageName: string, probability: number) => void;
  onBulkUpdateOwner: (ownerId: string, ownerName: string) => void;
  onBulkArchive: () => void;
  availableStages: PipelineStageConfig[];
  availableOwners: { id: string; name: string }[];
}

export const DealsBulkActions: React.FC<DealsBulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  onBulkUpdateStage,
  onBulkUpdateOwner,
  onBulkArchive,
  availableStages,
  availableOwners,
}) => {
  const [showStageSelect, setShowStageSelect] = useState(false);
  const [showOwnerSelect, setShowOwnerSelect] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  if (selectedCount === 0) return null;

  const handleStageSelect = (stage: PipelineStageConfig) => {
    onBulkUpdateStage(stage.id, stage.name, stage.probability);
    setShowStageSelect(false);
  };

  const handleOwnerSelect = (owner: { id: string; name: string }) => {
    onBulkUpdateOwner(owner.id, owner.name);
    setShowOwnerSelect(false);
  };

  const handleConfirmArchive = () => {
    onBulkArchive();
    setShowArchiveConfirm(false);
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700 text-xs font-semibold">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            {selectedCount}
          </span>
          <span>{selectedCount === 1 ? "negócio selecionado" : "negócios selecionados"}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Change Stage */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowStageSelect(!showStageSelect);
                setShowOwnerSelect(false);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
              <span>Alterar Etapa</span>
            </button>

            {showStageSelect && (
              <div className="absolute bottom-full mb-2 left-0 w-52 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs font-medium">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Mover para etapa:
                </div>
                {availableStages.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStageSelect(s)}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{s.probability}%</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Change Owner */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowOwnerSelect(!showOwnerSelect);
                setShowStageSelect(false);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Alterar Responsável</span>
            </button>

            {showOwnerSelect && (
              <div className="absolute bottom-full mb-2 left-0 w-52 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs font-medium">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Atribuir responsável:
                </div>
                {availableOwners.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handleOwnerSelect(o)}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Archive Action */}
          <button
            type="button"
            onClick={() => setShowArchiveConfirm(true)}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span>Arquivar</span>
          </button>
        </div>

        {/* Clear selection button */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors ml-2 cursor-pointer"
          title="Cancelar seleção"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Confirmation Modal for Bulk Archiving */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Archive className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Arquivar {selectedCount} {selectedCount === 1 ? "negócio" : "negócios"}?
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Os negócios sairão das visualizações ativas, mas permanecerão preservados no sistema sem perda de dados ou histórico.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                Sim, Arquivar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
