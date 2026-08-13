import { NextResponse } from "next/server";
import { getCurrentOrganization, requireUser } from "../../../../lib/supabase/auth";
import { createLead, listLeads } from "../../../../lib/crm/leads";
import { cookies } from "next/headers";
import { dispatchAutomationEvent } from "../../../../lib/crm/automations";

export async function GET() {
  const { supabase, user } = await requireUser();
  const organization = await getCurrentOrganization();
  if (!supabase || !user) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  if (!organization) {
    const activeId = (await cookies()).get("nexus-active-organization")?.value;
    const memberships = await supabase.from("organization_members").select("organization_id, role, status").eq("user_id", user.id);
    const membership = memberships.data?.find((item) => item.organization_id === activeId) ?? memberships.data?.[0];
    return NextResponse.json({ error: "Organização indisponível", role: membership?.status === "suspended" ? "suspended" : membership?.role ?? null, leads: [] }, { status: 403 });
  }
  try {
    const membership = await supabase.from("organization_members").select("role").eq("organization_id", organization.id).eq("user_id", user.id).eq("status", "active").maybeSingle();
    return NextResponse.json({ leads: await listLeads(supabase, organization.id), role: membership.data?.role ?? null });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar os leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  const organization = await getCurrentOrganization();
  if (!supabase || !user || !organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  try {
    const lead = await createLead(supabase, organization.id, user.id, body);
    try { await dispatchAutomationEvent(supabase, user.id, { organizationId: organization.id, eventType: "lead.created", entityType: "lead", entityId: lead.id, context: lead as unknown as Record<string, unknown> }); } catch { /* isolated */ }
    return NextResponse.json({ lead }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível criar o lead" }, { status: 400 });
  }
}
