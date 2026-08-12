import React, { useState } from "react";
import { Target, CheckCircle, TrendingUp, AlertCircle, Info } from "lucide-react";
import { ForecastData } from "../../types/crm";

interface ForecastCardProps {
  forecast: ForecastData;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({ forecast }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const closedPct = Math.min(100, (forecast.closedValue / forecast.monthlyGoal) * 100);
  const probablePct = Math.min(
    100 - closedPct,
    ((forecast.probableValue - forecast.closedValue) / forecast.monthlyGoal) * 100
  );
  const remainingPct = Math.max(0, 100 - closedPct - probablePct);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  Previsão de fechamento
                </h3>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(!showTooltip)}
                    className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors rounded"
                    aria-label="Informações sobre o Forecast"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                  {showTooltip && (
                    <div className="absolute left-0 top-6 w-60 p-2.5 bg-slate-900 text-white text-[11px] font-medium rounded-xl shadow-xl z-30 pointer-events-none leading-relaxed border border-slate-800">
                      Forecast ponderado considera o valor dos negócios multiplicado pela probabilidade estimada da etapa. (Conceito visual simulado)
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Meta do mês: <strong className="text-slate-800">{formatCurrency(forecast.monthlyGoal)}</strong>
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
            {closedPct.toFixed(1)}% Fechado
          </span>
        </div>

        {/* Forecast Segmented Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Progresso da Meta</span>
            <span className="text-indigo-600">
              Ponderado: {formatCurrency(forecast.probableValue)} ({forecast.probablePercent}%)
            </span>
          </div>

          <div className="h-4 w-full bg-slate-100 rounded-xl p-0.5 flex overflow-hidden border border-slate-200/60">
            {/* Fechado segment */}
            <div
              className="h-full bg-emerald-500 rounded-l-lg transition-all duration-500"
              style={{ width: `${closedPct}%` }}
              title={`Fechado: ${formatCurrency(forecast.closedValue)}`}
            />
            {/* Provavel segment */}
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${probablePct}%` }}
              title={`Provável: ${formatCurrency(forecast.probableValue - forecast.closedValue)}`}
            />
            {/* Restante segment */}
            <div
              className="h-full bg-slate-200 rounded-r-lg transition-all duration-500"
              style={{ width: `${remainingPct}%` }}
              title={`Restante para Meta: ${formatCurrency(forecast.remainingGoal)}`}
            />
          </div>

          {/* Bar Legend */}
          <div className="flex items-center justify-between text-[11px] pt-1 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-700 font-semibold">Fechado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <span className="text-slate-700 font-semibold">Provável</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="text-slate-500">Restante</span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Fechado</p>
            <p className="text-xs font-bold text-emerald-700 mt-0.5">
              {formatCurrency(forecast.closedValue)}
            </p>
          </div>
          <div className="border-x border-slate-200">
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Forecast</p>
            <p className="text-xs font-bold text-indigo-700 mt-0.5">
              {formatCurrency(forecast.probableValue)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Falta p/ Meta</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              {formatCurrency(forecast.remainingGoal)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer advice */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-800 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="text-[11px] font-medium leading-snug">
          Faltam apenas <strong>{formatCurrency(forecast.remainingGoal)}</strong> em vendas para bater a meta do mês.
        </span>
      </div>
    </div>
  );
};
