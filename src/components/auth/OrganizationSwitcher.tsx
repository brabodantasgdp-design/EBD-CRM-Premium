"use client";

import { useEffect, useState } from "react";
import { Building, ChevronDown } from "lucide-react";
import { MOCK_COMPANIES } from "../../data/mockCrmData";
import { hasSupabaseConfiguration } from "../../lib/supabase/env";

type Organization = { id: string; name: string; plan?: string };

export function OrganizationSwitcher() {
  const fallback = MOCK_COMPANIES.map((company) => ({ id: company.id, name: company.name, plan: company.plan }));
  const commercialPersistence = hasSupabaseConfiguration();
  const [organizations, setOrganizations] = useState<Organization[]>(commercialPersistence ? [] : fallback);
  const [configured, setConfigured] = useState(false);
  const [activeId, setActiveId] = useState<string | undefined>(commercialPersistence ? undefined : fallback[0]?.id);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/organizations").then(async (response) => {
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json") ? await response.json() : null;
      return { response, payload };
    }).then(({ response, payload }) => {
      if (!payload) return;
      if (!payload.configured) return;
      setConfigured(true);
      if (response.ok) {
        const rows = (payload.organizations ?? []).map((row: { organization_id: string; organizations: Organization | null }) => ({ ...(row.organizations ?? { name: "Sem organização" }), id: row.organization_id }));
        setOrganizations(rows);
        setActiveId(rows[0]?.id);
      }
    }).catch(() => setOrganizations([]));
  }, []);

  async function select(id: string) {
    if (!configured) { setActiveId(id); setOpen(false); return; }
    const response = await fetch("/api/organizations/select", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ organizationId: id }) });
    if (response.ok) { setActiveId(id); setOpen(false); window.location.reload(); }
  }

  const active = organizations.find((organization) => organization.id === activeId) ?? organizations[0];
  return <div className="relative p-3 border-b border-slate-800/60"><button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-colors text-left"><div className="flex items-center gap-2.5 min-w-0"><div className="h-7 w-7 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-800/50"><Building className="h-3.5 w-3.5" /></div><div className="min-w-0"><p className="text-xs font-semibold text-white truncate">{active?.name ?? "Sem organização"}</p><p className="text-[10px] text-indigo-300 font-medium">{configured ? "Organização autorizada" : active?.plan}</p></div></div><ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" /></button>{open && <div className="absolute left-3 right-3 top-16 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-1 z-50"><p className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Mudar organização</p>{organizations.map((organization) => <button key={organization.id} onClick={() => select(organization.id)} className={`w-full flex items-center justify-between p-2 text-xs rounded-lg transition-colors ${organization.id === activeId ? "bg-indigo-600/30 text-indigo-200 font-medium border border-indigo-500/30" : "hover:bg-slate-700/60 text-slate-300"}`}><span className="truncate">{organization.name}</span>{organization.id === activeId && <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />}</button>)}</div>}</div>;
}
