import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  if (!email) return NextResponse.json({ error: "Não foi possível iniciar a recuperação." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "A recuperação não está configurada neste ambiente." }, { status: 503 });
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${new URL(request.url).origin}/login` });
  if (error) return NextResponse.json({ error: "Não foi possível iniciar a recuperação." }, { status: 400 });
  return NextResponse.json({ message: "Se o e-mail existir, você receberá as instruções." });
}
