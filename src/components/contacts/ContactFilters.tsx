import React, { useState } from "react";
import { Search, Filter, RotateCcw, X, ArrowUpDown, ChevronDown, Check } from "lucide-react";
import { ContactLifecycleStatus } from "../../types/crm";

export interface ContactFilterState {
  search: string;
  status: string; // "all" | ContactLifecycleStatus
  company: string; // "all" | companyName
  ownerId: string; // "all" | ownerId
  tag: string; // "all" | tagName
  hasOpenDeals: string; // "all" | "yes" | "no"
  hasPendingTask: string; // "all" | "yes" | "no"
  noRecentActivity: string; // "all" | "yes" | "no"
  sortBy: "recent" | "oldest" | "name_asc" | "name_desc" | "last_activity" | "most_deals";
}

interface ContactFiltersProps {
  filters: ContactFilterState;
  onFilterChange: (filters: ContactFilterState) => void;
  availableCompanies: string[];
  availableOwners: { id: string; name: string }[];
  availableTags: string[];
  totalResults: number;
}

export const ContactFilters: React.FC<ContactFiltersProps> = ({
  filters,
  onFilterChange,
  availableCompanies,
  availableOwners,
  availableTags,
  totalResults,
}) => {
  const [mobileBottomSheetOpen, setMobileBottomSheetOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleSelectChange = (key: keyof ContactFilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleResetFilters = () => {
    onFilterChange({
      search: "",
      status: "all",
      company: "all",
      ownerId: "all",
      tag: "all",
      hasOpenDeals: "all",
      hasPendingTask: "all",
      noRecentActivity: "all",
      sortBy: "recent",
    });
  };

  const activeFiltersCount = [
    filters.status !== "all",
    filters.company !== "all",
    filters.ownerId !== "all",
    filters.tag !== "all",
    filters.hasOpenDeals !== "all",
    filters.hasPendingTask !== "all",
    filters.noRecentActivity !== "all",
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Search Bar + Quick Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Main Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Buscar por nome, empresa, e-mail ou telefone..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Desktop Quick Dropdowns */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Status Select */}
          <select
            value={filters.status}
            onChange={(e) => handleSelectChange("status", e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-600 shadow-2xs"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="customer">Cliente</option>
            <option value="inactive">Inativo</option>
            <option value="former_customer">Ex-cliente</option>
          </select>

          {/* Owner Select */}
          <select
            value={filters.ownerId}
            onChange={(e) => handleSelectChange("ownerId", e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-600 shadow-2xs"
          >
            <option value="all">Todos os Responsáveis</option>
            {availableOwners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>

          {/* Open Deals Filter */}
          <select
            value={filters.hasOpenDeals}
            onChange={(e) => handleSelectChange("hasOpenDeals", e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-600 shadow-2xs"
          >
            <option value="all">Negócios: Todos</option>
            <option value="yes">Com Negócio Aberto</option>
            <option value="no">Sem Negócio Aberto</option>
          </select>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={filters.sortBy}
              onChange={(e) =>
                handleSelectChange("sortBy", e.target.value as ContactFilterState["sortBy"])
              }
              className="text-xs font-semibold bg-transparent text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="recent">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="name_asc">Nome A-Z</option>
              <option value="name_desc">Nome Z-A</option>
              <option value="last_activity">Última atividade</option>
              <option value="most_deals">Mais negócios</option>
            </select>
          </div>
        </div>

        {/* Mobile Filter Sheet Trigger */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setMobileBottomSheetOpen(true)}
            className={`flex-1 px-3 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition-all shadow-2xs ${
              activeFiltersCount > 0
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </button>

          {/* Mobile Sort Dropdown */}
          <select
            value={filters.sortBy}
            onChange={(e) =>
              handleSelectChange("sortBy", e.target.value as ContactFilterState["sortBy"])
            }
            className="px-2.5 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none shadow-2xs"
          >
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="name_asc">Nome A-Z</option>
            <option value="name_desc">Nome Z-A</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {(activeFiltersCount > 0 || filters.search) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-500 font-medium">Filtros ativos:</span>

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              Busca: "{filters.search}"
              <button
                onClick={() => onFilterChange({ ...filters, search: "" })}
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.status !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              Status: {filters.status}
              <button
                onClick={() => onFilterChange({ ...filters, status: "all" })}
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.company !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              Empresa: {filters.company}
              <button
                onClick={() => onFilterChange({ ...filters, company: "all" })}
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.ownerId !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              Responsável: {availableOwners.find((o) => o.id === filters.ownerId)?.name || filters.ownerId}
              <button
                onClick={() => onFilterChange({ ...filters, ownerId: "all" })}
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.tag !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              Tag: {filters.tag}
              <button
                onClick={() => onFilterChange({ ...filters, tag: "all" })}
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.hasOpenDeals !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              Negócio Aberto: {filters.hasOpenDeals === "yes" ? "Sim" : "Não"}
              <button
                onClick={() => onFilterChange({ ...filters, hasOpenDeals: "all" })}
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleResetFilters}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 ml-1 hover:underline"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpar filtros</span>
          </button>

          <span className="ml-auto text-xs text-slate-500 font-medium">
            Exibindo <strong>{totalResults}</strong> registro(s)
          </span>
        </div>
      )}

      {/* Mobile Bottom Sheet Filters */}
      {mobileBottomSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Filtros Avançados</h3>
              </div>
              <button
                onClick={() => setMobileBottomSheetOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleSelectChange("status", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativo</option>
                  <option value="customer">Cliente</option>
                  <option value="inactive">Inativo</option>
                  <option value="former_customer">Ex-cliente</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Empresa</label>
                <select
                  value={filters.company}
                  onChange={(e) => handleSelectChange("company", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="all">Todas as Empresas</option>
                  {availableCompanies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Responsável</label>
                <select
                  value={filters.ownerId}
                  onChange={(e) => handleSelectChange("ownerId", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="all">Todos os Responsáveis</option>
                  {availableOwners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tag</label>
                <select
                  value={filters.tag}
                  onChange={(e) => handleSelectChange("tag", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="all">Todas as Tags</option>
                  {availableTags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Com Negócio Aberto</label>
                  <select
                    value={filters.hasOpenDeals}
                    onChange={(e) => handleSelectChange("hasOpenDeals", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="all">Todos</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sem Atividade (+30d)</label>
                  <select
                    value={filters.noRecentActivity}
                    onChange={(e) => handleSelectChange("noRecentActivity", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="all">Todos</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 rounded-xl"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setMobileBottomSheetOpen(false)}
                className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl shadow-md grow text-center"
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
