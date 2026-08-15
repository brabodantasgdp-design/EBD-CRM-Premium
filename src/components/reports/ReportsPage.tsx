"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, RefreshCw, TrendingUp } from "lucide-react";
import type { ReportsSnapshot, ReportPeriod } from "../../lib/crm/reports/metrics";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
const number = new Intl.NumberFormat("pt-BR");
const periodOptions: Array<[ReportPeriod, string]> = [["hoje", "Hoje"], ["7dias", "7 dias"], ["30dias", "30 dias"], ["este_mes", "Este mês"], ["3_meses", "3 meses"], ["personalizado", "Personalizado"]];

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}</article>;
}

export function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("este_mes");
  const [pipelineId, setPipelineId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<ReportsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useMemo(() => {
    const query = new URLSearchParams({ period });
    if (pipelineId) query.set("pipelineId", pipelineId);
    if (ownerId) query.set("ownerId", ownerId);
    if (period === "personalizado" && startDate) query.set("startDate", startDate);
    if (period === "personalizado" && endDate) query.set("endDate", endDate);
    return query;
  }, [period, pipelineId, ownerId, startDate, endDate]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    fetch(`/api/reports?${params.toString()}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Não foi possível carregar os relatórios.");
      setReport(body.report as ReportsSnapshot);
    }).catch((reason: unknown) => { if ((reason as { name?: string })?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Não foi possível carregar os relatórios."); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [params]);

  const csvUrl = `/api/reports?${params.toString()}&format=csv`;
  return <main className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8" data-testid="reports-page">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-indigo-600"><BarChart3 className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-widest">Performance comercial</span></div><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Relatórios</h1><p className="mt-1 text-sm text-slate-500">Indicadores calculados a partir dos dados reais da organização ativa.</p></div><div className="flex gap-2"><button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw className="h-4 w-4" />Atualizar</button><a href={csvUrl} download className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"><Download className="h-4 w-4" />CSV</a></div></header>
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 lg:grid-cols-5"><label className="text-xs font-semibold text-slate-600">Período<select value={period} onChange={(event) => setPeriod(event.target.value as ReportPeriod)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">{periodOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Pipeline<select value={pipelineId} onChange={(event) => setPipelineId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"><option value="">Todos</option>{report?.filters.pipelines.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Responsável<select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"><option value="">Todos</option>{report?.filters.owners.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{period === "personalizado" && <><label className="text-xs font-semibold text-slate-600">De<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs font-semibold text-slate-600">Até<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label></>}</section>
      {loading && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Carregando dados reais…</div>}
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {!loading && !error && report && <>{report.empty && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-semibold text-slate-900">Ainda não há dados para este relatório.</p><p className="mt-1 text-sm text-slate-500">Os indicadores aparecerão quando a organização registrar negócios, leads ou propostas.</p></div>}<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card label="Receita ganha" value={money.format(report.kpis.revenue)} /><Card label="Pipeline aberto" value={money.format(report.kpis.openPipeline)} /><Card label="Forecast" value={money.format(report.kpis.forecast)} hint="Valor × probabilidade" /><Card label="Ticket médio" value={money.format(report.kpis.averageTicket)} /></section><section className="grid gap-4 lg:grid-cols-2"><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-950">Funil por etapa</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3">Etapa</th><th className="pb-3">Negócios</th><th className="pb-3 text-right">Valor</th></tr></thead><tbody>{report.funnel.map((stage) => <tr key={stage.id} className="border-t border-slate-100"><td className="py-3 font-semibold"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />{stage.name}</td><td className="py-3">{number.format(stage.deals)}</td><td className="py-3 text-right">{money.format(stage.value)}</td></tr>)}</tbody></table></div></article><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-950">Ganhos e perdas</h2><div className="mt-4 grid grid-cols-2 gap-3"><Card label="Ganhos" value={`${number.format(report.closed.won)} · ${money.format(report.closed.wonValue)}`} /><Card label="Perdidos" value={`${number.format(report.closed.lost)} · ${money.format(report.closed.lostValue)}`} /><Card label="Win rate" value={`${report.closed.winRate.toFixed(1)}%`} /><Card label="Negócios" value={number.format(report.closed.won + report.closed.lost)} /></div></article></section><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card label="Leads ativos" value={number.format(report.leads.active)} hint={`${number.format(report.leads.created)} novos no período`} /><Card label="Conversão de leads" value={`${report.leads.conversionRate.toFixed(1)}%`} hint={`${number.format(report.leads.converted)} convertidos`} /><Card label="Propostas" value={number.format(report.proposals.total)} hint={`${number.format(report.proposals.accepted)} aceitas`} /><Card label="Win rate propostas" value={`${report.proposals.acceptanceRate.toFixed(1)}%`} /></section><section className="grid gap-4 lg:grid-cols-3"><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">Tarefas</h2><p className="mt-3 text-2xl font-bold">{number.format(report.tasks.created)}</p><p className="text-sm text-slate-500">{number.format(report.tasks.completed)} concluídas · {number.format(report.tasks.overdue)} vencidas</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">Atividades</h2><p className="mt-3 text-2xl font-bold">{number.format(report.activities.total)}</p><p className="text-sm text-slate-500">{number.format(report.activities.completed)} concluídas · {number.format(report.activities.scheduled)} agendadas</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">Produtos</h2><p className="mt-3 text-sm text-slate-500">Sem agregação confiável de produtos nos relatórios atuais.</p></article></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-indigo-600" /><h2 className="font-bold">Desempenho por responsável</h2></div>{report.owners.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{report.owners.map((owner) => <div key={owner.id} className="rounded-xl bg-slate-50 p-3"><p className="truncate text-sm font-semibold">{owner.name}</p><p className="mt-1 text-xs text-slate-500">{number.format(owner.deals)} negócios · {money.format(owner.wonValue)} ganhos</p></div>)}</div> : <p className="mt-3 text-sm text-slate-500">Sem responsáveis com negócios no recorte.</p>}</section></>}
    </div>
  </main>;
}

