import React from "react";
import { X, Filter, Building2, Plus, ArrowRight } from "lucide-react";
import { PipelineStage } from "../../types/crm";

interface PipelineKanbanModalProps {
  stages: PipelineStage[];
  onClose: () => void;
  onOpenNewDeal: () => void;
}

export const PipelineKanbanModal: React.FC<PipelineKanbanModalProps> = ({
  stages,
  onClose,
  onOpenNewDeal,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const mockDealsByStage: Record<string, { company: string; value: string; rep: string }[]> = {
    "stage-qual": [
      { company: "Inova Varejo", value: "R$ 45.000", rep: "Mariana" },
      { company: "Delta Logística", value: "R$ 38.000", rep: "Lucas" },
      { company: "BioHealth B2B", value: "R$ 92.000", rep: "Camila" },
    ],
    "stage-diag": [
      { company: "TechWave Sistemas", value: "R$ 84.500", rep: "Lucas" },
      { company: "Grupamento Sol", value: "R$ 130.000", rep: "Rafael" },
    ],
    "stage-prop": [
      { company: "Grupo Horizonte", value: "R$ 31.500", rep: "Mariana" },
      { company: "Sistemas OnLine", value: "R$ 166.500", rep: "Camila" },
    ],
    "stage-neg": [
      { company: "Construtora Atlas", value: "R$ 48.000", rep: "Mariana" },
      { company: "Nexora Logística", value: "R$ 62.000", rep: "Camila" },
      { company: "Rede Max", value: "R$ 77.800", rep: "Lucas" },
    ],
    "stage-fech": [
      { company: "Projeto Nexora", value: "R$ 62.000", rep: "Camila" },
      { company: "Alpha Indústria", value: "R$ 5.000", rep: "Rafael" },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-6xl w-full h-[85vh] p-4 sm:p-6 shadow-2xl border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Pré-visualização do Pipeline de Vendas
              </h3>
              <p className="text-xs text-slate-500">
                Visão demonstrativa das 47 oportunidades ativas. A gestão completa do Kanban pertence ao módulo Negócios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewDeal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>+ Novo Negócio</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Kanban Board Columns */}
        <div className="flex-1 overflow-x-auto py-4 flex gap-3 custom-scrollbar">
          {stages.map((stage) => {
            const cards = mockDealsByStage[stage.id] || [];

            return (
              <div
                key={stage.id}
                className="w-64 sm:w-72 shrink-0 bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-xs font-extrabold text-slate-900">
                        {stage.name}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-slate-700 rounded border border-slate-200">
                      {stage.dealsCount}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-indigo-700 pb-2 mb-3 border-b border-slate-200">
                    Total: {formatCurrency(stage.totalValue)}
                  </div>

                  {/* Cards */}
                  <div className="space-y-2">
                    {cards.map((card, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer"
                      >
                        <p className="text-xs font-bold text-slate-900">
                          {card.company}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px]">
                          <span className="font-extrabold text-slate-800">
                            {card.value}
                          </span>
                          <span className="text-slate-400 font-medium">
                            Resp: {card.rep}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={onOpenNewDeal}
                  className="w-full mt-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl border border-dashed border-slate-300 transition-colors text-center"
                >
                  + Adicionar cartão
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
