import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerEmail = process.env.E2E_OWNER_A_EMAIL;
if (!url || !serviceRoleKey || !ownerEmail) throw new Error("Fixture environment is incomplete");

const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const users = await admin.auth.admin.listUsers({ perPage: 1000 });
if (users.error) throw users.error;
const owner = (users.data.users as Array<{ id: string; email?: string }>).find((user) => user.email?.toLowerCase() === ownerEmail.toLowerCase());
if (!owner) throw new Error("Owner A fixture user was not found");

const existing = await admin.from("organizations").select("id").eq("name", "Nexus Codex Org C").maybeSingle();
if (existing.error) throw existing.error;
let organizationId = existing.data?.id;
if (!organizationId) {
  const created = await admin.from("organizations").insert({ name: "Nexus Codex Org C", slug: "nexus-codex-org-c", status: "active", created_by: owner.id }).select("id").single();
  if (created.error) throw created.error;
  organizationId = created.data.id;
}
const membership = await admin.from("organization_members").upsert({ organization_id: organizationId, user_id: owner.id, role: "owner", status: "active" }, { onConflict: "organization_id,user_id" });
if (membership.error) throw membership.error;
console.log("Multi-organization fixture ready");
