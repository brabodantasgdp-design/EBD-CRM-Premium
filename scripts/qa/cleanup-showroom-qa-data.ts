import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";

const SHOWROOM_ORGANIZATION_ID = "a0598da6-1ea4-4d94-89c5-d2b476258a03";
const args = new Set(process.argv.slice(2));
const valueFor = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
};
const organizationId = valueFor("organization-id");
const execute = args.has("--execute");

if (!organizationId) throw new Error("--organization-id is required");
if (organizationId !== SHOWROOM_ORGANIZATION_ID) throw new Error("organization is not the approved showroom target");
if (execute && !args.has("--confirm-showroom-qa-cleanup")) {
  throw new Error("execution requires --confirm-showroom-qa-cleanup");
}

const env = Object.fromEntries((await readFile(".env.local", "utf8")).split(/\r?\n/).filter((line) => line.includes("=")).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).trim().replace(/^"|"$/g, "")];
}));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) throw new Error("server-only Supabase environment is incomplete");

const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
const tables = ["leads", "contacts", "companies", "deals", "tasks", "activities", "products", "proposals", "automations", "follow_ups"] as const;
type Table = (typeof tables)[number];
type Row = Record<string, unknown> & { id: string; organization_id: string; archived_at?: string | null };
type Candidate = { table: Table; row: Row; marker: string; matchedTestScript: string; confidence: "CONFIRMED" | "SUSPECT" | "LEGITIMATE" };

const markerRules: Array<[RegExp, string]> = [
  [/phase\d/i, "phase harness marker"],
  [/ui\s*smoke/i, "deals UI smoke harness"],
  [/bulk/i, "bulk harness"],
  [/codex/i, "Codex harness"],
  [/e2e/i, "E2E harness"],
  [/qa\s*hotfix/i, "hotfix QA harness"],
  [/unique\s*fact/i, "Copilot unique-fact fixture"],
  [/prompt\s*injection|injection/i, "Copilot injection fixture"],
];

const displayText = (table: Table, row: Row) => {
  const fields = table === "contacts" ? ["full_name", "first_name", "last_name", "email"]
    : table === "proposals" ? ["title", "number"]
      : table === "follow_ups" ? ["title", "type", "source"]
        : ["name", "title", "description", "email"];
  return fields.map((field) => String(row[field] ?? "")).filter(Boolean).join(" | ");
};

const matchedRule = (table: Table, row: Row) => {
  const text = displayText(table, row);
  if (table === "leads" && text.trim().toLowerCase() === "dasda") return null;
  if (table === "contacts" && text.includes("Online Contact073")) return null;
  for (const [rule, name] of markerRules) if (rule.test(text)) return { marker: text.slice(0, 180), matchedTestScript: name };
  return null;
};

const candidates: Candidate[] = [];
for (const table of tables) {
  const response = await admin.from(table).select("*").eq("organization_id", organizationId);
  if (response.error) throw new Error(`${table} audit failed: ${response.error.message}`);
  for (const row of (response.data ?? []) as Row[]) {
    const match = matchedRule(table, row);
    candidates.push({
      table,
      row,
      marker: match?.marker ?? displayText(table, row).slice(0, 180),
      matchedTestScript: match?.matchedTestScript ?? "none established",
      confidence: match ? "CONFIRMED" : "SUSPECT",
    });
  }
}

const confirmed = candidates.filter((candidate) => candidate.confidence === "CONFIRMED");
const activeConfirmed = confirmed.filter((candidate) => !candidate.row.archived_at);
const counts = Object.fromEntries(tables.map((table) => [table, activeConfirmed.filter((candidate) => candidate.table === table).length]));
const report = {
  generatedAt: new Date().toISOString(),
  organizationId,
  dryRun: !execute,
  confirmedCount: activeConfirmed.length,
  counts,
  records: candidates.map((candidate) => ({
    TABLE: candidate.table,
    ID: candidate.row.id,
    NAME_OR_TITLE: displayText(candidate.table, candidate.row).slice(0, 240),
    ORGANIZATION_ID: candidate.row.organization_id,
    CREATED_AT: candidate.row.created_at ?? null,
    ARCHIVED_AT: candidate.row.archived_at ?? null,
    MARKER: candidate.marker,
    MATCHED_TEST_SCRIPT: candidate.matchedTestScript,
    CONFIDENCE: candidate.confidence,
  })),
};
const backupPath = join(tmpdir(), `nexuscrm-showroom-qa-inventory-${Date.now()}-${randomUUID()}.json`);
await writeFile(backupPath, JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify({ mode: execute ? "execute" : "dry-run", organizationId, confirmedCount: activeConfirmed.length, counts, backupPath }));

if (!execute) process.exit(0);

const byTable = (table: Table) => activeConfirmed.filter((candidate) => candidate.table === table).map((candidate) => candidate.row.id);
const archive = async (table: Table) => {
  const ids = byTable(table);
  if (ids.length === 0) return 0;
  const result = await admin.from(table).update({ archived_at: new Date().toISOString() }).in("id", ids).eq("organization_id", organizationId).is("archived_at", null);
  if (result.error) throw new Error(`${table} cleanup failed: ${result.error.message}`);
  return ids.length;
};

// Child rows without archive support are removed only when their confirmed parent is being cleaned.
const proposalIds = byTable("proposals");
if (proposalIds.length) {
  const result = await admin.from("proposal_items").delete().eq("organization_id", organizationId).in("proposal_id", proposalIds);
  if (result.error) throw new Error(`proposal_items cleanup failed: ${result.error.message}`);
}
const automationIds = byTable("automations");
if (automationIds.length) {
  const result = await admin.from("automation_runs").delete().eq("organization_id", organizationId).in("automation_id", automationIds);
  if (result.error) throw new Error(`automation_runs cleanup failed: ${result.error.message}`);
}

const order: Table[] = ["tasks", "activities", "follow_ups", "proposals", "deals", "leads", "contacts", "companies", "products", "automations"];
const changed = Object.fromEntries(order.map((table) => [table, 0]));
for (const table of order) changed[table] = await archive(table);
console.log(JSON.stringify({ mode: "execute", organizationId, changed, idempotent: true }));
