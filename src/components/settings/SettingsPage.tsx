"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Check, Copy, MailPlus, ShieldCheck, UserMinus, UserRoundCheck } from "lucide-react";

type Member = { id: string; user_id: string; role: string; status: string; created_at: string; profiles?: { full_name?: string } | null };
type Invite = { id: string; email: string; role: string; status: string; expires_at: string };
type Data = { organization: { id: string; name: string; slug: string | null; status: string; created_at: string }; currentRole: string | null; members: Member[]; invites: Invite[] };
const roles = ["admin", "manager", "sales", "viewer"];

export function SettingsPage() {
  const [tab, setTab] = useState("empresa");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("sales");
  const [inviteUrl, setInviteUrl] = useState("");
  const [companyName, setCompanyName] = useState("");

  async function load() {
    const response = await fetch("/api/settings/team");
    const payload = await response.json() as Data & { error?: string };
    if (!response.ok) { setError(payload.error ?? "Não foi possível carregar as configurações"); return; }
    setData(payload); setCompanyName(payload.organization.name); setError("");
  }
  useEffect(() => { void load(); }, []);
  const canManage = useMemo(() => ["owner", "admin"].includes(data?.currentRole ?? ""), [data?.currentRole]);

  async function updateCompany() {
    const response = await fetch("/api/settings/company", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: companyName, slug: data?.organization.slug }) });
    if (!response.ok) { setError("Você não tem permissão para editar a empresa"); return; }
    setMessage("Dados da empresa atualizados"); await load();
  }
  async function invite() {
    const response = await fetch("/api/settings/invites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: inviteEmail, role: inviteRole }) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.error ?? "Não foi possível criar o convite"); return; }
    setInviteUrl(payload.inviteUrl); setInviteEmail(""); setMessage("Convite criado. Link disponível somente para desenvolvimento/teste."); await load();
  }
  async function memberAction(id: string, action: "role" | "status", value: string) {
    const response = await fetch(`/api/settings/members/${id}/${action}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ [action]: value }) });
    if (!response.ok) setError((await response.json()).error ?? "Ação não autorizada"); else { setMessage("Alteração aplicada"); await load(); }
  }
  async function revoke(id: string) {
    const response = await fetch("/api/settings/invites", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) { setMessage("Convite revogado"); await load(); } else setError("Não foi possível revogar o convite");
  }

  if (!data) return <main className="p-6"><p className="text-sm text-slate-500">{error || "Carregando configurações..."}</p></main>;
  return <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
    <header><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Administração SaaS</p><h1 className="mt-1 text-2xl font-black text-slate-900">Configurações</h1><p className="mt-1 text-sm text-slate-500">Gerencie a empresa, a equipe e as permissões da organização ativa.</p></header>
    <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">{[["empresa", "Minha Empresa", Building2], ["equipe", "Equipe", MailPlus], ["papeis", "Papéis e Permissões", ShieldCheck]].map(([id, label, Icon]) => <button key={id as string} onClick={() => setTab(id as string)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}><Icon className="h-4 w-4" />{label as string}</button>)}</nav>
    {message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><Check className="mr-2 inline h-4 w-4" />{message}</p>}
    {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {tab === "empresa" && <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Minha Empresa</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-600 sm:col-span-2">Nome<input value={companyName} onChange={(event) => setCompanyName(event.target.value)} disabled={!canManage} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900" /></label><div><p className="text-xs font-bold uppercase text-slate-400">Slug</p><p className="mt-1 text-sm text-slate-700">{data.organization.slug ?? "—"}</p></div><div><p className="text-xs font-bold uppercase text-slate-400">Status</p><p className="mt-1 text-sm text-slate-700">{data.organization.status}</p></div><div><p className="text-xs font-bold uppercase text-slate-400">Criada em</p><p className="mt-1 text-sm text-slate-700">{new Date(data.organization.created_at).toLocaleDateString("pt-BR")}</p></div></div>{canManage && <button onClick={() => void updateCompany()} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white">Salvar alterações</button>}</section>}
    {tab === "papeis" && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Papéis e Permissões</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{[["owner", "Administra organização, equipe, convites e papéis"], ["admin", "Administra equipe sem alterar owner"], ["manager", "Visualiza equipe"], ["sales", "Sem gestão de equipe"], ["viewer", "Sem gestão de equipe"]].map(([role, description]) => <div key={role} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="font-bold capitalize text-slate-800">{role}</p><p className="mt-1 text-sm text-slate-500">{description}</p></div>)}</div></section>}
    {tab === "equipe" && <section className="space-y-5"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{canManage && <><h2 className="text-lg font-bold text-slate-900">Novo convite</h2><div className="mt-4 flex flex-col gap-3 sm:flex-row"><input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="e-mail@empresa.com" type="email" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5" /><select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5">{roles.map((role) => <option key={role}>{role}</option>)}</select><button onClick={() => void invite()} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white">Convidar</button></div>{inviteUrl && <div className="mt-3 flex items-center gap-2 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-800"><span className="min-w-0 flex-1 break-all">Link de teste: {inviteUrl}</span><button onClick={() => void navigator.clipboard?.writeText(inviteUrl)} title="Copiar link"><Copy className="h-4 w-4" /></button></div>}</>}</div><div className="grid gap-3 md:hidden">{data.members.map((member) => <MemberCard key={member.id} member={member} canManage={canManage} onAction={memberAction} />)}</div><div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Membro</th><th className="p-4">Cargo</th><th className="p-4">Status</th><th className="p-4">Ações</th></tr></thead><tbody>{data.members.map((member) => <tr key={member.id} className="border-t border-slate-100"><td className="p-4 font-semibold">{member.profiles?.full_name ?? member.user_id}</td><td className="p-4"><select disabled={!canManage || member.role === "owner"} value={member.role} onChange={(event) => void memberAction(member.id, "role", event.target.value)} className="rounded-lg border border-slate-200 px-2 py-1">{["owner", ...roles].map((role) => <option key={role}>{role}</option>)}</select></td><td className="p-4">{member.status}</td><td className="p-4">{canManage && member.role !== "owner" && <button onClick={() => void memberAction(member.id, "status", member.status === "active" ? "suspended" : "active")} className="text-indigo-600">{member.status === "active" ? "Suspender" : "Reativar"}</button>}</td></tr>)}</tbody></table></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">Convites pendentes</h2>{data.invites.length ? data.invites.map((invite) => <div key={invite.id} className="flex flex-col gap-2 border-b border-slate-100 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span>{invite.email} · {invite.role}</span>{canManage && <button onClick={() => void revoke(invite.id)} className="text-left text-rose-600">Revogar</button>}</div>) : <p className="mt-3 text-sm text-slate-500">Nenhum convite pendente.</p>}</div></section>}
  </main>;
}

function MemberCard({ member, canManage, onAction }: { member: Member; canManage: boolean; onAction: (id: string, action: "role" | "status", value: string) => void }) {
  const protectedMember = member.role === "owner";
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="font-bold text-slate-900">{member.profiles?.full_name ?? member.user_id}</p><p className="mt-1 text-sm text-slate-500">{member.role} · {member.status}</p>{canManage && !protectedMember && <div className="mt-3 flex gap-2"><select value={member.role} onChange={(event) => onAction(member.id, "role", event.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">{roles.map((role) => <option key={role}>{role}</option>)}</select><button onClick={() => onAction(member.id, "status", member.status === "active" ? "suspended" : "active")} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold">{member.status === "active" ? <UserMinus className="inline h-3 w-3" /> : <UserRoundCheck className="inline h-3 w-3" />}</button></div>}</article>;
}
