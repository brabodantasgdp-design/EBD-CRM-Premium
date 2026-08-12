import React, { useState } from "react";
import { Download, FileSpreadsheet, X, Check } from "lucide-react";
import { ContactItem } from "../../types/crm";

interface ContactExportMenuProps {
  contacts: ContactItem[];
  filteredContacts: ContactItem[];
  selectedContacts: ContactItem[];
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ContactExportMenu: React.FC<ContactExportMenuProps> = ({
  contacts,
  filteredContacts,
  selectedContacts,
  onClose,
  onShowToast,
}) => {
  const [scope, setScope] = useState<"all" | "filtered" | "selected">(
    selectedContacts.length > 0 ? "selected" : "filtered"
  );

  const handleExportCSV = () => {
    let targetList = contacts;
    if (scope === "filtered") targetList = filteredContacts;
    if (scope === "selected") targetList = selectedContacts;

    if (targetList.length === 0) {
      onShowToast("Nenhum contato selecionado para exportação.");
      return;
    }

    // Generate CSV Header
    const headers = [
      "ID",
      "Nome",
      "Sobrenome",
      "Nome Completo",
      "E-mail",
      "Telefone Fixo",
      "Celular/WhatsApp",
      "Cargo",
      "Empresa",
      "Status",
      "Responsavel",
      "Origem",
      "Tags",
      "Data Criacao",
    ];

    const rows = targetList.map((c) => [
      c.id,
      `"${c.firstName}"`,
      `"${c.lastName || ""}"`,
      `"${c.fullName}"`,
      `"${c.email || ""}"`,
      `"${c.phone || ""}"`,
      `"${c.mobilePhone || ""}"`,
      `"${c.jobTitle || ""}"`,
      `"${c.companyName || ""}"`,
      `"${c.lifecycleStatus}"`,
      `"${c.ownerName}"`,
      `"${c.source || ""}"`,
      `"${(c.tags || []).join("; ")}"`,
      `"${c.createdAt}"`,
    ]);

    const csvContent =
      "\uFEFF" + // UTF-8 BOM for Excel PT-BR
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `contatos_nexus_crm_${scope}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast(`Exportação de ${targetList.length} contato(s) concluída!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Exportar Contatos</h3>
              <p className="text-xs text-slate-500">Gere planilha CSV compatível com Excel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-100 text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          <label className="block font-bold text-slate-700">Selecione o Escopo de Exportação:</label>

          <label
            className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
              scope === "selected" ? "bg-indigo-50/80 border-indigo-300 font-bold text-indigo-900" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="exportScope"
                checked={scope === "selected"}
                onChange={() => setScope("selected")}
                disabled={selectedContacts.length === 0}
                className="text-indigo-600"
              />
              <span>Apenas Selecionados</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-white border text-[11px]">
              {selectedContacts.length} contato(s)
            </span>
          </label>

          <label
            className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
              scope === "filtered" ? "bg-indigo-50/80 border-indigo-300 font-bold text-indigo-900" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="exportScope"
                checked={scope === "filtered"}
                onChange={() => setScope("filtered")}
                className="text-indigo-600"
              />
              <span>Filtros Atuais</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-white border text-[11px]">
              {filteredContacts.length} contato(s)
            </span>
          </label>

          <label
            className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
              scope === "all" ? "bg-indigo-50/80 border-indigo-300 font-bold text-indigo-900" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="exportScope"
                checked={scope === "all"}
                onChange={() => setScope("all")}
                className="text-indigo-600"
              />
              <span>Toda a Base Local</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-white border text-[11px]">
              {contacts.length} contato(s)
            </span>
          </label>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancelar
          </button>
          <button
            onClick={handleExportCSV}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Baixar CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
