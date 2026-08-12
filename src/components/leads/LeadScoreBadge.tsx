import React from "react";
import { Info } from "lucide-react";

interface LeadScoreBadgeProps {
  score: number;
  showTooltip?: boolean;
  className?: string;
}

export const LeadScoreBadge: React.FC<LeadScoreBadgeProps> = ({
  score,
  showTooltip = true,
  className = "",
}) => {
  let tierLabel = "Baixo";
  let bgClass = "bg-rose-50 text-rose-700 border-rose-200/80";
  let barColor = "bg-rose-500";

  if (score >= 85) {
    tierLabel = "Muito alto";
    bgClass = "bg-indigo-50 text-indigo-700 border-indigo-200/80";
    barColor = "bg-indigo-600";
  } else if (score >= 70) {
    tierLabel = "Alto";
    bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    barColor = "bg-emerald-600";
  } else if (score >= 40) {
    tierLabel = "Médio";
    bgClass = "bg-amber-50 text-amber-700 border-amber-200/80";
    barColor = "bg-amber-500";
  }

  const tooltipText =
    "Score simulado nesta etapa. No produto real poderá considerar perfil, engajamento, atividades e critérios definidos pela empresa.";

  return (
    <div
      className={`relative group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${bgClass} ${className}`}
      title={showTooltip ? tooltipText : undefined}
    >
      <span className="font-extrabold font-mono text-sm">{score}</span>
      <span className="text-[11px] font-medium opacity-90">({tierLabel})</span>

      <div className="w-8 h-1.5 rounded-full bg-slate-200 overflow-hidden shrink-0 ml-0.5">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${Math.min(Math.max(score, 5), 100)}%` }}
        />
      </div>

      {showTooltip && (
        <Info className="h-3 w-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5 shrink-0" />
      )}
    </div>
  );
};
