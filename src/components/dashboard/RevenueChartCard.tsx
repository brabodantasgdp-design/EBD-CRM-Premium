import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { RevenueDataPoint } from "../../types/crm";
import { TrendingUp, Layers } from "lucide-react";

interface RevenueChartCardProps {
  data: RevenueDataPoint[];
}

export const RevenueChartCard: React.FC<RevenueChartCardProps> = ({ data }) => {
  const [metricType, setMetricType] = useState<"receita" | "negocios">("receita");

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-800">
          <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">
            {label}
          </p>
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            <span>
              {metricType === "receita"
                ? `Período Atual: ${formatCurrency(payload[0].value)}`
                : `Negócios Fechados: ${payload[0].value}`}
            </span>
          </div>
          {payload[1] && (
            <div className="flex items-center gap-2 text-slate-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              <span>
                {metricType === "receita"
                  ? `Período Anterior: ${formatCurrency(payload[1].value)}`
                  : `Negócios Anteriores: ${payload[1].value}`}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Receita e negócios fechados
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              Evolução semanal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparativo com o período anterior acumulado
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          <button
            onClick={() => setMetricType("receita")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              metricType === "receita"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Receita (R$)
          </button>
          <button
            onClick={() => setMetricType("negocios")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              metricType === "negocios"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Negócios (#)
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="periodLabel"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
              tickFormatter={(val) =>
                metricType === "receita" ? `R$ ${val / 1000}k` : `${val}`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={metricType === "receita" ? "receita" : "negocios"}
              stroke="#4F46E5"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCurrent)"
            />
            <Area
              type="monotone"
              dataKey={
                metricType === "receita" ? "receitaAnterior" : "negociosAnterior"
              }
              stroke="#94A3B8"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#colorPrev)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-indigo-600" />
            <span className="text-slate-800 font-semibold">Período atual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-slate-300 border border-slate-400" />
            <span>Período anterior</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-emerald-600 font-bold">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>+18,4% crescimento</span>
        </div>
      </div>
    </div>
  );
};
