import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../../lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { id } = await params;
  const body = await request.json().catch(() => null) as { role?: string } | null;
  if (!supabase || !body?.role) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const { error } = await supabase.rpc("change_member_role", { target_member: id, target_role: body.role });
  if (error) return NextResponse.json({ error: "Alteração de cargo não autorizada" }, { status: 403 });
  return NextResponse.json({ ok: true });
}
