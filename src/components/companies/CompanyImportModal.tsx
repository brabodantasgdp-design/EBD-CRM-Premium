import React, { useState } from "react";
import { X, Upload, FileSpreadsheet, Check, AlertCircle, Building2, Users } from "lucide-react";
import { CompanyItem } from "../../types/crm";
import { COMPANY_SEGMENTS } from "../../constants/companyStatus";
import { MOCK_OWNERS } from "../../data/mockContactsData";

interface CompanyImportModalProps {
  onClose: () => void;
  onImportCompanies: (newCompanies: Partial<CompanyItem>[]) => void;
}

const MOCK_PREVIEW_CSV_DATA = [
  {
    name: "Nexus Cloud Software S.A.",
    legalName: "Nexus Cloud Tecnologia Ltda",
    cnpj: "45.890.123/0001-77",
    domain: "nexuscloud.io",
    segment: "Tecnologia & SaaS",
    city: "Campinas",
    state: "SP",
    ownerName: "Ana Silva",
  },
  {
    name: "Vanguard Investimentos B2B",
    legalName: "Vanguard Capital Gestão de Ativos S.A.",
    cnpj: "88.112.334/0001-09",
    domain: "vanguardcapital.com.br",
    segment: "Serviços Financeiros",
    city: "São Paulo",
    state: "SP",
    ownerName: "Carlos Oliveira",
  },
  {
    name: "AeroTech Indústria e Defesa",
    legalName: "AeroTech Componentes Aeronáuticos Ltda",
    cnpj: "19.445.667/0001-52",
    domain: "aerotech.ind.br",
    segment: "Indústria & Manufatura",
    city: "São José dos Campos",
    state: "SP",
    ownerName: "Fernanda Costa",
  },
  {
    name: "OmniHealth Soluções Médicas",
    legalName: "OmniHealth Equipamentos Hospitalares S.A.",
    cnpj: "73.221.908/0001-44",
    domain: "omnihealth.med.br",
    segment: "Saúde & Biotecnologia",
    city: "Belo Horizonte",
    state: "MG",
    ownerName: "Roberto Santos",
  },
];

export const CompanyImportModal: React.FC<CompanyImportModalProps> = ({
  onClose,
  onImportCompanies,
}) => {
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [selectedFileName, setSelectedFileName] = useState("empresas_base_q3.csv");

  const handleStartImport = () => {
    const defaultOwner = MOCK_OWNERS[0];

    const companiesToCreate: Partial<CompanyItem>[] = MOCK_PREVIEW_CSV_DATA.map((item, idx) => ({
      name: item.name,
      legalName: item.legalName,
      cnpj: item.cnpj,
      domain: item.domain,
      segment: item.segment,
      status: "prospect",
      ownerId: defaultOwner.id,
      ownerName: item.ownerName || defaultOwner.name,
      ownerAvatar: defaultOwner.avatar,
      size: "Médio Porte",
      address: {
        city: item.city,
        state: item.state,
        country: "Brasil",
      },
      city: item.city,
      state: item.state,
      tags: ["Importado CSV", "Campanha Q3"],
      organizationId: "org-nexus-01",
      createdAt: "11/08/2026",
      updatedAt: "agora mesmo",
    }));

    onImportCompanies(companiesToCreate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Importar Empresas (CSV / Excel)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Simulação de importação em massa para a base local
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-between mb-5 px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-500">
          <span className={step === "upload" ? "text-indigo-600 font-extrabold" : ""}>
            1. Arquivo
          </span>
          <span>→</span>
          <span className={step === "map" ? "text-indigo-600 font-extrabold" : ""}>
            2. Mapeamento
          </span>
          <span>→</span>
          <span className={step === "preview" ? "text-indigo-600 font-extrabold" : ""}>
            3. Confirmação ({MOCK_PREVIEW_CSV_DATA.length})
          </span>
        </div>

        {/* Step 1: Upload Dropzone */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 rounded-2xl p-8 text-center cursor-pointer transition-colors">
              <Upload className="h-10 w-10 text-indigo-600 mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-sm">
                Selecione ou arraste o arquivo CSV
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Suporta formato .CSV codificado em UTF-8 (separado por vírgula ou ponto-e-vírgula)
              </p>
              <span className="inline-block mt-3 px-3 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-700 shadow-2xs">
                {selectedFileName}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => setStep("map")}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20"
              >
                Avançar Mapeamento
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === "map" && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">
              Mapeamento de Colunas do CSV
            </h4>
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>Nome da Empresa *</span>
                <span className="text-emerald-600">Coluna: "Nome Fantasia" ✓</span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>Razão Social</span>
                <span className="text-emerald-600">Coluna: "Razao Social" ✓</span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>CNPJ</span>
                <span className="text-emerald-600">Coluna: "CNPJ" ✓</span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>Site / Domínio</span>
                <span className="text-emerald-600">Coluna: "Website" ✓</span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>Segmento</span>
                <span className="text-emerald-600">Coluna: "Setor" ✓</span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <span className="font-bold text-slate-800">
                Ignorar registros com CNPJ ou Domínio idênticos na base
              </span>
            </label>

            <div className="flex items-center justify-between pt-3">
              <button
                onClick={() => setStep("upload")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep("preview")}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20"
              >
                Pré-visualizar Registros
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview and Confirm */}
        {step === "preview" && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">
              Pré-visualização dos {MOCK_PREVIEW_CSV_DATA.length} Registros a Criar
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {MOCK_PREVIEW_CSV_DATA.map((c, i) => (
                <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{c.name}</span>
                    <span className="text-[11px] text-slate-500">{c.segment} • CNPJ: {c.cnpj}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Pronto para criar
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setStep("map")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Voltar
              </button>
              <button
                onClick={handleStartImport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Confirmar Importação de {MOCK_PREVIEW_CSV_DATA.length} Empresas</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
