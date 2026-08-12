import React from "react";
import { UserPlus, Upload, Download, Users } from "lucide-react";

interface ContactsHeaderProps {
  onOpenNewContact: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  selectedCount?: number;
}

export const ContactsHeader: React.FC<ContactsHeaderProps> = ({
  onOpenNewContact,
  onOpenImport,
  onOpenExport,
  selectedCount = 0,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200/80">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hidden sm:block">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
              Gestão de Contatos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Centralize pessoas, relacionamentos e histórico comercial em um só lugar.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
        {/* Secondary Import/Export Buttons */}
        <button
          onClick={onOpenImport}
          className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
          title="Importar contatos via CSV"
        >
          <Upload className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden md:inline">Importar</span>
        </button>

        <button
          onClick={onOpenExport}
          className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
          title="Exportar contatos para CSV"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden md:inline">Exportar</span>
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onOpenNewContact}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 grow sm:grow-0 justify-center active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Novo Contato</span>
        </button>
      </div>
    </div>
  );
};
