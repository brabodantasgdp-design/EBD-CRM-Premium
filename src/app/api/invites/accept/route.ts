import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await request.json().catch(() => null) as { token?: string } | null;
  if (!supabase || !body?.token) return NextResponse.json({ error: "Convite inválido" }, { status: 400 });
  const { error, data } = await supabase.rpc("accept_organization_invite", { target_hash: createHash("sha256").update(body.token).digest("hex") });
  if (error) return NextResponse.json({ error: "Convite inválido, expirado ou não autorizado" }, { status: 400 });
  const response = NextResponse.json({ organizationId: data });
  response.cookies.set("nexus-active-organization", data, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  return response;
}
