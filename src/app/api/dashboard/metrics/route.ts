import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../lib/supabase/auth";
import { getDashboardMetrics, type DashboardPeriod } from "../../../../lib/crm/dashboard/metrics";

const periods = new Set<DashboardPeriod>(["hoje", "7dias", "30dias", "este_mes"]);

export async function GET(request: Request) {
  const { supabase } = await requireUser();
  const organization = await getCurrentOrganization();
  if (!supabase || !organization) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const requested = new URL(request.url).searchParams.get("period") as DashboardPeriod | null;
  const period = requested && periods.has(requested) ? requested : "este_mes";
  try {
    return NextResponse.json({ metrics: await getDashboardMetrics(supabase, organization.id, period) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar as métricas" }, { status: 500 });
  }
}
