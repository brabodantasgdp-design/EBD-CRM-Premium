import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const organizationId = process.argv.find((value) => value.startsWith("--organization-id="))?.split("=", 2)[1];
if (!organizationId) throw new Error("--organization-id is required");
const env = Object.fromEntries((await readFile(".env.local", "utf8")).split(/\r?\n/).filter((line) => line.includes("=")).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).trim().replace(/^"|"$/g, "")];
}));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) throw new Error("server-only Supabase environment is incomplete");
const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
const tables = ["leads", "contacts", "companies", "deals", "tasks", "activities", "products", "proposals", "automations", "follow_ups", "pipelines", "pipeline_stages"];
const result: Record<string, unknown> = { organizationId, active: {}, archived: {} };
for (const table of tables) {
  const active = await admin.from(table).select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("archived_at", null);
  const archived = await admin.from(table).select("id", { count: "exact", head: true }).eq("organization_id", organizationId).not("archived_at", "is", null);
  if (active.error) throw new Error(`${table} active audit failed: ${active.error.message}`);
  if (archived.error) throw new Error(`${table} archived audit failed: ${archived.error.message}`);
  (result.active as Record<string, unknown>)[table] = active.count ?? 0;
  (result.archived as Record<string, unknown>)[table] = archived.count ?? 0;
}
console.log(JSON.stringify(result));
