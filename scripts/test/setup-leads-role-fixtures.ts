import { createClient } from "@supabase/supabase-js";

type AuthUser = { id: string; email?: string };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const viewerEmail = process.env.E2E_VIEWER_A_EMAIL;
const viewerPassword = process.env.E2E_VIEWER_A_PASSWORD;
const suspendedEmail = process.env.E2E_SUSPENDED_A_EMAIL;
const suspendedPassword = process.env.E2E_SUSPENDED_A_PASSWORD;
if (!url || !serviceRole || !viewerEmail || !viewerPassword || !suspendedEmail || !suspendedPassword) throw new Error("Role fixture environment is incomplete");
const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
const ownerEmail = process.env.E2E_OWNER_A_EMAIL;
if (!ownerEmail) throw new Error("Owner fixture is incomplete");
const users = (await admin.auth.admin.listUsers({ perPage: 1000 })).data.users as unknown as AuthUser[];
const findOrCreate = async (email: string, password: string) => {
  const existing = users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
  if (existing) { const updated = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true }); if (updated.error) throw updated.error; return existing.id; }
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw created.error || new Error("fixture user creation failed");
  return created.data.user.id;
};
const owner = users.find((item) => item.email?.toLowerCase() === ownerEmail.toLowerCase());
if (!owner) throw new Error("Owner user not found");
const org = (await admin.from("organization_members").select("organization_id").eq("user_id", owner.id).eq("role", "owner").limit(1).single()).data;
if (!org) throw new Error("Owner organization not found");
const viewerId = await findOrCreate(viewerEmail, viewerPassword);
const suspendedId = await findOrCreate(suspendedEmail, suspendedPassword);
const viewerMembership = await admin.from("organization_members").upsert({ organization_id: org.organization_id, user_id: viewerId, role: "viewer", status: "active" }, { onConflict: "organization_id,user_id" });
if (viewerMembership.error) throw viewerMembership.error;
const suspendedMembership = await admin.from("organization_members").upsert({ organization_id: org.organization_id, user_id: suspendedId, role: "sales", status: "suspended" }, { onConflict: "organization_id,user_id" });
if (suspendedMembership.error) throw suspendedMembership.error;
console.log("Lead role fixtures ready: viewer=active, suspended=suspended");
