import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fixtures = [
  [process.env.E2E_OWNER_A_EMAIL, process.env.E2E_OWNER_A_PASSWORD],
  [process.env.E2E_OWNER_B_EMAIL, process.env.E2E_OWNER_B_PASSWORD],
  [process.env.E2E_SALES_A_EMAIL, process.env.E2E_SALES_A_PASSWORD],
] as const;

if (!url || !serviceRoleKey || fixtures.some(([email, password]) => !email || !password)) {
  throw new Error("Supabase fixture environment is incomplete");
}

const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const users = await admin.auth.admin.listUsers({ perPage: 1000 });
if (users.error) throw users.error;
const existingUsers = users.data.users as Array<{ id: string; email?: string }>;

for (const [email, password] of fixtures) {
  const existing = existingUsers.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    const updated = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    if (updated.error) throw updated.error;
    continue;
  }
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
}

console.log(`Fixture users ready: ${fixtures.length}`);
