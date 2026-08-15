import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { runCopilot } from "../../src/lib/ai/copilot";
import type { AIProvider } from "../../src/lib/ai/provider";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.E2E_OWNER_A_EMAIL;
const password = process.env.E2E_OWNER_A_PASSWORD;
if (!url || !key || !email || !password) throw new Error("E2E environment is incomplete");
const client = createClient(url, key);
const auth = await client.auth.signInWithPassword({ email, password });
if (auth.error || !auth.data.user) throw auth.error || new Error("Owner login failed");
const membership = await client.from("organization_members").select("organization_id").eq("user_id", auth.data.user.id).eq("status", "active").limit(1).single();
if (membership.error || !membership.data) throw membership.error || new Error("Active organization not found");
const deal = await client.from("deals").select("id").eq("organization_id", membership.data.organization_id).is("archived_at", null).limit(1).single();
if (deal.error || !deal.data) throw deal.error || new Error("Deal fixture not found");
const windowStart = new Date(Date.now() - 60000).toISOString();
const before = await client.from("ai_usage_logs").select("id", { count: "exact", head: true }).eq("organization_id", membership.data.organization_id).eq("user_id", auth.data.user.id).eq("status", "failed").gte("created_at", windowStart);
const timeoutProvider: AIProvider = { name: "groq", model: "timeout-test", generateText: async () => { throw new Error("ai_provider_timeout"); } };
let propagated = false;
try { await runCopilot(client, auth.data.user.id, membership.data.organization_id, { feature: "chat", question: "Teste controlado de timeout.", entityType: "deal", entityId: deal.data.id }, timeoutProvider); } catch (error) { propagated = error instanceof Error && error.message === "ai_provider_timeout"; }
const after = await client.from("ai_usage_logs").select("id, status", { count: "exact" }).eq("organization_id", membership.data.organization_id).eq("user_id", auth.data.user.id).gte("created_at", windowStart).eq("status", "failed");
console.log(JSON.stringify({ providerInjected: true, timeoutPropagated: propagated, usageCountIncreased: (after.count || 0) > (before.count || 0), failedUsagePresent: Boolean(after.data?.some((row) => row.status === "failed")) }));
