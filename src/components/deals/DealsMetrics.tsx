import React from "react";
import { TrendingUp, DollarSign, Target, CheckCircle2, Award, AlertCircle } from "lucide-react";
import { DealItem, PeriodOption } from "../../types/crm";
import { PipelineConfig } from "../../data/mockPipelinesData";

interface DealsMetricsProps {
  deals: DealItem[];
  activePipeline: PipelineConfig;
  currentPeriod: PeriodOption;
}

export const DealsMetrics: React.FC<DealsMetricsProps> = ({
  deals,
  activePipeline,
}) => {
  // Filter deals for current pipeline excluding archived ones
  const pipelineDeals = deals.filter(
    (d) =>
      !d.archivedAt &&
      !d.isArchived &&
      (d.pipelineId === activePipeline.id || !d.pipelineId)
  );

  // 1. Pipeline Aberto (Sum of open deals value in current pipeline)
  const openDeals = pipelineDeals.filter((d) => d.status === "open");
  const totalOpenValue = openDeals.reduce((acc, d) => acc + (d.value || 0), 0);
  const openCount = openDeals.length;

  // 2. Forecast Ponderado (Sum of value * probability / 100 for open deals)
  const weightedForecast = openDeals.reduce((acc, d) => {
    // find stage probability if not set on deal
    const stage = activePipeline.stages.find((s) => s.id === d.stageId || s.name === d.stageName);
    const prob = d.probability ?? stage?.probability ?? 50;
    return acc + (d.value || 0) * (prob / 100);
  }, 0);

  // 3. Ganhos no Período (Sum of won deals in current pipeline)
  const wonDeals = pipelineDeals.filter((d) => d.status === "won");
  const wonValue = wonDeals.reduce((acc, d) => acc + (d.value || 0), 0);
  const wonCount = wonDeals.length;

  // 4. Taxa de Ganho = won / (won + lost) * 100
  const lostDeals = pipelineDeals.filter((d) => d.status === "lost");
  const lostCount = lostDeals.length;
  const closedCount = wonCount + lostCount;
  const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

  // 5. Negócios sem Atividade (open deals without activity for > 5 days or flag)
  const idleDealsCount = openDeals.filter((d) => {
    if (!d.lastActivityAt) return true;
    return false; // could evaluate date diff
  }).length;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Pipeline Aberto */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Pipeline Aberto</span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-900 truncate">
            {formatCurrency(totalOpenValue)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">
            {openCount} {openCount === 1 ? "oportunidade aberta" : "oportunidades abertas"}
          </div>
        </div>
      </div>

      {/* 2. Negócios Abertos */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Abertos</span>
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-900">{openCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Em andamento no funil</div>
        </div>
      </div>

      {/* 3. Forecast Ponderado */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Forecast Ponderado</span>
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-purple-900 truncate">
            {formatCurrency(weightedForecast)}
          </div>
          <div className="text-xs text-purple-600/80 font-medium mt-0.5">Ponderado por probabilidade</div>
        </div>
      </div>

      {/* 4. Ganhos */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Ganhos</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-emerald-700 truncate">
            {formatCurrency(wonValue)}
          </div>
          <div className="text-xs text-emerald-600/80 font-medium mt-0.5">
            {wonCount} {wonCount === 1 ? "negócio fechado" : "negócios fechados"}
          </div>
        </div>
      </div>

      {/* 5. Taxa de Ganho */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Taxa de Ganho</span>
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-900">{winRate}%</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">
            {wonCount} ganho / {closedCount} finalizado(s)
          </div>
        </div>
      </div>

      {/* 6. Sem Atividade */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Atenção</span>
          <div className={`p-1.5 rounded-lg ${idleDealsCount > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"}`}>
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-900">{idleDealsCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Sem atividade recente</div>
        </div>
      </div>
    </div>
  );
};
