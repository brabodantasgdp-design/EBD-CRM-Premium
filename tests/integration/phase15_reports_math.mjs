import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { getReports } from "../../src/lib/crm/reports/metrics.ts";

const envText = await fs.readFile(".env.local", "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line.includes("=")).map((line) => { const index = line.indexOf("="); return [line.slice(0, index), line.slice(index + 1).trim().replace(/^"|"$/g, "")]; }));
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || !env.E2E_OWNER_A_EMAIL || !env.E2E_OWNER_A_PASSWORD) throw new Error("Supabase/E2E environment is incomplete");
const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const { data: auth, error: authError } = await client.auth.signInWithPassword({ email: env.E2E_OWNER_A_EMAIL, password: env.E2E_OWNER_A_PASSWORD });
if (authError || !auth.user) throw authError || new Error("Owner login failed");
const { data: memberships } = await client.from("organization_members").select("organization_id").eq("user_id", auth.user.id).eq("status", "active");
if (!memberships?.[0]) throw new Error("Owner has no active organization");
const organizationId = memberships[0].organization_id;
const todayDate = new Date();
const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;
const start = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-01`;
const inRange = (value) => Boolean(value && value.slice(0, 10) >= start && value.slice(0, 10) <= today);
const [{ data: deals }, { data: stages }, { data: leads }, { data: proposals }, { data: tasks }, { data: activities }] = await Promise.all([
  client.from("deals").select("id,value,probability,status,stage_id,created_at,won_at,lost_at").eq("organization_id", organizationId).is("archived_at", null),
  client.from("pipeline_stages").select("id,name,color,position").eq("organization_id", organizationId).is("archived_at", null).order("position"),
  client.from("leads").select("status,created_at,converted_at").eq("organization_id", organizationId).is("archived_at", null),
  client.from("proposals").select("status,total,created_at").eq("organization_id", organizationId).is("archived_at", null),
  client.from("tasks").select("status,due_date,created_at").eq("organization_id", organizationId).is("archived_at", null),
  client.from("activities").select("status,start_at,created_at").eq("organization_id", organizationId).is("archived_at", null),
]);
const allDeals = deals ?? [];
const open = allDeals.filter((deal) => deal.status === "open");
const won = allDeals.filter((deal) => deal.status === "won" && inRange(deal.won_at ?? deal.created_at));
const lost = allDeals.filter((deal) => deal.status === "lost" && inRange(deal.lost_at ?? deal.created_at));
const periodLeads = (leads ?? []).filter((lead) => inRange(lead.created_at));
const periodProposals = (proposals ?? []).filter((item) => inRange(item.created_at));
const periodTasks = (tasks ?? []).filter((item) => inRange(item.created_at));
const periodActivities = (activities ?? []).filter((item) => inRange(item.start_at ?? item.created_at));
const expected = {
  funnel: (stages ?? []).map((stage) => { const rows = open.filter((deal) => deal.stage_id === stage.id); return { deals: rows.length, value: rows.reduce((sum, deal) => sum + Number(deal.value), 0) }; }),
  won: won.length, lost: lost.length, winRate: won.length + lost.length ? won.length / (won.length + lost.length) * 100 : 0,
  revenue: won.reduce((sum, deal) => sum + Number(deal.value), 0), forecast: open.reduce((sum, deal) => sum + Number(deal.value) * Number(deal.probability) / 100, 0), averageTicket: won.length ? won.reduce((sum, deal) => sum + Number(deal.value), 0) / won.length : 0,
  leadsCreated: periodLeads.length, leadsConverted: periodLeads.filter((lead) => inRange(lead.converted_at)).length, leadsActive: (leads ?? []).filter((lead) => !["converted", "lost"].includes(lead.status)).length,
  proposals: periodProposals.length, tasks: periodTasks.length, activities: periodActivities.length,
};
const actual = await getReports(client, organizationId, { period: "este_mes" });
const actualSafe = { funnel: actual.funnel.map((stage) => ({ deals: stage.deals, value: stage.value })), won: actual.closed.won, lost: actual.closed.lost, winRate: actual.closed.winRate, revenue: actual.kpis.revenue, forecast: actual.kpis.forecast, averageTicket: actual.kpis.averageTicket, leadsCreated: actual.leads.created, leadsConverted: actual.leads.converted, leadsActive: actual.leads.active, proposals: actual.proposals.total, tasks: actual.tasks.created, activities: actual.activities.total };
const close = (a, b) => Math.abs(a - b) < 0.01;
const same = Object.keys(expected).every((key) => Array.isArray(expected[key]) ? expected[key].length === actualSafe[key].length && expected[key].every((row, index) => row.deals === actualSafe[key][index].deals && close(row.value, actualSafe[key][index].value)) : typeof expected[key] === "number" && close(expected[key], actualSafe[key]));
if (!same) throw new Error(JSON.stringify({ expected, actual: actualSafe }));
console.log(JSON.stringify({ math: "pass", expected, actual: actualSafe }));

