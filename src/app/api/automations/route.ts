import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../lib/supabase/auth";
import { createAutomation, listAutomations } from "../../../lib/crm/automations";

export async function GET() { const { supabase } = await requireUser(); const org = await getCurrentOrganization(); if (!supabase || !org) return NextResponse.json({ error: "Acesso negado" }, { status: 403 }); try { return NextResponse.json({ automations: await listAutomations(supabase, org.id) }); } catch { return NextResponse.json({ error: "Não foi possível carregar automações" }, { status: 500 }); } }
export async function POST(request: Request) { const { supabase, user } = await requireUser(); const org = await getCurrentOrganization(); if (!supabase || !user || !org) return NextResponse.json({ error: "Acesso negado" }, { status: 403 }); try { return NextResponse.json({ automation: await createAutomation(supabase, org.id, user.id, await request.json()) }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Dados inválidos" }, { status: 400 }); } }
