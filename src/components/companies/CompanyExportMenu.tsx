import React, { useState } from "react";
import { Download, ChevronDown, Check } from "lucide-react";
import { CompanyItem } from "../../types/crm";

interface CompanyExportMenuProps {
  companiesToExport: CompanyItem[];
  selectedCount: number;
  totalFilteredCount: number;
}

export const CompanyExportMenu: React.FC<CompanyExportMenuProps> = ({
  companiesToExport,
  selectedCount,
  totalFilteredCount,
}) => {
  const [open, setOpen] = useState(false);

  const handleExportCSV = (scope: "filtered" | "selected") => {
    let list = companiesToExport;
    if (scope === "selected" && selectedCount > 0) {
      // filtering done by caller or passed directly
    }

    if (list.length === 0) {
      alert("Nenhuma empresa disponível para exportar.");
      return;
    }

    // Prepare CSV header and rows
    const headers = [
      "ID",
      "Nome Fantasia",
      "Razão Social",
      "CNPJ",
      "Domínio",
      "Status",
      "Segmento",
      "Porte",
      "Responsável",
      "Cidade",
      "Estado",
      "Qtd Contatos",
      "Qtd Negócios Abertos",
      "Valor Pipeline (R$)",
      "Última Atividade",
      "Criado Em",
    ];

    const rows = list.map((c) => {
      const openDealsCount = c.deals ? c.deals.filter((d) => d.status === "open").length : 0;
      const pipelineVal = c.deals
        ? c.deals.filter((d) => d.status === "open").reduce((acc, d) => acc + (d.value || 0), 0)
        : 0;

      return [
        `"${c.id}"`,
        `"${(c.name || "").replace(/"/g, '""')}"`,
        `"${(c.legalName || "").replace(/"/g, '""')}"`,
        `"${c.cnpj || ""}"`,
        `"${c.domain || ""}"`,
        `"${c.status}"`,
        `"${c.segment || ""}"`,
        `"${c.size || ""}"`,
        `"${(c.ownerName || "").replace(/"/g, '""')}"`,
        `"${c.city || c.address?.city || ""}"`,
        `"${c.state || c.address?.state || ""}"`,
        c.contacts ? c.contacts.length : 0,
        openDealsCount,
        pipelineVal,
        `"${(c.lastActivityText || "").replace(/"/g, '""')}"`,
        `"${c.createdAt || ""}"`,
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const filename = `nexus_crm_empresas_${dateStr}.csv`;

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs flex items-center gap-2 transition-colors"
      >
        <Download className="h-4 w-4 text-slate-600" />
        <span className="hidden sm:inline">Exportar</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 p-2 text-xs font-semibold text-slate-700 animate-in fade-in duration-100">
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 mb-1">
              Opções de Exportação UTF-8
            </div>

            <button
              onClick={() => handleExportCSV("filtered")}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl flex items-center justify-between text-slate-900 font-bold"
            >
              <span>Exportar Filtradas ({totalFilteredCount})</span>
              <Download className="h-3.5 w-3.5 text-indigo-600" />
            </button>

            {selectedCount > 0 && (
              <button
                onClick={() => handleExportCSV("selected")}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl flex items-center justify-between text-indigo-700 font-bold"
              >
                <span>Exportar Selecionadas ({selectedCount})</span>
                <Check className="h-3.5 w-3.5 text-indigo-600" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
