import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerEmail = process.env.E2E_OWNER_A_EMAIL;
const salesEmail = process.env.E2E_SALES_A_EMAIL;
if (!url || !serviceRoleKey || !ownerEmail || !salesEmail) throw new Error("Fixture environment is incomplete");

const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const users = await admin.auth.admin.listUsers({ perPage: 1000 });
if (users.error) throw users.error;
const existingUsers = users.data.users as Array<{ id: string; email?: string }>;
const owner = existingUsers.find((user) => user.email?.toLowerCase() === ownerEmail.toLowerCase());
const sales = existingUsers.find((user) => user.email?.toLowerCase() === salesEmail.toLowerCase());
if (!owner || !sales) throw new Error("Fixture users were not found");

const organizations = await admin.from("organizations").select("id").eq("created_by", owner.id).limit(1);
if (organizations.error) throw organizations.error;
const organization = organizations.data[0];
if (!organization) throw new Error("Owner A organization was not found");

const result = await admin.from("organization_members").upsert({ organization_id: organization.id, user_id: sales.id, role: "sales", status: "active" }, { onConflict: "organization_id,user_id" });
if (result.error) throw result.error;
console.log("Sales fixture membership ready");
