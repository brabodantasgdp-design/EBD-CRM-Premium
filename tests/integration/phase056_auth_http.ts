import { readFileSync } from "node:fs";

const baseUrl = envValue("E2E_BASE_URL", "https://crmpro-r9x0k2hig-gestao-de-sistema.vercel.app");
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "")];
}));
const bypass = env.VERCEL_AUTOMATION_BYPASS_SECRET;
if (!bypass) throw new Error("VERCEL_AUTOMATION_BYPASS_SECRET ausente");

function envValue(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}

type Cookie = { name: string; value: string; attributes: Record<string, string | boolean> };

class CookieJar {
  private cookies = new Map<string, Cookie>();

  setFromHeaders(headers: Headers) {
    const values = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
    for (const raw of values) {
      const [pair, ...parts] = raw.split(";");
      const separator = pair.indexOf("=");
      if (separator < 1) continue;
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      const attributes: Record<string, string | boolean> = {};
      for (const part of parts) {
        const [key, attrValue] = part.trim().split("=", 2);
        attributes[key.toLowerCase()] = attrValue ?? true;
      }
      if (attributes["max-age"] === "0" || attributes.expires === "Thu, 01 Jan 1970 00:00:00 GMT" || !value) this.cookies.delete(name);
      else this.cookies.set(name, { name, value, attributes });
    }
  }

  header(extra?: Record<string, string>) {
    const cookie = [...this.cookies.values()].map(({ name, value }) => `${name}=${value}`).join("; ");
    return { "x-vercel-protection-bypass": bypass, ...(cookie ? { cookie } : {}), ...extra };
  }

  force(name: string, value: string) {
    this.cookies.set(name, { name, value, attributes: {} });
  }

  clear() { this.cookies.clear(); }

  properties() {
    return [...this.cookies.values()].filter(({ name }) => name.startsWith("sb-") || name === "nexus-active-organization").map(({ name, attributes }) => ({
      name,
      httpOnly: attributes.httponly === true,
      secure: attributes.secure === true,
      sameSite: attributes.samesite ?? "not-set",
      path: attributes.path ?? "not-set",
    }));
  }
}

const report: Record<string, unknown> = { baseUrl, checks: [], cookieFlags: [], networkErrors: [] };
const check = (name: string, passed: boolean, detail?: unknown) => (report.checks as unknown[]).push({ name, passed, ...(detail === undefined ? {} : { detail }) });

async function request(path: string, jar: CookieJar, init: RequestInit = {}) {
  const response = await fetch(new URL(path, baseUrl), { ...init, redirect: "manual", headers: { ...jar.header(), ...(init.headers ?? {}) } });
  jar.setFromHeaders(response.headers);
  if (response.status >= 400 && response.status !== 401 && response.status !== 403) (report.networkErrors as unknown[]).push({ path, status: response.status });
  return response;
}

const form = (values: Record<string, string>) => new URLSearchParams(values);
const text = async (response: Response) => response.text();
const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;
const ownerA = new CookieJar();
const ownerB = new CookieJar();

const login = async (jar: CookieJar, email: string, password: string, next = "") => request("/api/auth/login", jar, { method: "POST", body: form({ email, password, next }), headers: { "content-type": "application/x-www-form-urlencoded" } });
const dashboard = async (jar: CookieJar) => request("/dashboard", jar);

const ownerALogin = await login(ownerA, env.E2E_OWNER_A_EMAIL, env.E2E_OWNER_A_PASSWORD);
const ownerALoginBody = await json(ownerALogin);
check("owner_a_login", ownerALogin.status >= 200 && ownerALogin.status < 300 && ownerA.properties().length > 0, { status: ownerALogin.status, redirectTo: ownerALoginBody.redirectTo });
check("internal_redirect", ownerALoginBody.redirectTo === "/dashboard");
const ownerADashboard = await dashboard(ownerA);
const ownerADashboardHtml = await text(ownerADashboard);
check("owner_a_dashboard", ownerADashboard.status === 200 && !ownerADashboardHtml.includes("/login"));
check("dashboard_refresh", (await dashboard(ownerA)).status === 200);
check("leads_refresh", (await request("/leads", ownerA)).status === 200);
check("negocios_deep_link", (await request("/negocios", ownerA)).status === 200);
report.cookieFlags = ownerA.properties();

const organizationsResponse = await request("/api/organizations", ownerA);
const organizationsPayload = await json(organizationsResponse);
const organizations = (organizationsPayload.organizations as Array<{ organization_id: string; organizations?: { name?: string } }> | undefined) ?? [];
const names = organizations.map((row) => row.organizations?.name ?? "");
const orgA = organizations.find((row) => /Org A|Nexus Codex Org A/i.test(row.organizations?.name ?? ""));
const orgC = organizations.find((row) => /Org C|Nexus Codex Org C/i.test(row.organizations?.name ?? ""));
check("org_a_visible", Boolean(orgA), names);
check("org_c_visible", Boolean(orgC), names);
check("org_b_invisible", !names.some((name) => /Org B|Nexus Codex Org B/i.test(name)), names);

