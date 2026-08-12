"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

export function RecoveryForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setMessage("A recuperação ainda não está configurada neste ambiente.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
    setMessage(error ? "Não foi possível iniciar a recuperação." : "Se o e-mail existir, você receberá as instruções.");
  }
  return <div className="flex min-h-screen items-center justify-center p-6"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8"><h1 className="text-2xl font-bold text-white">Recuperar senha</h1><p className="mt-2 text-sm text-slate-400">Informe seu e-mail para receber as instruções.</p><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white" /><button className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white">Enviar instruções</button>{message && <p role="status" className="mt-4 text-sm text-slate-300">{message}</p>}<a href="/login" className="mt-5 block text-center text-sm text-indigo-400">Voltar ao login</a></form></div>;
}
