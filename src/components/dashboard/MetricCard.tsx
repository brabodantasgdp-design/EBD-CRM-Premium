import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Filter,
  Target,
  DollarSign,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";
import { DashboardMetric } from "../../types/crm";

interface MetricCardProps {
  metric: DashboardMetric;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "TrendingUp":
        return <TrendingUp className="h-4 w-4 text-indigo-600" />;
      case "Filter":
        return <Filter className="h-4 w-4 text-blue-600" />;
      case "Target":
        return <Target className="h-4 w-4 text-purple-600" />;
      case "DollarSign":
        return <DollarSign className="h-4 w-4 text-emerald-600" />;
      case "CheckCircle2":
        return <CheckCircle2 className="h-4 w-4 text-teal-600" />;
      case "Clock":
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-indigo-600" />;
    }
  };

  const isPositiveTrend = metric.trendType
    ? metric.trendType === "positive"
    : metric.trend !== undefined && metric.trend > 0;
  const isNegativeTrend = metric.trendType
    ? metric.trendType === "negative"
    : metric.trend !== undefined && metric.trend < 0;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative group flex flex-col justify-between min-w-0 overflow-hidden">
      <div>
        {/* Header: Label & Icon & Tooltip */}
        <div className="flex items-start justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-slate-100 border border-slate-200/60 shrink-0">
              {renderIcon(metric.iconName)}
            </div>
            <span className="text-xs font-semibold text-slate-600 leading-tight line-clamp-2 min-w-0">
              {metric.label}
            </span>
          </div>

          <div className="relative shrink-0">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              aria-label={`Mais informações sobre ${metric.label}`}
            >
              <Info className="h-3.5 w-3.5" />
            </button>

            {showTooltip && (
              <div className="absolute right-0 top-6 w-48 p-2.5 bg-slate-900 text-white text-[11px] font-medium rounded-xl shadow-xl z-30 pointer-events-none leading-relaxed border border-slate-800">
                {metric.tooltipText}
              </div>
            )}
          </div>
        </div>

        {/* Main Value */}
        <div className="mt-1">
          <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
            {metric.value}
          </h3>
        </div>
      </div>

      {/* Footer: Trend or Secondary Text */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] min-w-0">
        {metric.id === "metric-ciclo" ? (
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <TrendingDown className="h-3 w-3" />
              <span>↓ 3 dias</span>
            </span>
            <span className="text-slate-400 font-medium truncate">
              {metric.comparison}
            </span>
          </div>
        ) : metric.id === "metric-conversao" ? (
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <TrendingUp className="h-3 w-3" />
              <span>+3,2 p.p.</span>
            </span>
            <span className="text-slate-400 font-medium truncate">
              vs. período anterior
            </span>
          </div>
        ) : metric.trend !== undefined ? (
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold shrink-0 ${
                isPositiveTrend
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : isNegativeTrend
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isPositiveTrend ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {metric.trend > 0 ? `+${metric.trend}%` : `${metric.trend}%`}
            </span>
            <span className="text-slate-400 font-medium truncate">
              {metric.comparison}
            </span>
          </div>
        ) : (
          <span className="text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md truncate">
            {metric.secondaryText}
          </span>
        )}
      </div>
    </div>
  );
};
