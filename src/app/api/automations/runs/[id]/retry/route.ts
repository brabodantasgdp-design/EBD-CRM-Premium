import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../../../lib/supabase/auth";
import { retryAutomationRun } from "../../../../../../lib/crm/automations";
export async function POST(_: Request, context: { params: Promise<{ id: string }> }) { const { supabase, user } = await requireUser(); const org = await getCurrentOrganization(); if (!supabase || !user || !org) return NextResponse.json({ error: "Acesso negado" }, { status: 403 }); try { return NextResponse.json({ run: await retryAutomationRun(supabase, user.id, org.id, (await context.params).id) }); } catch { return NextResponse.json({ error: "Retry não permitido" }, { status: 400 }); } }
