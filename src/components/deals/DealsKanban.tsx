import React, { useState } from "react";
import {
  MoreVertical,
  Building2,
  User,
  Calendar,
  AlertCircle,
  Tag,
  ArrowRight,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { DealItem } from "../../types/crm";
import { PipelineConfig, PipelineStageConfig } from "../../data/mockPipelinesData";

interface DealsKanbanProps {
  pipeline: PipelineConfig;
  deals: DealItem[];
  onUpdateDealStage: (dealId: string, stage: PipelineStageConfig) => void;
  onOpenDetail: (deal: DealItem) => void;
  onOpenCreateInStage: (stage: PipelineStageConfig) => void;
}

export const DealsKanban: React.FC<DealsKanbanProps> = ({
  pipeline,
  deals,
  onUpdateDealStage,
  onOpenDetail,
  onOpenCreateInStage,
}) => {
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [moveMenuDealId, setMoveMenuDealId] = useState<string | null>(null);

  // Group deals by stageId or match stageName
  const getDealsForStage = (stage: PipelineStageConfig) => {
    return deals.filter(
      (d) =>
        d.stageId === stage.id ||
        (d.stageName &&
          d.stageName.toLowerCase().trim() === stage.name.toLowerCase().trim())
    );
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("text/plain", dealId);
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStageId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: PipelineStageConfig) => {
    e.preventDefault();
    setDragOverStageId(null);
    const dealId = e.dataTransfer.getData("text/plain") || draggedDealId;
    if (dealId) {
      onUpdateDealStage(dealId, targetStage);
    }
    setDraggedDealId(null);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);

  const getStageColorBadge = (color: string) => {
    switch (color) {
      case "slate":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "blue":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "indigo":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "amber":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "emerald":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "sky":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "purple":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "violet":
        return "bg-violet-50 text-violet-700 border-violet-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-max">
        {pipeline.stages.map((stage) => {
          const stageDeals = getDealsForStage(stage);
          const stageTotalValue = stageDeals.reduce(
            (acc, d) => acc + (d.value || 0),
            0
          );
          const isDragTarget = dragOverStageId === stage.id;

          return (
            <div
              key={stage.id}
              data-testid={`kanban-stage-${stage.id}`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
              className={`w-80 shrink-0 flex flex-col rounded-2xl bg-slate-100/70 border transition-all ${
                isDragTarget
                  ? "border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-400/30"
                  : "border-slate-200/80"
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200/80 bg-white rounded-t-2xl">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getStageColorBadge(
                        stage.color
                      )}`}
                    >
                      {stage.name}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                      {stageDeals.length}
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-400">
                    {stage.probability}% prob.
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(stageTotalValue)}
                  </span>

                  <button
                    type="button"
                    onClick={() => onOpenCreateInStage(stage)}
                    title="Adicionar negócio nesta etapa"
                    className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Column Content / Cards List */}
              <div className="p-3 flex-1 min-h-[450px] space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
                {stageDeals.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs text-slate-400 font-medium">
                      Nenhum negócio nesta etapa.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenCreateInStage(stage)}
                      className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      + Criar negócio
                    </button>
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const isDragging = draggedDealId === deal.id;

                    return (
                      <div
                        key={deal.id}
                        data-testid={`kanban-card-${deal.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        className={`bg-white rounded-xl border p-3.5 shadow-2xs hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing ${
                          isDragging ? "opacity-40 border-indigo-300" : "border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        {/* Header: Deal Name & Quick Actions Menu */}
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(deal)}
                            className="text-left font-bold text-slate-900 hover:text-indigo-600 text-sm leading-snug line-clamp-2 transition-colors cursor-pointer"
                          >
                            {deal.name}
                          </button>

                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMoveMenuDealId(
                                  moveMenuDealId === deal.id ? null : deal.id
                                );
                              }}
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                              title="Opções de movimentação"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Move stage dropdown for accessibility / mobile */}
                            {moveMenuDealId === deal.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMoveMenuDealId(null);
                                  }}
                                />
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 divide-y divide-slate-100">
                                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Mover para etapa
                                  </div>
                                  <div className="py-1">
                                    {pipeline.stages.map((stg) => (
                                      <button
                                        key={stg.id}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onUpdateDealStage(deal.id, stg);
                                          setMoveMenuDealId(null);
                                        }}
                                        disabled={
                                          stg.id === stage.id ||
                                          stg.name === deal.stageName
                                        }
                                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer ${
                                          stg.id === stage.id
                                            ? "text-slate-400 font-medium bg-slate-50 cursor-default"
                                            : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                                        }`}
                                      >
                                        <span>{stg.name}</span>
                                        {stg.id !== stage.id && (
                                          <ArrowRight className="w-3 h-3 text-slate-400" />
                                        )}
                                      </button>
                                    ))}
                                  </div>

                                  <div className="p-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenDetail(deal);
                                        setMoveMenuDealId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                    >
                                      Abrir detalhe 360°
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Value & Status Badges */}
                        <div className="flex items-center justify-between mt-2 mb-2.5">
                          <span className="text-base font-extrabold text-slate-900">
                            {deal.formattedValue || formatCurrency(deal.value)}
                          </span>

                          {deal.status === "won" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Ganho
                            </span>
                          )}

                          {deal.status === "lost" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" /> Perdido
                            </span>
                          )}
                        </div>

                        {/* Relationships: Company & Contact */}
                        <div className="space-y-1 mb-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                          {deal.companyName && (
                            <div className="flex items-center gap-1.5 font-medium text-slate-700 truncate">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{deal.companyName}</span>
                            </div>
                          )}

                          {deal.contactName && (
                            <div className="flex items-center gap-1.5 text-slate-500 truncate">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{deal.contactName}</span>
                            </div>
                          )}
                        </div>

                        {/* Next Task or Last Activity Indicator */}
                        {deal.nextTaskText ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-md text-[11px] font-medium text-amber-800 mb-2.5 line-clamp-1 border border-amber-200/60">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">
                              {deal.nextTaskText}
                            </span>
                          </div>
                        ) : deal.lastActivityText ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2.5 line-clamp-1">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {deal.lastActivityText}
                            </span>
                          </div>
                        ) : null}

                        {/* Footer: Close Date & Owner Avatar */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{deal.expectedCloseDate}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                              {(deal.ownerName || "U").charAt(0)}
                            </div>
                            <span className="font-medium text-slate-700 max-w-[80px] truncate">
                              {(deal.ownerName || "S").split(" ")[0]}
                            </span>
                          </div>
                        </div>

                        {/* Tags */}
                        {deal.tags && deal.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-2 pt-2 border-t border-slate-100">
                            {deal.tags.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                              >
                                <Tag className="w-2.5 h-2.5 text-slate-400" />
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
