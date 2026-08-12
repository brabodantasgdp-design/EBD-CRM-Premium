"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

export function InviteAccept({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = use(searchParams);
  const router = useRouter();
  const [state, setState] = useState("idle");
  async function accept() {
    if (!params.token) { setState("invalid"); return; }
    setState("loading");
    const response = await fetch("/api/invites/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: params.token }) });
    if (!response.ok) { setState("invalid"); return; }
    setState("success"); router.replace("/dashboard"); router.refresh();
  }
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-black text-slate-900">Convite para o Nexus CRM</h1><p className="mt-3 text-sm text-slate-500">Entre com o usuário autorizado para aceitar este convite.</p>{state === "invalid" && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">Convite inválido, expirado ou não autorizado.</p>}{state !== "success" && <button onClick={() => void accept()} disabled={state === "loading"} className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white">{state === "loading" ? "Validando..." : "Aceitar convite"}</button>}</section></main>;
}
