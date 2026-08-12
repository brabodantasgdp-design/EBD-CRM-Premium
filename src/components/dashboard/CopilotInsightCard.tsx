import React from "react";
import { Bot, Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import { CopilotInsight } from "../../types/crm";

interface CopilotInsightCardProps {
  insight: CopilotInsight;
  onSelectSuggestion: (actionType: string) => void;
}

export const CopilotInsightCard: React.FC<CopilotInsightCardProps> = ({
  insight,
  onSelectSuggestion,
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-5 text-white border border-indigo-800/50 shadow-md relative overflow-hidden flex flex-col justify-between">
      {/* Background glowing ambient light */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-900/60 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Bot className="h-4 w-4 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Copilot CRM
                </h3>
                <Sparkles className="h-3 w-3 text-purple-300 animate-pulse" />
              </div>
              <p className="text-[10px] text-indigo-300 font-medium">
                Assistente de Inteligência Operacional
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-200 border border-purple-500/30">
            {insight.badgeText}
          </span>
        </div>

        {/* Insight Text */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-indigo-800/40 mb-3">
          <p className="text-xs text-indigo-100 leading-relaxed font-medium">
            "{insight.text}"
          </p>
        </div>

        {/* Action Suggestions */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
            Ações recomendadas
          </p>
          <div className="flex flex-wrap gap-2">
            {insight.suggestions.map((sug) => (
              <button
                key={sug.id}
                onClick={() => onSelectSuggestion(sug.actionType)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/50 hover:bg-indigo-800/80 text-indigo-100 hover:text-white text-xs font-semibold rounded-xl border border-indigo-700/50 transition-all active:scale-95"
              >
                <Lightbulb className="h-3 w-3 text-amber-400 shrink-0" />
                <span>{sug.label}</span>
                <ArrowRight className="h-3 w-3 text-indigo-300" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Notice & Contexto Considerado */}
      <div className="mt-3 pt-2.5 border-t border-indigo-900/60 text-[10px]">
        <div className="flex items-center justify-between text-indigo-300 mb-1">
          <span className="font-semibold text-indigo-200">Contexto considerado:</span>
          <span className="font-semibold text-purple-300">Modo Simulação</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-indigo-300/80">
          <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/40">• Pipeline atual</span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/40">• Atividades recentes</span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/40">• Fechamentos previstos</span>
        </div>
      </div>
    </div>
  );
};
