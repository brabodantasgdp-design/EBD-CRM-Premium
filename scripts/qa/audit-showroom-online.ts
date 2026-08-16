import { readFile } from "node:fs/promises";

const baseUrl = (process.argv.find((value) => value.startsWith("--base-url="))?.split("=", 2)[1] ?? "").replace(/\/$/, "");
if (!baseUrl) throw new Error("--base-url is required");
const env = Object.fromEntries((await readFile(".env.local", "utf8")).split(/\r?\n/).filter((line) => line.includes("=")).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).trim().replace(/^"|"$/g, "")];
}));
const bypass = env.VERCEL_AUTOMATION_BYPASS_SECRET;
if (!env.E2E_OWNER_A_EMAIL || !env.E2E_OWNER_A_PASSWORD || !bypass) throw new Error("online audit environment is incomplete");
const common = { "x-vercel-protection-bypass": bypass };
const login = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { ...common, "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ email: env.E2E_OWNER_A_EMAIL, password: env.E2E_OWNER_A_PASSWORD, next: "/dashboard" }) });
if (!login.ok) throw new Error(`login failed with status ${login.status}`);
const cookie = login.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
const getJson = async (path: string) => {
  const response = await fetch(`${baseUrl}${path}`, { headers: { ...common, cookie, "cache-control": "no-store" } });
  if (!response.ok) throw new Error(`${path} failed with status ${response.status}`);
  return response.json();
};
const dashboard = await getJson("/api/dashboard/metrics?period=este_mes");
const reports = await getJson("/api/reports?period=este_mes");
console.log(JSON.stringify({ baseUrl, dashboard: dashboard.metrics ?? dashboard, reports: reports.metrics ?? reports }));
