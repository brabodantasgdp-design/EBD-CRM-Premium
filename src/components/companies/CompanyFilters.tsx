import React, { useState } from "react";
import { Search, Filter, X, RotateCcw, Building2, User, Layers, Tag, Briefcase, Clock, ChevronDown } from "lucide-react";
import { CompanyStatus } from "../../types/crm";
import { COMPANY_STATUS_CONFIG, COMPANY_SEGMENTS, COMPANY_SIZES, COMPANY_TAGS } from "../../constants/companyStatus";
import { MOCK_OWNERS } from "../../data/mockContactsData";

export interface CompanyFilterState {
  searchQuery: string;
  status: CompanyStatus | "all";
  ownerId: string | "all";
  segment: string | "all";
  size: string | "all";
  hasOpenDeals: boolean;
  withoutActivity: boolean; // >30 dias
  tag: string | "all";
  sortBy: "recent" | "name_asc" | "highest_pipeline" | "most_deals" | "last_activity";
}

interface CompanyFiltersProps {
  filters: CompanyFilterState;
  onFilterChange: (newFilters: CompanyFilterState) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
}

export const CompanyFilters: React.FC<CompanyFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalFilteredCount,
}) => {
  const [mobileBottomSheetOpen, setMobileBottomSheetOpen] = useState(false);

  const hasActiveFilters =
    filters.searchQuery.trim() !== "" ||
    filters.status !== "all" ||
    filters.ownerId !== "all" ||
    filters.segment !== "all" ||
    filters.size !== "all" ||
    filters.hasOpenDeals ||
    filters.withoutActivity ||
    filters.tag !== "all";

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const activeChips: { label: string; onRemove: () => void }[] = [];

  if (filters.searchQuery) {
    activeChips.push({
      label: `Busca: "${filters.searchQuery}"`,
      onRemove: () => onFilterChange({ ...filters, searchQuery: "" }),
    });
  }
  if (filters.status !== "all") {
    activeChips.push({
      label: `Status: ${COMPANY_STATUS_CONFIG[filters.status]?.label || filters.status}`,
      onRemove: () => onFilterChange({ ...filters, status: "all" }),
    });
  }
  if (filters.ownerId !== "all") {
    const ownerName = MOCK_OWNERS.find((o) => o.id === filters.ownerId)?.name || filters.ownerId;
    activeChips.push({
      label: `Responsável: ${ownerName}`,
      onRemove: () => onFilterChange({ ...filters, ownerId: "all" }),
    });
  }
  if (filters.segment !== "all") {
    activeChips.push({
      label: `Segmento: ${filters.segment}`,
      onRemove: () => onFilterChange({ ...filters, segment: "all" }),
    });
  }
  if (filters.size !== "all") {
    activeChips.push({
      label: `Porte: ${filters.size}`,
      onRemove: () => onFilterChange({ ...filters, size: "all" }),
    });
  }
  if (filters.hasOpenDeals) {
    activeChips.push({
      label: "Com Negócio Aberto",
      onRemove: () => onFilterChange({ ...filters, hasOpenDeals: false }),
    });
  }
  if (filters.withoutActivity) {
    activeChips.push({
      label: "Sem Atividade (+30d)",
      onRemove: () => onFilterChange({ ...filters, withoutActivity: false }),
    });
  }
  if (filters.tag !== "all") {
    activeChips.push({
      label: `Tag: ${filters.tag}`,
      onRemove: () => onFilterChange({ ...filters, tag: "all" }),
    });
  }

  return (
    <div className="space-y-3">
      {/* Search & Main Selectors Bar */}
      <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Buscar por nome, razão social, CNPJ, site, cidade ou contato..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Quick Selectors (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) =>
              onFilterChange({ ...filters, status: e.target.value as CompanyStatus | "all" })
            }
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-600"
          >
            <option value="all">Todos os Status</option>
            <option value="prospect">Prospect</option>
            <option value="cliente">Cliente</option>
            <option value="inativo">Inativo</option>
            <option value="ex_cliente">Ex-cliente</option>
          </select>

          {/* Owner Filter */}
          <select
            value={filters.ownerId}
            onChange={(e) => onFilterChange({ ...filters, ownerId: e.target.value })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-600"
          >
            <option value="all">Todos Responsáveis</option>
            {MOCK_OWNERS.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>

          {/* Segment Filter */}
          <select
            value={filters.segment}
            onChange={(e) => onFilterChange({ ...filters, segment: e.target.value })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-600 max-w-[180px] truncate"
          >
            <option value="all">Todos Segmentos</option>
            {COMPANY_SEGMENTS.map((seg) => (
              <option key={seg} value={seg}>
                {seg}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({ ...filters, sortBy: e.target.value as CompanyFilterState["sortBy"] })
            }
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50/50 border-indigo-200 focus:outline-none focus:bg-white focus:border-indigo-600"
          >
            <option value="recent">Mais recentes</option>
            <option value="name_asc">Nome (A-Z)</option>
            <option value="highest_pipeline">Maior pipeline</option>
            <option value="most_deals">Mais negócios</option>
            <option value="last_activity">Última atividade</option>
          </select>
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setMobileBottomSheetOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            <Filter className="h-3.5 w-3.5 text-indigo-600" />
            <span>Filtros Avançados</span>
            {activeChips.length > 0 && (
              <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeChips.length}
              </span>
            )}
          </button>

          {/* Mobile Sort Dropdown */}
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({ ...filters, sortBy: e.target.value as CompanyFilterState["sortBy"] })
            }
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="recent">Mais recentes</option>
            <option value="name_asc">Nome A-Z</option>
            <option value="highest_pipeline">Maior pipeline</option>
            <option value="most_deals">Mais negócios</option>
            <option value="last_activity">Última atividade</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in duration-150">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Filtros ({totalFilteredCount}):
          </span>

          {activeChips.map((chip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200/80 rounded-lg text-xs font-semibold text-indigo-800"
            >
              <span>{chip.label}</span>
              <button
                onClick={chip.onRemove}
                className="hover:bg-indigo-200/60 p-0.5 rounded text-indigo-600 transition-colors"
                title="Remover filtro"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpar Todos</span>
          </button>
        </div>
      )}

      {/* Mobile Bottom Sheet Filters Modal */}
      {mobileBottomSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Filtros de Empresas</h3>
              </div>
              <button
                onClick={() => setMobileBottomSheetOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Status B2B</label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    onFilterChange({ ...filters, status: e.target.value as CompanyStatus | "all" })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                >
                  <option value="all">Todos os Status</option>
                  <option value="prospect">Prospect</option>
                  <option value="cliente">Cliente</option>
                  <option value="inativo">Inativo</option>
                  <option value="ex_cliente">Ex-cliente</option>
                </select>
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Responsável Comercial</label>
                <select
                  value={filters.ownerId}
                  onChange={(e) => onFilterChange({ ...filters, ownerId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                >
                  <option value="all">Todos os Responsáveis</option>
                  {MOCK_OWNERS.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Segmento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Segmento de Mercado</label>
                <select
                  value={filters.segment}
                  onChange={(e) => onFilterChange({ ...filters, segment: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                >
                  <option value="all">Todos os Segmentos</option>
                  {COMPANY_SEGMENTS.map((seg) => (
                    <option key={seg} value={seg}>
                      {seg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Porte */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Porte da Empresa</label>
                <select
                  value={filters.size}
                  onChange={(e) => onFilterChange({ ...filters, size: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                >
                  <option value="all">Todos os Portes</option>
                  {COMPANY_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tag Estratégica</label>
                <select
                  value={filters.tag}
                  onChange={(e) => onFilterChange({ ...filters, tag: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                >
                  <option value="all">Todas as Tags</option>
                  {COMPANY_TAGS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="pt-2 space-y-3 border-t border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasOpenDeals}
                    onChange={(e) => onFilterChange({ ...filters, hasOpenDeals: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-800">Apenas com negócios abertos</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.withoutActivity}
                    onChange={(e) => onFilterChange({ ...filters, withoutActivity: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-800">Sem atividades recentes (+30 dias)</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  onResetFilters();
                  setMobileBottomSheetOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Limpar Tudo
              </button>
              <button
                onClick={() => setMobileBottomSheetOpen(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
