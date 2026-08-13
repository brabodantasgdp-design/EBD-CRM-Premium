import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../../lib/supabase/auth";
import { dryRunAutomation } from "../../../../../lib/crm/automations";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { const { supabase } = await requireUser(); const org = await getCurrentOrganization(); if (!supabase || !org) return NextResponse.json({ error: "Acesso negado" }, { status: 403 }); try { return NextResponse.json({ dryRun: await dryRunAutomation(supabase, org.id, (await context.params).id, await request.json()) }); } catch { return NextResponse.json({ error: "Não foi possível validar o dry-run" }, { status: 400 }); } }
