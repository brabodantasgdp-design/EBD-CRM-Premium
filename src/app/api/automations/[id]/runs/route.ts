import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../../lib/supabase/auth";
import { listRuns } from "../../../../../lib/crm/automations";
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) { const { supabase } = await requireUser(); const org = await getCurrentOrganization(); if (!supabase || !org) return NextResponse.json({ error: "Acesso negado" }, { status: 403 }); try { return NextResponse.json({ runs: await listRuns(supabase, org.id, (await context.params).id) }); } catch { return NextResponse.json({ error: "Não foi possível carregar execuções" }, { status: 500 }); } }
