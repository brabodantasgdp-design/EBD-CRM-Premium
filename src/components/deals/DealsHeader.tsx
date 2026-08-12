import React, { useState } from "react";
import {
  Plus,
  LayoutGrid,
  List,
  GitBranch,
  Settings,
  ChevronDown,
  Kanban,
} from "lucide-react";
import { PipelineConfig, MOCK_PIPELINES } from "../../data/mockPipelinesData";

interface DealsHeaderProps {
  activePipeline: PipelineConfig;
  onSelectPipeline: (pipeline: PipelineConfig) => void;
  viewMode: "kanban" | "table";
  onViewModeChange: (mode: "kanban" | "table") => void;
  onOpenCreateModal: () => void;
  onOpenPipelineConfig: () => void;
}

export const DealsHeader: React.FC<DealsHeaderProps> = ({
  activePipeline,
  onSelectPipeline,
  viewMode,
  onViewModeChange,
  onOpenCreateModal,
  onOpenPipelineConfig,
}) => {
  const [pipelineDropdownOpen, setPipelineDropdownOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      {/* Title & Pipeline Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xs">
              <Kanban className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Gestão de Negócios
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie oportunidades, pipelines e previsões de fechamento.
          </p>
        </div>

        {/* Pipeline Selector Dropdown */}
        <div className="relative mt-2 sm:mt-0 sm:ml-4">
          <button
            type="button"
            data-testid="deals-kanban-view"
            onClick={() => setPipelineDropdownOpen(!pipelineDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl shadow-2xs font-semibold text-sm text-slate-800 transition-colors cursor-pointer"
          >
            <GitBranch className="w-4 h-4 text-indigo-600" />
            <span>{activePipeline.name}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {pipelineDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setPipelineDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 divide-y divide-slate-100">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Selecionar Funil
                </div>
                <div className="py-1">
                  {MOCK_PIPELINES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectPipeline(p);
                        setPipelineDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-sm flex items-start gap-2.5 transition-colors cursor-pointer ${
                        p.id === activePipeline.id
                          ? "bg-indigo-50/70 text-indigo-900 font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <GitBranch
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          p.id === activePipeline.id
                            ? "text-indigo-600"
                            : "text-slate-400"
                        }`}
                      />
                      <div>
                        <div className="font-medium leading-snug">{p.name}</div>
                        <div className="text-xs text-slate-500 font-normal line-clamp-1">
                          {p.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPipelineDropdownOpen(false);
                      onOpenPipelineConfig();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Gerenciar pipelines</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Actions: View Mode & Create Deal */}
      <div className="flex items-center gap-3">
        {/* View mode toggle */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl border border-slate-300/60">
          <button
            type="button"
            data-testid="deals-kanban-view"
            onClick={() => onViewModeChange("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "kanban"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
          <button
            type="button"
            data-testid="deals-list-view"
            onClick={() => onViewModeChange("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>
        </div>

        {/* Create Deal Primary Button */}
        <button
          data-testid="new-deal-button"
          type="button"
          onClick={onOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Negócio</span>
        </button>
      </div>
    </div>
  );
};
