import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const envText = await fs.readFile(".env.local", "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line.includes("=")).map((line) => { const index = line.indexOf("="); return [line.slice(0, index), line.slice(index + 1).trim().replace(/^"|"$/g, "")]; }));
const base = process.env.E2E_BASE_URL || "https://crmpro-detki3mn6-gestao-de-sistema.vercel.app";
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !publicKey || !serviceRole || !env.E2E_OWNER_A_EMAIL || !env.E2E_OWNER_A_PASSWORD || !env.E2E_OWNER_B_EMAIL || !env.E2E_OWNER_B_PASSWORD) throw new Error("Required fixture environment is incomplete");
const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
const publicClient = createClient(url, publicKey, { auth: { autoRefreshToken: false, persistSession: false } });
const users = (await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })).data.users;
const findUser = (email) => users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
const ownerA = findUser(env.E2E_OWNER_A_EMAIL);
const ownerB = findUser(env.E2E_OWNER_B_EMAIL);
if (!ownerA || !ownerB) throw new Error("Owner fixtures not found");
const membershipRows = (await admin.from("organization_members").select("organization_id,user_id,role,status").in("user_id", [ownerA.id, ownerB.id])).data ?? [];
const orgA = membershipRows.find((row) => row.user_id === ownerA.id && row.role === "owner")?.organization_id;
const orgB = membershipRows.find((row) => row.user_id === ownerB.id && row.role === "owner")?.organization_id;
if (!orgA || !orgB) throw new Error("Owner organizations not found");

const emptySlug = "nexus-phase-15-empty-org";
let emptyOrg = (await admin.from("organizations").select("id").eq("slug", emptySlug).maybeSingle()).data;
if (!emptyOrg) emptyOrg = (await admin.from("organizations").insert({ name: "Nexus QA Empty Organization", slug: emptySlug, created_by: ownerA.id }).select("id").single()).data;
if (!emptyOrg?.id) throw new Error("Empty organization fixture failed");
const emptyOrgId = emptyOrg.id;
const emptyMembership = await admin.from("organization_members").upsert({ organization_id: emptyOrgId, user_id: ownerA.id, role: "owner", status: "active" }, { onConflict: "organization_id,user_id" });
if (emptyMembership.error) throw emptyMembership.error;

