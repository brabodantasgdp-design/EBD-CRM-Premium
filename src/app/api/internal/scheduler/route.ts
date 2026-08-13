import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "../../../../lib/supabase/env";
import { processDueFollowUps } from "../../../../lib/crm/automations";

export async function POST(request: Request) {
  const secret = process.env.SCHEDULER_SECRET || process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const config = getSupabasePublicEnv(); const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !serviceRole) return NextResponse.json({ error: "Scheduler não configurado" }, { status: 503 });
  const organizationId = request.headers.get("x-organization-id"); if (!organizationId) return NextResponse.json({ error: "Organização obrigatória" }, { status: 400 });
  const supabase = createClient(config.url, serviceRole);
  try { return NextResponse.json({ processed: await processDueFollowUps(supabase, organizationId) }); } catch { return NextResponse.json({ error: "Scheduler indisponível" }, { status: 500 }); }
}
