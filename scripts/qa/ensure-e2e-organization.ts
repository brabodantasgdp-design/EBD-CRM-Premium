import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const env = Object.fromEntries((await readFile(".env.local", "utf8")).split(/\r?\n/).filter((line) => line.includes("=")).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).trim().replace(/^"|"$/g, "")];
}));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
const ownerEmail = env.E2E_OWNER_A_EMAIL;
if (!url || !serviceRole || !ownerEmail) throw new Error("server-only E2E environment is incomplete");

const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
const users = ((await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })).data.users ?? []) as Array<{ id: string; email?: string }>;
const owner = users.find((user) => user.email?.toLowerCase() === ownerEmail.toLowerCase());
if (!owner) throw new Error("E2E owner fixture not found");

const slug = "nexus-e2e-qa-organization";
let organization = (await admin.from("organizations").select("id,name,slug").eq("slug", slug).maybeSingle()).data;
if (!organization) {
  organization = (await admin.from("organizations").insert({ name: "Nexus E2E QA Organization", slug, created_by: owner.id }).select("id,name,slug").single()).data;
}
if (!organization?.id) throw new Error("could not create or find E2E organization");
const membership = await admin.from("organization_members").upsert({ organization_id: organization.id, user_id: owner.id, role: "owner", status: "active" }, { onConflict: "organization_id,user_id" });
if (membership.error) throw membership.error;
console.log(JSON.stringify({ organizationId: organization.id, name: organization.name, slug: organization.slug, ownerMembership: "active" }));
