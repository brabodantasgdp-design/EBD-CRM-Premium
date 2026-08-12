import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { getSafeRedirectPath } from "../../../../lib/auth/safeRedirect";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const nextPath = getSafeRedirectPath(String(form.get("next") ?? ""));
  if (!email || !password) return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "A autenticação não está configurada neste ambiente." }, { status: 503 });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const response = NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    return response;
  }
  return NextResponse.json({ redirectTo: nextPath });
}