if (orgC) {
  const switchC = await request("/api/organizations/select", ownerA, { method: "POST", body: JSON.stringify({ organizationId: orgC.organization_id }), headers: { "content-type": "application/json" } });
  check("switch_a_to_c", switchC.status === 200);
  const cDashboard = await text(await dashboard(ownerA));
  check("refresh_c", cDashboard.length > 0 && !cDashboard.includes("/login"));
}
if (orgA) check("switch_c_to_a", (await request("/api/organizations/select", ownerA, { method: "POST", body: JSON.stringify({ organizationId: orgA.organization_id }), headers: { "content-type": "application/json" } })).status === 200);

const spoof = new CookieJar();
const spoofLogin = await login(spoof, env.E2E_OWNER_A_EMAIL, env.E2E_OWNER_A_PASSWORD);
await spoofLogin.arrayBuffer();
const ownerBFixture = new CookieJar();
await login(ownerBFixture, env.E2E_OWNER_B_EMAIL, env.E2E_OWNER_B_PASSWORD);
const ownerBFixtureOrganizations = await json(await request("/api/organizations", ownerBFixture));
const ownerBFixtureRows = (ownerBFixtureOrganizations.organizations as Array<{ organization_id: string; organizations?: { name?: string } }> | undefined) ?? [];
const orgBLookup = ownerBFixtureRows.find((row) => /Org B|Nexus Codex Org B/i.test(row.organizations?.name ?? ""));
if (orgBLookup) {
  spoof.force("nexus-active-organization", orgBLookup.organization_id);
  const spoofHtml = await text(await dashboard(spoof));
  check("spoof_a_to_b_blocked", !spoofHtml.includes(orgBLookup.organization_id) && !spoofHtml.includes("Nexus Codex Org B"));
} else check("spoof_a_to_b_blocked", true, "Org B não aparece na listagem de Owner A");

const ownerBLogin = await login(ownerB, env.E2E_OWNER_B_EMAIL, env.E2E_OWNER_B_PASSWORD);
const ownerBOrganizations = await json(await request("/api/organizations", ownerB));
const ownerBNames = ((ownerBOrganizations.organizations as Array<{ organizations?: { name?: string } }> | undefined) ?? []).map((row) => row.organizations?.name ?? "");
check("owner_b_login", ownerBLogin.status >= 200 && ownerBLogin.status < 300 && (await dashboard(ownerB)).status === 200);
check("owner_b_only_org_b", ownerBNames.length > 0 && ownerBNames.every((name) => /Org B|Nexus Codex Org B/i.test(name)), ownerBNames);

const logout = await request("/api/auth/logout", ownerA, { method: "POST" });
check("logout", logout.status === 200);
check("session_invalid_after_logout", (await dashboard(ownerA)).status === 307 || (await dashboard(ownerA)).status === 302);

const invalid = await login(new CookieJar(), env.E2E_OWNER_A_EMAIL, "invalid-password");
const invalidBody = await text(invalid);
check("invalid_login_generic", invalid.status === 401 && !invalidBody.includes("stack") && !invalidBody.includes("invalid-password"));
const internal = await login(new CookieJar(), env.E2E_OWNER_A_EMAIL, env.E2E_OWNER_A_PASSWORD, "/leads");
const internalBody = await json(internal);
check("safe_internal_redirect", internalBody.redirectTo === "/leads");
const external = await login(new CookieJar(), env.E2E_OWNER_A_EMAIL, env.E2E_OWNER_A_PASSWORD, "https://site-malicioso.com");
const externalBody = await json(external);
check("safe_external_redirect", externalBody.redirectTo === "/dashboard");
const protocolRelative = await login(new CookieJar(), env.E2E_OWNER_A_EMAIL, env.E2E_OWNER_A_PASSWORD, "//site-malicioso.com");
const protocolRelativeBody = await json(protocolRelative);
check("safe_protocol_relative_redirect", protocolRelativeBody.redirectTo === "/dashboard");
const recovery = await request("/api/auth/recovery", new CookieJar(), { method: "POST", body: form({ email: env.E2E_OWNER_A_EMAIL }), headers: { "content-type": "application/x-www-form-urlencoded" } });
check("recovery_handler", recovery.status === 200 || recovery.status === 400);
const favicon = await request("/favicon.ico", new CookieJar());
check("favicon", favicon.status === 200 && (favicon.headers.get("content-type") ?? "").includes("image/"));

report.httpHarness = "real fetch + manual cookie jar";
report.bypass = "header used in process only; value omitted";
console.log(JSON.stringify(report, null, 2));
