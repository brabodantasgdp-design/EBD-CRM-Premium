import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  RotateCcw,
  ChevronDown,
  Tag,
  UserCheck,
  CheckSquare,
  AlertCircle,
} from "lucide-react";
import { LeadStatus, LeadSourceType } from "../../types/crm";
import { MOCK_OWNERS, MOCK_TAGS } from "../../data/mockLeadsData";

export interface FilterState {
  searchQuery: string;
  status: LeadStatus | "all";
  ownerId: string | "all";
  source: LeadSourceType | "all";
  tag: string | "all";
  scoreTier: "all" | "low" | "medium" | "high" | "very_high";
  hasPendingTask: boolean;
  noActivity: boolean;
  sortBy: "newest" | "oldest" | "score_desc" | "score_asc" | "activity" | "name";
}

interface LeadFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  viewMode: "table" | "cards";
  onViewModeChange: (mode: "table" | "cards") => void;
  totalFilteredCount: number;
}

export const LeadFilters: React.FC<LeadFiltersProps> = ({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  totalFilteredCount,
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const hasActiveFilters =
    filters.searchQuery.trim() !== "" ||
    filters.status !== "all" ||
    filters.ownerId !== "all" ||
    filters.source !== "all" ||
    filters.tag !== "all" ||
    filters.scoreTier !== "all" ||
    filters.hasPendingTask ||
    filters.noActivity;

  const handleResetFilters = () => {
    onFilterChange({
      ...filters,
      searchQuery: "",
      status: "all",
      ownerId: "all",
      source: "all",
      tag: "all",
      scoreTier: "all",
      hasPendingTask: false,
      noActivity: false,
    });
  };

  const getOwnerName = (id: string) => {
    return MOCK_OWNERS.find((o) => o.id === id)?.name || id;
  };

  return (
    <div className="space-y-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
      {/* Search & Main Action Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) =>
              onFilterChange({ ...filters, searchQuery: e.target.value })
            }
            placeholder="Buscar por nome, empresa, e-mail ou telefone"
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right Controls: Sort, Mobile Filters Trigger, View Mode Toggle */}
        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-start">
          {/* Sort Selector */}
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  sortBy: e.target.value as FilterState["sortBy"],
                })
              }
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="score_desc">Maior score</option>
              <option value="score_asc">Menor score</option>
              <option value="activity">Última atividade</option>
              <option value="name">Nome (A-Z)</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="sm:hidden relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
            )}
          </button>

          {/* View Mode Switcher (Table vs Cards) */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => onViewModeChange("table")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Visualização em Tabela"
            >
              <List className="h-4 w-4" />
              <span className="hidden md:inline text-[11px]">Tabela</span>
            </button>
            <button
              onClick={() => onViewModeChange("cards")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === "cards"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden md:inline text-[11px]">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Filter Dropdowns Bar */}
      <div className="hidden sm:flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value as FilterState["status"],
              })
            }
            className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-7 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="all">Status: Todos</option>
            <option value="new">Novo</option>
            <option value="contacted">Em contato</option>
            <option value="qualified">Qualificado</option>
            <option value="nurturing">Nutrição</option>
            <option value="converted">Convertido</option>
            <option value="disqualified">Desqualificado</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
        </div>

        {/* Responsável Filter */}
        <div className="relative">
          <select
            value={filters.ownerId}
            onChange={(e) =>
              onFilterChange({ ...filters, ownerId: e.target.value })
            }
            className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-7 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="all">Responsável: Todos</option>
            {MOCK_OWNERS.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
        </div>

        {/* Origem Filter */}
        <div className="relative">
          <select
            value={filters.source}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                source: e.target.value as FilterState["source"],
              })
            }
            className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-7 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="all">Origem: Todas</option>
            <option value="Indicação">Indicação</option>
            <option value="Site">Site</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Prospecção">Prospecção</option>
            <option value="Evento">Evento</option>
            <option value="Formulário">Formulário</option>
            <option value="Outro">Outro</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
        </div>

        {/* Score Tier Filter */}
        <div className="relative">
          <select
            value={filters.scoreTier}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                scoreTier: e.target.value as FilterState["scoreTier"],
              })
            }
            className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-7 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="all">Score: Todos</option>
            <option value="very_high">Muito alto (85-100)</option>
            <option value="high">Alto (70-84)</option>
            <option value="medium">Médio (40-69)</option>
            <option value="low">Baixo (0-39)</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
        </div>

        {/* Tag Filter */}
        <div className="relative">
          <select
            value={filters.tag}
            onChange={(e) =>
              onFilterChange({ ...filters, tag: e.target.value })
            }
            className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-7 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="all">Tags: Todas</option>
            {MOCK_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
        </div>

        {/* Boolean Quick Toggles */}
        <button
          onClick={() =>
            onFilterChange({
              ...filters,
              hasPendingTask: !filters.hasPendingTask,
            })
          }
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
            filters.hasPendingTask
              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          <span>Com tarefa</span>
        </button>

        <button
          onClick={() =>
            onFilterChange({ ...filters, noActivity: !filters.noActivity })
          }
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
            filters.noActivity
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Sem atividade</span>
        </button>
      </div>

      {/* Active Filter Chips & Clear Action */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-medium text-slate-400 mr-1">
            Filtros ativos ({totalFilteredCount} resultados):
          </span>

          {filters.status !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Status: {filters.status}
              <button
                onClick={() => onFilterChange({ ...filters, status: "all" })}
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.ownerId !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Resp: {getOwnerName(filters.ownerId)}
              <button
                onClick={() => onFilterChange({ ...filters, ownerId: "all" })}
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.source !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Origem: {filters.source}
              <button
                onClick={() => onFilterChange({ ...filters, source: "all" })}
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.tag !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Tag: {filters.tag}
              <button
                onClick={() => onFilterChange({ ...filters, tag: "all" })}
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.scoreTier !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Score: {filters.scoreTier}
              <button
                onClick={() => onFilterChange({ ...filters, scoreTier: "all" })}
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.hasPendingTask && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Com tarefa pendente
              <button
                onClick={() =>
                  onFilterChange({ ...filters, hasPendingTask: false })
                }
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.noActivity && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Sem atividade
              <button
                onClick={() =>
                  onFilterChange({ ...filters, noActivity: false })
                }
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors ml-auto"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpar filtros</span>
          </button>
        </div>
      )}

      {/* Mobile Filters Bottom Sheet Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative bg-white rounded-t-2xl shadow-xl p-4 space-y-4 max-h-[85vh] overflow-y-auto z-10 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Filtros Avançados
              </h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      status: e.target.value as FilterState["status"],
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                >
                  <option value="all">Todos</option>
                  <option value="new">Novo</option>
                  <option value="contacted">Em contato</option>
                  <option value="qualified">Qualificado</option>
                  <option value="nurturing">Nutrição</option>
                  <option value="converted">Convertido</option>
                  <option value="disqualified">Desqualificado</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Responsável
                </label>
                <select
                  value={filters.ownerId}
                  onChange={(e) =>
                    onFilterChange({ ...filters, ownerId: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                >
                  <option value="all">Todos</option>
                  {MOCK_OWNERS.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Origem
                </label>
                <select
                  value={filters.source}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      source: e.target.value as FilterState["source"],
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                >
                  <option value="all">Todas</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Site">Site</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Prospecção">Prospecção</option>
                  <option value="Evento">Evento</option>
                  <option value="Formulário">Formulário</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Faixa de Score
                </label>
                <select
                  value={filters.scoreTier}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      scoreTier: e.target.value as FilterState["scoreTier"],
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                >
                  <option value="all">Todos</option>
                  <option value="very_high">Muito alto (85-100)</option>
                  <option value="high">Alto (70-84)</option>
                  <option value="medium">Médio (40-69)</option>
                  <option value="low">Baixo (0-39)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tags
                </label>
                <select
                  value={filters.tag}
                  onChange={(e) =>
                    onFilterChange({ ...filters, tag: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                >
                  <option value="all">Todas</option>
                  {MOCK_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  handleResetFilters();
                  setMobileFiltersOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Limpar
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
