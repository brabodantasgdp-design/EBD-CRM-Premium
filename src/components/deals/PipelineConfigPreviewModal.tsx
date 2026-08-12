import React from "react";
import { Settings, X, GitBranch, Layers, CheckCircle } from "lucide-react";
import { MOCK_PIPELINES } from "../../data/mockPipelinesData";

interface PipelineConfigPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PipelineConfigPreviewModal: React.FC<PipelineConfigPreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Gerenciar Pipelines & Etapas
              </h3>
              <p className="text-xs text-slate-500">
                Visualização do gerenciador de funis de vendas.
              </p>
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

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            O Nexus CRM permite criar múltiplos funis customizados e definir probabilidades de fechamento para cada etapa.
          </p>

          <div className="space-y-3">
            {MOCK_PIPELINES.map((p) => (
              <div
                key={p.id}
                className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <GitBranch className="w-4 h-4 text-indigo-600" />
                    <span>{p.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {p.stages.length} etapas
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {p.description}
                </p>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {p.stages.map((stg) => (
                    <span
                      key={stg.id}
                      className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-md flex items-center gap-1"
                    >
                      <Layers className="w-2.5 h-2.5 text-slate-400" />
                      {stg.name} ({stg.probability}%)
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2 text-xs text-amber-800">
            <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              A edição dinâmica de nomes, ordens e cores de etapas estará disponível no painel de <strong>Configurações do Sistema</strong>.
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
