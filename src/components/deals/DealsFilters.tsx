import React, { useState } from "react";
import { Search, Filter, X, RotateCcw, AlertCircle, Tag, User, Building2 } from "lucide-react";
import { CompanyItem } from "../../types/crm";

export interface DealFilterState {
  searchQuery: string;
  status: "all" | "open" | "won" | "lost";
  ownerId: string;
  companyId: string;
  tag: string;
  onlyInactive: boolean;
  minVal: string;
  maxVal: string;
}

export const DEFAULT_DEAL_FILTERS: DealFilterState = {
  searchQuery: "",
  status: "open",
  ownerId: "all",
  companyId: "all",
  tag: "all",
  onlyInactive: false,
  minVal: "",
  maxVal: "",
};

interface DealsFiltersProps {
  filters: DealFilterState;
  onChangeFilters: (filters: DealFilterState) => void;
  availableOwners: { id: string; name: string }[];
  availableCompanies: CompanyItem[];
  availableTags: string[];
}

export const DealsFilters: React.FC<DealsFiltersProps> = ({
  filters,
  onChangeFilters,
  availableOwners,
  availableCompanies,
  availableTags,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const activeFiltersCount =
    (filters.searchQuery ? 1 : 0) +
    (filters.status !== "open" ? 1 : 0) +
    (filters.ownerId !== "all" ? 1 : 0) +
    (filters.companyId !== "all" ? 1 : 0) +
    (filters.tag !== "all" ? 1 : 0) +
    (filters.onlyInactive ? 1 : 0) +
    (filters.minVal ? 1 : 0) +
    (filters.maxVal ? 1 : 0);

  const handleReset = () => {
    onChangeFilters(DEFAULT_DEAL_FILTERS);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 mb-6 shadow-xs">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por negócio, empresa, contato ou responsável..."
            value={filters.searchQuery}
            onChange={(e) =>
              onChangeFilters({ ...filters, searchQuery: e.target.value })
            }
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-hidden transition-all"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onChangeFilters({ ...filters, searchQuery: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Controls - Desktop */}
        <div className="hidden lg:flex items-center gap-2.5 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => onChangeFilters({ ...filters, status: "open" })}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filters.status === "open"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Abertos
            </button>
            <button
              type="button"
              onClick={() => onChangeFilters({ ...filters, status: "won" })}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filters.status === "won"
                  ? "bg-white text-emerald-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Ganhos
            </button>
            <button
              type="button"
              onClick={() => onChangeFilters({ ...filters, status: "lost" })}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filters.status === "lost"
                  ? "bg-white text-rose-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Perdidos
            </button>
            <button
              type="button"
              onClick={() => onChangeFilters({ ...filters, status: "all" })}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filters.status === "all"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Todos
            </button>
          </div>

          {/* Owner Filter */}
          <select
            value={filters.ownerId}
            onChange={(e) =>
              onChangeFilters({ ...filters, ownerId: e.target.value })
            }
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Todos os Responsáveis</option>
            {availableOwners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          {/* Company Filter */}
          <select
            value={filters.companyId}
            onChange={(e) =>
              onChangeFilters({ ...filters, companyId: e.target.value })
            }
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Todas as Empresas</option>
            {availableCompanies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Inactive Toggle */}
          <button
            type="button"
            onClick={() =>
              onChangeFilters({
                ...filters,
                onlyInactive: !filters.onlyInactive,
              })
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              filters.onlyInactive
                ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Sem atividade</span>
          </button>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {/* Mobile Filter Trigger Button */}
        <div className="flex lg:hidden items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filtros avançados</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded-full text-[10px]">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet Filters */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative bg-white rounded-t-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                Filtros de Negócios
              </h3>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                  Status
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => onChangeFilters({ ...filters, status: "open" })}
                    className={`py-2 rounded-md ${
                      filters.status === "open"
                        ? "bg-white text-indigo-700 shadow-2xs font-bold"
                        : "text-slate-600"
                    }`}
                  >
                    Abertos
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeFilters({ ...filters, status: "won" })}
                    className={`py-2 rounded-md ${
                      filters.status === "won"
                        ? "bg-white text-emerald-700 shadow-2xs font-bold"
                        : "text-slate-600"
                    }`}
                  >
                    Ganhos
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeFilters({ ...filters, status: "lost" })}
                    className={`py-2 rounded-md ${
                      filters.status === "lost"
                        ? "bg-white text-rose-700 shadow-2xs font-bold"
                        : "text-slate-600"
                    }`}
                  >
                    Perdidos
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeFilters({ ...filters, status: "all" })}
                    className={`py-2 rounded-md ${
                      filters.status === "all"
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-600"
                    }`}
                  >
                    Todos
                  </button>
                </div>
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Responsável
                </label>
                <select
                  value={filters.ownerId}
                  onChange={(e) =>
                    onChangeFilters({ ...filters, ownerId: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                >
                  <option value="all">Todos os Responsáveis</option>
                  {availableOwners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Empresa */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Empresa
                </label>
                <select
                  value={filters.companyId}
                  onChange={(e) =>
                    onChangeFilters({ ...filters, companyId: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                >
                  <option value="all">Todas as Empresas</option>
                  {availableCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag */}
              {availableTags.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Tag
                  </label>
                  <select
                    value={filters.tag}
                    onChange={(e) =>
                      onChangeFilters({ ...filters, tag: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                  >
                    <option value="all">Todas as Tags</option>
                    {availableTags.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Inactivity Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.onlyInactive}
                    onChange={(e) =>
                      onChangeFilters({
                        ...filters,
                        onlyInactive: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Apenas negócios sem atividade recente
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl"
              >
                Limpar tudo
              </button>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl shadow-xs"
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
