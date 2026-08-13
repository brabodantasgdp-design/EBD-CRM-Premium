import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../../../lib/supabase/auth";
type Context = { params: Promise<{ id: string }> };
export async function POST(_: Request, context: Context) { const { supabase } = await requireUser(); const organization = await getCurrentOrganization(); const { id } = await context.params; if (!supabase || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 }); const { data, error } = await supabase.rpc("mark_deal_won", { target_deal: id, target_stage: null }); if (error) return NextResponse.json({ error: "Não foi possível marcar como ganho" }, { status: 400 }); return NextResponse.json({ deal: data }); }
