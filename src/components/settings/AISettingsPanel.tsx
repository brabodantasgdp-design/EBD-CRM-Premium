"use client";

import { useEffect, useState } from "react";

type Setting = { provider: "groq" | "gemini"; model: string; enabled: boolean; configured: boolean; keyLastFour: string | null };

export function AISettingsPanel() {
  const [setting, setSetting] = useState<Setting | null>(null);
  const [provider, setProvider] = useState<"groq" | "gemini">("groq");
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/settings/ai");
    if (!response.ok) return;
    const next = await response.json() as Setting;
    setSetting(next);
    if (next.configured) { setProvider(next.provider); setModel(next.model); }
  }
  useEffect(() => { void load(); }, []);

  async function submit(action: "test" | "save" | "disable") {
    setBusy(true); setStatus("");
    const response = await fetch("/api/settings/ai", action === "disable" ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) } : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, provider, model, apiKey }) });
    const result = await response.json() as { error?: string; message?: string; success?: boolean; configured?: boolean; keyLastFour?: string };
    setBusy(false);
    if (!response.ok || !result.success) { setStatus(result.error ?? "Não foi possível concluir a operação."); return; }
    setStatus(result.message ?? (action === "disable" ? "IA desativada." : action === "test" ? "Conexão testada com sucesso." : "Configuração salva com segurança."));
    if (action === "save") { setApiKey(""); await load(); }
    if (action === "disable") setSetting((current) => current ? { ...current, enabled: false, configured: false } : current);
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="ai-settings"><h2 className="text-lg font-bold text-slate-900">Inteligência Artificial</h2><p className="mt-1 text-sm text-slate-500">Configure uma credencial própria da organização. A chave nunca é exibida novamente.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-600">Provider<select value={provider} onChange={(event) => setProvider(event.target.value as "groq" | "gemini")} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="groq">Groq</option><option value="gemini">Gemini</option></select></label><label className="text-sm font-semibold text-slate-600">Modelo<input value={model} onChange={(event) => setModel(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label><label className="text-sm font-semibold text-slate-600 sm:col-span-2">API Key<input value={apiKey} onChange={(event) => setApiKey(event.target.value)} type="password" autoComplete="new-password" placeholder={setting?.configured ? "Digite uma nova chave para trocar" : "Cole a chave do provider"} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label></div><div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Status: <strong>{setting?.configured && setting.enabled ? "conectado" : setting?.configured ? "desativado" : "não configurado"}</strong>{setting?.keyLastFour ? <span> · últimos 4: ****{setting.keyLastFour}</span> : null}</div><div className="mt-4 flex flex-wrap gap-2"><button disabled={busy || apiKey.length < 8} onClick={() => void submit("test")} className="rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-bold text-indigo-700 disabled:opacity-50">Testar conexão</button><button disabled={busy || apiKey.length < 8} onClick={() => void submit("save")} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{setting?.configured ? "Trocar chave" : "Salvar"}</button>{setting?.configured && <button disabled={busy} onClick={() => void submit("disable")} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 disabled:opacity-50">Desativar</button>}</div>{status && <p className="mt-3 text-sm text-slate-600" role="status">{status}</p>}</section>;
}
