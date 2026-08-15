import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../lib/supabase/auth";
import { getReports, type ReportPeriod, type ReportQuery } from "../../../lib/crm/reports/metrics";

const periods = new Set<ReportPeriod>(["hoje", "7dias", "30dias", "este_mes", "3_meses", "personalizado"]);

export async function GET(request: Request) {
  const { supabase } = await requireUser();
  const organization = await getCurrentOrganization();
  if (!supabase || !organization) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const requested = params.get("period") as ReportPeriod | null;
  const query: ReportQuery = { period: requested && periods.has(requested) ? requested : "este_mes", pipelineId: params.get("pipelineId") || undefined, ownerId: params.get("ownerId") || undefined, startDate: params.get("startDate") || undefined, endDate: params.get("endDate") || undefined };
  try {
    const report = await getReports(supabase, organization.id, query);
    if (params.get("format") === "csv") {
      const lines = [["Métrica", "Valor"], ["Receita ganha", report.kpis.revenue], ["Pipeline aberto", report.kpis.openPipeline], ["Forecast", report.kpis.forecast], ["Ticket médio", report.kpis.averageTicket], ["Win rate", report.closed.winRate], ["Leads criados", report.leads.created], ["Propostas", report.proposals.total], ["Tarefas criadas", report.tasks.created], ["Atividades", report.activities.total]].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
      return new Response(`\ufeff${lines.join("\n")}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=relatorio-nexus.csv", "Cache-Control": "private, no-store" } });
    }
    return NextResponse.json({ report }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar os relatórios." }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}

