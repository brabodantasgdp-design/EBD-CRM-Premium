import React, { useState } from "react";
import { Upload, FileSpreadsheet, Check, AlertCircle, X, ArrowRight } from "lucide-react";
import { ContactItem, ContactLifecycleStatus } from "../../types/crm";

interface ContactImportModalProps {
  onClose: () => void;
  onImportSuccess: (importedContacts: ContactItem[]) => void;
  onShowToast: (msg: string) => void;
  availableOwners: { id: string; name: string; avatar: string }[];
}

export const ContactImportModal: React.FC<ContactImportModalProps> = ({
  onClose,
  onImportSuccess,
  onShowToast,
  availableOwners,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRowsCount, setParsedRowsCount] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        onShowToast("Por favor, selecione um arquivo no formato CSV.");
        return;
      }
      setFileName(file.name);
      setParsedRowsCount(4); // Mock 4 items found in sample CSV
      setStep(2);
    }
  };

  const handleExecuteImport = () => {
    const mockNewContacts: ContactItem[] = [
      {
        id: `cnt-imp-${Date.now()}-1`,
        organizationId: "org-nexus-01",
        firstName: "Julio",
        lastName: "Cezar",
        fullName: "Julio Cezar",
        email: "julio.cezar@innovatech.com.br",
        phone: "(11) 3322-1100",
        mobilePhone: "(11) 98822-1100",
        jobTitle: "Diretor de Operações",
        companyName: "InnovaTech Brasil",
        ownerId: availableOwners[0].id,
        ownerName: availableOwners[0].name,
        ownerAvatar: availableOwners[0].avatar,
        lifecycleStatus: "active",
        source: "Importação CSV",
        tags: ["Importado", "Enterprise"],
        createdAt: "11/08/2026",
        updatedAt: "agora",
        lastActivityText: "Contato importado via planilha CSV",
      },
      {
        id: `cnt-imp-${Date.now()}-2`,
        organizationId: "org-nexus-01",
        firstName: "Sonia",
        lastName: "Vasconcelos",
        fullName: "Sonia Vasconcelos",
        email: "sonia.v@triangulo.com.br",
        phone: "(31) 3211-5544",
        mobilePhone: "(31) 99112-5544",
        jobTitle: "Gerente Financeira",
        companyName: "Triângulo Alimentos",
        ownerId: availableOwners[1]?.id || availableOwners[0].id,
        ownerName: availableOwners[1]?.name || availableOwners[0].name,
        ownerAvatar: availableOwners[1]?.avatar || availableOwners[0].avatar,
        lifecycleStatus: "customer",
        source: "Importação CSV",
        tags: ["Importado", "Financeiro"],
        createdAt: "11/08/2026",
        updatedAt: "agora",
        lastActivityText: "Contato importado via planilha CSV",
      },
    ];

    onImportSuccess(mockNewContacts);
    onShowToast(`Importação realizada com sucesso! ${mockNewContacts.length} novos contatos adicionados.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Importar Contatos (CSV)</h3>
              <p className="text-xs text-slate-500">Etapa {step} de 2 — Carregamento & Mapeamento</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-100 text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="p-8 border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-3xl text-center space-y-3 hover:border-indigo-400 transition-all cursor-pointer relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileSpreadsheet className="h-10 w-10 text-indigo-600 mx-auto" />
              <div>
                <span className="font-bold text-indigo-900 block text-sm">
                  Arraste ou selecione seu arquivo .CSV
                </span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Mapeamento automático por colunas de Nome, E-mail, Empresa e Telefone
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-slate-600 text-[11px]">
              <span className="font-bold text-slate-800 block">Simulação de Importação (Protótipo):</span>
              <span>• Aceita arquivos .CSV para validar a UX de mapeamento de colunas e atualizar o estado local de contatos e KPIs.</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="font-bold">{fileName}</span>
              </div>
              <span className="text-[11px] font-semibold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                {parsedRowsCount} registros mapeados
              </span>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-700 block">Prévia de Mapeamento de Colunas:</span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-slate-700 font-medium">
                <div className="flex justify-between">
                  <span>Nome Completo:</span>
                  <strong className="text-indigo-600">Coluna 'Nome' (OK)</strong>
                </div>
                <div className="flex justify-between">
                  <span>E-mail:</span>
                  <strong className="text-indigo-600">Coluna 'E-mail' (OK)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Empresa:</span>
                  <strong className="text-indigo-600">Coluna 'Empresa' (OK)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Telefone:</span>
                  <strong className="text-indigo-600">Coluna 'Telefone' (OK)</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="px-6 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md flex items-center gap-1.5"
              >
                <span>Concluir Importação</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
