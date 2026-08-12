import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../../lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { id } = await params;
  const body = await request.json().catch(() => null) as { status?: string } | null;
  if (!supabase || !body?.status) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const { error } = await supabase.rpc("set_member_status", { target_member: id, target_status: body.status });
  if (error) return NextResponse.json({ error: "Alteração de status não autorizada" }, { status: 403 });
  return NextResponse.json({ ok: true });
}
