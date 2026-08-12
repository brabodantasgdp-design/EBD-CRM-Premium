import React from "react";
import { Filter, ChevronRight, ArrowRight } from "lucide-react";
import { PipelineStage } from "../../types/crm";

interface PipelineOverviewProps {
  stages: PipelineStage[];
  onOpenPipelineModal: () => void;
}

export const PipelineOverview: React.FC<PipelineOverviewProps> = ({
  stages,
  onOpenPipelineModal,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const totalPipelineValue = stages.reduce((acc, s) => acc + s.totalValue, 0);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Visão do pipeline
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                Funil Ativo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              47 negócios acumulando {formatCurrency(totalPipelineValue)}
            </p>
          </div>

          <button
            onClick={onOpenPipelineModal}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>Ver pipeline completo</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Funnel Stage Horizontal Bars */}
        <div className="space-y-3">
          {stages.map((stage, idx) => {
            const widthPercent = Math.max(
              25,
              Math.min(100, (stage.totalValue / 220000) * 100)
            );

            return (
              <div key={stage.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span>{stage.name}</span>
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-md">
                      {stage.dealsCount} negócios
                    </span>
                  </div>
                  <span className="font-extrabold text-slate-900">
                    {formatCurrency(stage.totalValue)}
                  </span>
                </div>

                {/* Progress bar container */}
                <div className="h-3.5 w-full bg-slate-100 rounded-lg p-0.5 relative overflow-hidden flex items-center">
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                  <span className="absolute right-2 text-[9px] font-bold text-slate-500">
                    Conv: {stage.conversionRatePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end text-xs text-slate-500 font-medium">
        <button
          onClick={onOpenPipelineModal}
          className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline"
        >
          <span>Ver pipeline completo</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
