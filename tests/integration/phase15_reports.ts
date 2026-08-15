import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { getReports } from "../../src/lib/crm/reports/metrics";
import type { Database } from "../../src/types/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.E2E_OWNER_A_EMAIL;
const password = process.env.E2E_OWNER_A_PASSWORD;
if (!url || !key || !email || !password) throw new Error("Supabase/E2E environment is incomplete");

const client = createClient<Database>(url, key);
const { data: auth, error: authError } = await client.auth.signInWithPassword({ email, password });
if (authError || !auth.user) throw authError || new Error("Owner login failed");
const { data: memberships, error: membershipsError } = await client.from("organization_members").select("organization_id").eq("user_id", auth.user.id).eq("status", "active");
if (membershipsError || !memberships?.[0]) throw membershipsError || new Error("Owner has no active organization");

const report = await getReports(client, memberships[0].organization_id, { period: "este_mes" });
if (!Array.isArray(report.funnel) || !Array.isArray(report.filters.pipelines)) throw new Error("Report shape is invalid");
if ([report.kpis.revenue, report.kpis.openPipeline, report.kpis.forecast, report.closed.winRate].some((value) => !Number.isFinite(value))) throw new Error("Report contains a non-finite metric");
console.log(JSON.stringify({ reports: "ok", empty: report.empty, funnelStages: report.funnel.length, pipelineFilters: report.filters.pipelines.length, leadCount: report.leads.created, taskCount: report.tasks.created, activityCount: report.activities.total }));

