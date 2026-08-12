import React from "react";
import { Download, FileSpreadsheet, X } from "lucide-react";

interface LeadExportMenuProps {
  isOpen: boolean;
  onClose: () => void;
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  onExport: (type: "all" | "filtered" | "selected") => void;
}

export const LeadExportMenu: React.FC<LeadExportMenuProps> = ({
  isOpen,
  onClose,
  totalCount,
  filteredCount,
  selectedCount,
  onExport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden z-10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Exportar Dados em CSV
              </h2>
              <p className="text-xs text-slate-500">
                Escolha o escopo de exportação.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options Body */}
        <div className="p-4 space-y-2 text-xs">
          <button
            onClick={() => onExport("all")}
            className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="h-4 w-4 text-indigo-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">Exportar Todos os Leads</p>
                <p className="text-[11px] text-slate-500">
                  Base completa com {totalCount} registros
                </p>
              </div>
            </div>
            <span className="font-semibold text-indigo-600">CSV</span>
          </button>

          <button
            onClick={() => onExport("filtered")}
            className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">Exportar Leads Filtrados</p>
                <p className="text-[11px] text-slate-500">
                  Apenas os {filteredCount} resultados atuais
                </p>
              </div>
            </div>
            <span className="font-semibold text-indigo-600">CSV</span>
          </button>

          {selectedCount > 0 && (
            <button
              onClick={() => onExport("selected")}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all flex items-center justify-between bg-indigo-50/30"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-4 w-4 text-indigo-700 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">
                    Exportar Selecionados
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Apenas os {selectedCount} itens marcados
                  </p>
                </div>
              </div>
              <span className="font-semibold text-indigo-600">CSV</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
