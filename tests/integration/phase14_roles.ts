import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const base = process.env.E2E_BASE_URL || "https://crmpro-git-feat-copilot-ai-gestao-de-sistema.vercel.app";
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const viewerEmail = process.env.E2E_VIEWER_A_EMAIL;
const viewerPassword = process.env.E2E_VIEWER_A_PASSWORD;
const suspendedEmail = process.env.E2E_SUSPENDED_A_EMAIL;
const suspendedPassword = process.env.E2E_SUSPENDED_A_PASSWORD;
if (!url || !key || !viewerEmail || !viewerPassword || !suspendedEmail || !suspendedPassword) throw new Error("Role fixture environment is incomplete");

function cookies(response: Response) { return (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.()?.map((value) => value.split(";", 1)[0]).join("; ") || ""; }
async function request(path: string, init: RequestInit = {}, cookie = "") { return fetch(base + path, { ...init, headers: { ...(init.headers || {}), ...(bypass ? { "x-vercel-protection-bypass": bypass } : {}), ...(cookie ? { cookie } : {}) } }); }
async function run(email: string, password: string, expectedRole: string, expectedStatus: string, dealId?: string) {
  const client = createClient(url!, key!);
  const signed = await client.auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.user) throw signed.error || new Error("Role login failed");
  const membership = await client.from("organization_members").select("organization_id, role, status").eq("user_id", signed.data.user.id).limit(1).single();
  const login = await request("/api/auth/login", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ email, password, next: "/copilot" }) });
  const cookie = cookies(login);
  const before = await client.from("ai_usage_logs").select("id", { count: "exact", head: true }).eq("user_id", signed.data.user.id).eq("status", "success");
  const copilot = await request("/api/copilot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ feature: "chat", question: "Resuma somente dados já autorizados.", entityType: dealId ? "deal" : undefined, entityId: dealId }) }, cookie);
  const body = await copilot.json().catch(() => ({}));
  const after = await client.from("ai_usage_logs").select("id", { count: "exact", head: true }).eq("user_id", signed.data.user.id).eq("status", "success");
  const settings = await request("/api/settings/ai", {}, cookie);
  return { login: login.status === 200 && Boolean(cookie), role: membership.data?.role === expectedRole, status: membership.data?.status === expectedStatus, copilotStatus: copilot.status, provider: body.provider || null, contextCount: Array.isArray(body.contextUsed) ? body.contextUsed.length : 0, settingsStatus: settings.status, successUsageDelta: (after.count || 0) - (before.count || 0) };
}

const viewerClient = createClient(url, key);
const viewerAuth = await viewerClient.auth.signInWithPassword({ email: viewerEmail, password: viewerPassword });
if (viewerAuth.error || !viewerAuth.data.user) throw viewerAuth.error || new Error("Viewer login failed");
const viewerMembership = await viewerClient.from("organization_members").select("organization_id").eq("user_id", viewerAuth.data.user.id).eq("status", "active").single();
const viewerDeal = viewerMembership.data ? await viewerClient.from("deals").select("id").eq("organization_id", viewerMembership.data.organization_id).is("archived_at", null).limit(1).maybeSingle() : { data: null };
const viewer = await run(viewerEmail, viewerPassword, "viewer", "active", viewerDeal.data?.id);
const suspended = await run(suspendedEmail, suspendedPassword, "sales", "suspended");
console.log(JSON.stringify({ viewer, suspended }));
