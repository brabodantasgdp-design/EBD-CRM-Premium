import React from "react";
import { X, AlertTriangle, Building2, User, Calendar, PhoneCall, CheckCircle, ArrowRight, FileText } from "lucide-react";
import { RiskDeal } from "../../types/crm";

interface DealDetailModalProps {
  deal: RiskDeal | null;
  onClose: () => void;
  onActionSuccess: (msg: string) => void;
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({
  deal,
  onClose,
  onActionSuccess,
}) => {
  if (!deal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {deal.companyName}
              </h3>
              <p className="text-xs text-slate-500">
                Detalhes da Oportunidade
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Alerta de Risco ({deal.riskLevel.toUpperCase()})</p>
              <p className="mt-0.5 text-[11px]">{deal.reason}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Valor Estimado</p>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">{deal.formattedValue}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Etapa Atual</p>
              <p className="text-sm font-bold text-indigo-600 mt-0.5">{deal.stage}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Responsável</p>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">{deal.assigneeName}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Sem Interação</p>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">{deal.daysWithoutInteraction} dias</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="font-bold text-slate-800">Ações recomendadas para o negócio:</p>

            <button
              onClick={() => {
                onActionSuccess(`Follow-up agendado para ${deal.companyName}!`);
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold border border-indigo-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-indigo-600" />
                <span>Registrar Ligação / Follow-up</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => {
                onActionSuccess(`Rascunho de e-mail gerado para ${deal.companyName}!`);
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold border border-purple-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <span>Gerar Rascunho de E-mail (Simulado)</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => {
                onActionSuccess(`Negócio ${deal.companyName} atualizado no pipeline!`);
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold border border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Avançar para Próxima Etapa</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
