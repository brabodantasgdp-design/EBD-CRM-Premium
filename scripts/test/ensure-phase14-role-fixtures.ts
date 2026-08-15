import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

type AuthUser = { id: string; email?: string | null };
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerEmail = process.env.E2E_OWNER_A_EMAIL;
const viewerEmail = process.env.E2E_VIEWER_A_EMAIL;
const viewerPassword = process.env.E2E_VIEWER_A_PASSWORD;
const suspendedEmail = process.env.E2E_SUSPENDED_A_EMAIL;
const suspendedPassword = process.env.E2E_SUSPENDED_A_PASSWORD;
if (!url || !serviceRole || !ownerEmail || !viewerEmail || !viewerPassword || !suspendedEmail || !suspendedPassword) throw new Error("Role fixture environment is incomplete");
if (!/^qa[-+]/i.test(viewerEmail) || !/^qa[-+]/i.test(suspendedEmail)) throw new Error("Role fixture emails must use the QA marker");

const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listed.error) throw listed.error;
const users = listed.data.users as unknown as AuthUser[];
const owner = users.find((user) => user.email?.toLowerCase() === ownerEmail.toLowerCase());
if (!owner) throw new Error("Owner fixture not found");
const ownerMembership = await admin.from("organization_members").select("organization_id").eq("user_id", owner.id).eq("role", "owner").limit(1).single();
if (ownerMembership.error || !ownerMembership.data) throw ownerMembership.error || new Error("Owner organization not found");

async function ensureUser(email: string, password: string) {
  const existing = users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    const updated = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    if (updated.error) throw updated.error;
    return existing.id;
  }
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw created.error || new Error("Role fixture creation failed");
  return created.data.user.id;
}

const viewerId = await ensureUser(viewerEmail, viewerPassword);
const suspendedId = await ensureUser(suspendedEmail, suspendedPassword);
const organizationId = ownerMembership.data.organization_id;
const viewerMembership = await admin.from("organization_members").upsert({ organization_id: organizationId, user_id: viewerId, role: "viewer", status: "active" }, { onConflict: "organization_id,user_id" });
if (viewerMembership.error) throw viewerMembership.error;
const suspendedMembership = await admin.from("organization_members").upsert({ organization_id: organizationId, user_id: suspendedId, role: "sales", status: "suspended" }, { onConflict: "organization_id,user_id" });
if (suspendedMembership.error) throw suspendedMembership.error;
console.log("phase14 role fixtures ready");
