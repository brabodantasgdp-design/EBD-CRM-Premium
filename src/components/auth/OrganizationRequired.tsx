"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OrganizationRequired() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch("/api/organizations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error ?? "Não foi possível criar a organização.");
    router.refresh();
  }
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6"><form onSubmit={create} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8"><h1 className="text-2xl font-black text-white">Crie sua organização</h1><p className="mt-2 text-sm text-slate-400">Seu usuário ainda não possui acesso a uma organização ativa.</p><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da organização" className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white" /><button className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white">Criar organização</button>{message && <p role="alert" className="mt-4 text-sm text-rose-300">{message}</p>}<button type="button" onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => router.replace("/login"))} className="mt-5 w-full text-sm text-slate-400">Sair</button></form></main>;
}
