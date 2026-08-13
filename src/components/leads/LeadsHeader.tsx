import React, { useState } from "react";
import { Plus, Download, Upload, MoreHorizontal } from "lucide-react";

interface LeadsHeaderProps {
  onOpenNewLead: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  canWrite?: boolean;
}

export const LeadsHeader: React.FC<LeadsHeaderProps> = ({
  onOpenNewLead,
  onOpenImport,
  onOpenExport,
  canWrite = true,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            <span className="sm:hidden">Leads</span>
            <span className="hidden sm:inline">Gestão de Leads</span>
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Organize, qualifique e acompanhe oportunidades desde o primeiro contato.
        </p>
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenExport}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <Download className="h-4 w-4 text-slate-500" />
          <span>Exportar</span>
        </button>

        <button
          onClick={onOpenImport}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <Upload className="h-4 w-4 text-slate-500" />
          <span>Importar</span>
        </button>

        {canWrite && <button
          onClick={onOpenNewLead}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>Novo lead</span>
        </button>}
      </div>

      {/* Mobile Action Controls */}
      <div className="flex sm:hidden items-center gap-2 mt-1">
        {canWrite && <button
          onClick={onOpenNewLead}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>Novo lead</span>
        </button>}

        <div className="relative">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label="Mais ações"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {mobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-40">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenImport();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Upload className="h-4 w-4 text-slate-500" />
                  <span>Importar CSV</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenExport();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>Exportar Dados</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
