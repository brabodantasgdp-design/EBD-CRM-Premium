import React, { useState } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

interface LeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCompleted: (count: number) => void;
}

export const LeadImportModal: React.FC<LeadImportModalProps> = ({
  isOpen,
  onClose,
  onImportCompleted,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fileName, setFileName] = useState("leads_prospeccao_q3.csv");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFinish = () => {
    onImportCompleted(98);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Importar Leads (CSV)
              </h2>
              <p className="text-xs text-slate-500">
                Etapa {step} de 4 — {step === 1 && "Selecionar Arquivo"}
                {step === 2 && "Mapear Colunas"}
                {step === 3 && "Validar Registros"}
                {step === 4 && "Conclusão"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-5 pt-3 pb-1 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
            <span className={step >= 1 ? "text-indigo-600 font-bold" : ""}>
              1. Arquivo
            </span>
            <span className={step >= 2 ? "text-indigo-600 font-bold" : ""}>
              2. Mapeamento
            </span>
            <span className={step >= 3 ? "text-indigo-600 font-bold" : ""}>
              3. Validação
            </span>
            <span className={step >= 4 ? "text-indigo-600 font-bold" : ""}>
              4. Resultado
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Modal Body per Step */}
        <div className="p-5 text-xs space-y-4 overflow-y-auto">
          {/* STEP 1: Selecionar arquivo */}
          {step === 1 && (
            <div className="space-y-3">
              <div
                onClick={() => setStep(2)}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl p-6 text-center cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="h-10 w-10 text-indigo-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">
                  Arraste seu arquivo CSV ou clique para selecionar
                </p>
                <p className="text-slate-500 text-[11px] mt-1">
                  Suporta arquivos .CSV ou .XLSX até 10MB
                </p>
              </div>

              <div className="p-3 bg-slate-100/80 rounded-xl flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold">{fileName}</span>
                  <span className="text-[10px] text-slate-500">(108 registros)</span>
                </div>
                <span className="text-[11px] font-bold text-indigo-600">Pronto</span>
              </div>
            </div>
          )}

          {/* STEP 2: Mapear colunas */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-slate-600">
                Mapeie os campos do seu CSV com a estrutura do Nexus CRM:
              </p>

              <div className="space-y-2 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {[
                  { csv: "Nome Completo", system: "Nome (name)", mapped: true },
                  { csv: "E-mail de Contato", system: "E-mail (email)", mapped: true },
                  { csv: "Telefone Celular", system: "Telefone (phone)", mapped: true },
                  { csv: "Razão Social", system: "Empresa (company)", mapped: true },
                  { csv: "Canal de Origem", system: "Origem (source)", mapped: true },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 flex items-center justify-between bg-white text-xs"
                  >
                    <span className="font-mono text-slate-600 font-semibold">
                      {row.csv}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {row.system}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Validar dados */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-slate-600">
                Relatório de validação prévia dos registros do arquivo:
              </p>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-emerald-900">98</p>
                  <p className="text-[10px] font-semibold text-emerald-700">Válidos</p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-amber-900">7</p>
                  <p className="text-[10px] font-semibold text-amber-700">Com aviso</p>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <XCircle className="h-5 w-5 text-rose-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-rose-900">3</p>
                  <p className="text-[10px] font-semibold text-rose-700">Inválidos</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Os 3 registros inválidos possuem e-mails sem domínio e serão ignorados automaticamente.
              </p>
            </div>
          )}

          {/* STEP 4: Resultado */}
          {step === 4 && (
            <div className="text-center py-4 space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Importação Concluída com Sucesso!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  <strong>98 novos leads</strong> foram cadastrados e atribuídos ao seu pipeline.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
          {step > 1 && step < 4 ? (
            <button
              onClick={() => setStep((step - 1) as any)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 && (
            <button
              onClick={() => setStep((step + 1) as any)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <span>Avançar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={() => {
                setIsProcessing(true);
                setTimeout(() => {
                  setIsProcessing(false);
                  setStep(4);
                }, 600);
              }}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              {isProcessing ? "Importando..." : "Confirmar Importação"}
            </button>
          )}

          {step === 4 && (
            <button
              onClick={handleFinish}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-xs ml-auto"
            >
              Concluir e Ver Leads
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
