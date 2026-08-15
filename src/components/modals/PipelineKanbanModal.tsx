import React from "react";
import { X, Filter, Plus } from "lucide-react";
import { PipelineStage } from "../../types/crm";

interface PipelineKanbanModalProps {
  stages: PipelineStage[];
  onClose: () => void;
  onOpenNewDeal: () => void;
}

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const PipelineKanbanModal: React.FC<PipelineKanbanModalProps> = ({ stages, onClose, onOpenNewDeal }) => <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 backdrop-blur-xs sm:p-4">
  <div className="flex h-[85vh] w-full max-w-6xl flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
    <div className="flex shrink-0 items-center justify-between border-b border-slate-100 pb-4">
      <div className="flex items-center gap-2"><div className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-600"><Filter className="h-5 w-5" /></div><div><h3 className="text-base font-bold text-slate-900 sm:text-lg">Resumo do pipeline</h3><p className="text-xs text-slate-500">Valores e contagens derivados dos negócios reais da organização ativa.</p></div></div>
      <div className="flex items-center gap-2"><button onClick={onOpenNewDeal} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white"><Plus className="h-4 w-4" />Novo negócio</button><button onClick={onClose} className="rounded-full bg-slate-100 p-1.5 text-slate-500"><X className="h-4 w-4" /></button></div>
    </div>
    <div className="flex-1 overflow-x-auto py-4"><div className="flex min-w-full gap-3">
      {stages.map((stage) => <div key={stage.id} className="flex w-64 shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-slate-50 p-3 sm:w-72"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} /><span className="text-xs font-extrabold text-slate-900">{stage.name}</span></div><span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-700">{stage.dealsCount}</span></div><div className="mt-3 border-b border-slate-200 pb-3 text-[11px] font-bold text-indigo-700">Total: {money.format(stage.totalValue)}</div><p className="py-8 text-center text-xs text-slate-500">Abra Negócios para ver e movimentar os cards reais desta etapa.</p></div>)}
    </div></div>
  </div>
</div>;