const qaPassword = "NexusQA-Phase15-2026!";
const qaUsers = [
  ["qa-phase15-admin@nexuscrm.test", "admin", "active"],
  ["qa-phase15-manager@nexuscrm.test", "manager", "active"],
  ["qa-phase15-sales@nexuscrm.test", "sales", "active"],
  ["qa-phase15-viewer@nexuscrm.test", "viewer", "active"],
  ["qa-phase15-suspended@nexuscrm.test", "sales", "suspended"],
];
const qaMemberships = [];
for (const [email, role, status] of qaUsers) {
  let user = findUser(email);
  if (!user) user = (await admin.auth.admin.createUser({ email, password: qaPassword, email_confirm: true })).data.user;
  else await admin.auth.admin.updateUserById(user.id, { password: qaPassword, email_confirm: true });
  if (!user) throw new Error(`Could not prepare ${role} fixture`);
  const membership = await admin.from("organization_members").upsert({ organization_id: orgA, user_id: user.id, role, status }, { onConflict: "organization_id,user_id" });
  if (membership.error) throw membership.error;
  qaMemberships.push({ email, password: qaPassword, role, status });
}
const marker = "NEXUS_PHASE15_ORG_B_MARKER_2026";
await admin.from("leads").delete().eq("organization_id", orgB).eq("name", marker);
const markerRow = (await admin.from("leads").insert({ organization_id: orgB, created_by: ownerB.id, name: marker, email: "phase15-marker@example.invalid", status: "new", source: "qa" }).select("id").single()).data;
const bypass = env.VERCEL_AUTOMATION_BYPASS_SECRET;
const cookieHeader = (response) => {
  const values = response.headers.getSetCookie?.() ?? [];
  return values.map((value) => value.split(";", 1)[0]).join("; ");
};
const mergeCookies = (oldCookie, response) => {
  const map = new Map((oldCookie || "").split("; ").filter(Boolean).map((item) => item.split("=", 2)));
  for (const item of cookieHeader(response).split("; ").filter(Boolean)) { const [name, value] = item.split("=", 2); map.set(name, value); }
  return [...map.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
};
async function login(email, password) {
  const response = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", ...(bypass ? { "x-vercel-protection-bypass": bypass } : {}) }, body: new URLSearchParams({ email, password, next: "/relatorios" }) });
  return { response, cookie: cookieHeader(response) };
}
async function request(path, cookie, init = {}) {
  return fetch(`${base}${path}`, { ...init, headers: { ...(init.headers || {}), ...(bypass ? { "x-vercel-protection-bypass": bypass } : {}), ...(cookie ? { cookie } : {}) } });
}
async function reportsFor(email, password) {
  const auth = await login(email, password);
  const response = await request("/api/reports?period=este_mes", auth.cookie);
  const body = await response.json().catch(() => ({}));
  return { login: auth.response.status, status: response.status, error: body?.error, body, cookie: auth.cookie };
}
const ownerAReport = await reportsFor(env.E2E_OWNER_A_EMAIL, env.E2E_OWNER_A_PASSWORD);
const ownerBReport = await reportsFor(env.E2E_OWNER_B_EMAIL, env.E2E_OWNER_B_PASSWORD);
if (ownerAReport.status !== 200 || ownerBReport.status !== 200) throw new Error("Owner reports request failed");
if (JSON.stringify(ownerAReport.body).includes(marker) || JSON.stringify(ownerBReport.body).includes(marker)) throw new Error("Cross-tenant marker leaked into reports");
const ownerAEmptySelect = await request("/api/organizations/select", ownerAReport.cookie, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ organizationId: emptyOrgId }) });
let emptyCookie = mergeCookies(ownerAReport.cookie, ownerAEmptySelect);
const emptyReportResponse = await request("/api/reports?period=este_mes", emptyCookie);
const emptyReport = await emptyReportResponse.json();
const emptyMetrics = emptyReport.metrics ?? emptyReport.report ?? {};
const emptyPass = emptyReportResponse.status === 200 && [emptyMetrics.kpis?.revenue, emptyMetrics.kpis?.forecast, emptyMetrics.kpis?.averageTicket, emptyMetrics.closed?.won, emptyMetrics.closed?.lost, emptyMetrics.leads?.created, emptyMetrics.proposals?.total, emptyMetrics.tasks?.created, emptyMetrics.activities?.total].every((value) => Number(value) === 0) && (emptyMetrics.funnel ?? []).every((stage) => stage.deals === 0 && Number(stage.value) === 0);
if (!emptyPass) throw new Error("Empty organization report is not zeroed");
const ownerABackSelect = await request("/api/organizations/select", emptyCookie, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ organizationId: orgA }) });
emptyCookie = mergeCookies(emptyCookie, ownerABackSelect);
const exportA = await request("/api/reports?period=este_mes&format=csv", emptyCookie);
const exportText = await exportA.text();
if (exportA.status !== 200 || exportText.includes(marker)) throw new Error("Org A export isolation failed");
const ownerASpoofB = await request("/api/organizations/select", emptyCookie, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ organizationId: orgB }) });
const ownerBSpoofA = await request("/api/organizations/select", ownerBReport.cookie, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ organizationId: orgA }) });
const roleResults = {};
for (const fixture of qaMemberships) { const fixtureUser = (await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })).data.users.find((user) => user.email?.toLowerCase() === fixture.email.toLowerCase()); const fixtureMembership = fixtureUser ? (await admin.from("organization_members").select("organization_id,role,status").eq("user_id", fixtureUser.id).eq("organization_id", orgA).maybeSingle()).data : null; const result = await reportsFor(fixture.email, fixture.password); const organizations = await request("/api/organizations", result.cookie); const organizationBody = await organizations.json().catch(() => ({})); const resultKey = fixture.status === "suspended" ? "suspended" : fixture.role; roleResults[resultKey] = { login: result.login, status: result.status, error: result.error, organizations: organizations.status, organizationCount: Array.isArray(organizationBody.organizations) ? organizationBody.organizations.length : 0, fixtureMembership: fixtureMembership ? { role: fixtureMembership.role, status: fixtureMembership.status } : null, expected: fixture.status === "suspended" ? "blocked" : "read" }; }
if (markerRow?.id) await admin.from("leads").delete().eq("id", markerRow.id);
const rolesPass = Object.entries(roleResults).every(([role, result]) => role === "suspended" ? result.status !== 200 : result.status === 200);
const result = { emptyOrg: { status: emptyReportResponse.status, pass: emptyPass }, crossTenant: { ownerAReport: ownerAReport.status, ownerBReport: ownerBReport.status, ownerASpoofB: ownerASpoofB.status, ownerBSpoofA: ownerBSpoofA.status, markerLeaked: false }, roles: roleResults, rolesPass, export: { status: exportA.status, markerLeaked: false } };
console.log(JSON.stringify(result));
if (!rolesPass) throw new Error(JSON.stringify({ roleResults }));
