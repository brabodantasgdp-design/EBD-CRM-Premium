import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getDashboardMetrics } from "../../src/lib/crm/dashboard/metrics";
import type { Database } from "../../src/types/database.types";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.E2E_OWNER_A_EMAIL;
const password = process.env.E2E_OWNER_A_PASSWORD;
if (!url || !key || !email || !password) throw new Error("Supabase/E2E environment is incomplete");

const client = createClient<Database>(url, key);
const { data: auth, error: authError } = await client.auth.signInWithPassword({ email, password });
if (authError || !auth.user) throw authError || new Error("Owner login failed");
const { data: memberships, error: membershipError } = await client.from("organization_members").select("organization_id").eq("user_id", auth.user.id).eq("status", "active");
if (membershipError || !memberships?.[0]) throw membershipError || new Error("No active organization");

const organizationId = memberships[0].organization_id;
const snapshot = await getDashboardMetrics(client, organizationId, "este_mes");
const { data: deals, error: dealsError } = await client.from("deals").select("value, probability, status").eq("organization_id", organizationId).is("archived_at", null);
if (dealsError) throw dealsError;
const open = (deals ?? []).filter((deal) => deal.status === "open");
const won = (deals ?? []).filter((deal) => deal.status === "won");
const expectedOpen = open.reduce((sum, deal) => sum + Number(deal.value), 0);
const expectedForecast = open.reduce((sum, deal) => sum + Number(deal.value) * Number(deal.probability) / 100, 0);
const expectedWon = won.length;
const closeEnough = (a: number, b: number) => Math.abs(a - b) < 0.01;
if (!closeEnough(snapshot.openPipeline, expectedOpen)) throw new Error(`Open pipeline mismatch: ${snapshot.openPipeline} != ${expectedOpen}`);
if (!closeEnough(snapshot.forecast, expectedForecast)) throw new Error(`Forecast mismatch: ${snapshot.forecast} != ${expectedForecast}`);
if (snapshot.wonDeals !== expectedWon) throw new Error(`Won deals mismatch: ${snapshot.wonDeals} != ${expectedWon}`);
console.log(JSON.stringify({ organizationId, openPipeline: snapshot.openPipeline, forecast: snapshot.forecast, wonDeals: snapshot.wonDeals, pendingTasks: snapshot.pendingTasks, todayActivities: snapshot.todayActivities }));
