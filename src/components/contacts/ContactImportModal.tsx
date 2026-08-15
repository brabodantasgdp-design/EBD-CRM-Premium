import React from "react";
import { FileSpreadsheet, X } from "lucide-react";
import { ContactItem } from "../../types/crm";

interface ContactImportModalProps {
  onClose: () => void;
  onImportSuccess: (importedContacts: ContactItem[]) => void;
  onShowToast: (msg: string) => void;
  availableOwners: { id: string; name: string; avatar: string }[];
}

export const ContactImportModal: React.FC<ContactImportModalProps> = ({ onClose }) => <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
  <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
    <div className="flex items-center justify-between border-b border-slate-100 pb-4"><div className="flex items-center gap-2.5"><div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-2.5 text-indigo-600"><FileSpreadsheet className="h-5 w-5" /></div><div><h3 className="text-base font-bold text-slate-900">Importar contatos</h3><p className="text-xs text-slate-500">Importação CSV com persistência real</p></div></div><button onClick={onClose} className="rounded-full bg-slate-100 p-1.5 text-slate-500" aria-label="Fechar"><X className="h-4 w-4" /></button></div>
    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><FileSpreadsheet className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-800">Importação CSV indisponível nesta versão</p><p className="mt-1 text-xs leading-5 text-slate-500">Nenhum contato será criado localmente. Use o cadastro manual até a importação persistente ser disponibilizada.</p></div>
    <div className="mt-5 flex justify-end"><button onClick={onClose} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Fechar</button></div>
  </div>
</div>;
