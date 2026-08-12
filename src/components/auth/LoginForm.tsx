"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";
import { hasSupabaseConfiguration } from "../../lib/supabase/env";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("A autenticação ainda não está configurada neste ambiente.");
      return;
    }
    setLoading(true);
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }
    router.replace(nextPath || "/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8"><p className="text-sm font-bold text-indigo-400">NexusCRM</p><h1 className="mt-2 text-3xl font-black text-white">Entrar na sua operação</h1><p className="mt-2 text-sm text-slate-400">Acesse seu ambiente comercial com segurança.</p></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-slate-300">E-mail<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-indigo-500" /></label>
          <label className="block text-sm text-slate-300">Senha<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-indigo-500" /></label>
          {error && <p role="alert" className="rounded-xl border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-300">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:opacity-60">{loading ? "Entrando..." : "Entrar"}</button>
        </form>
        <a href="/recuperar-senha" className="mt-5 block text-center text-sm font-semibold text-indigo-400 hover:text-indigo-300">Esqueci minha senha</a>
        {!hasSupabaseConfiguration() && <p className="mt-6 text-center text-xs text-amber-400">Ambiente local sem credenciais Supabase configuradas.</p>}
      </div>
    </div>
  );
}
