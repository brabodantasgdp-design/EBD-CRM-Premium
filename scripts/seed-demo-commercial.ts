import { createClient } from "@supabase/supabase-js";

/**
 * Manual development seed only. Never import this file from the application.
 * Run with DEMO_ORGANIZATION_ID and SUPABASE_SERVICE_ROLE_KEY in a server-only shell.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const organizationId = process.env.DEMO_ORGANIZATION_ID;

if (!url || !serviceRole || !organizationId) {
  throw new Error("DEMO_ORGANIZATION_ID, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const admin = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
const organization = await admin.from("organizations").select("id, created_by").eq("id", organizationId).single();
if (organization.error || !organization.data?.created_by) throw new Error("Demo organization not found");

const existing = await admin.from("companies").select("id").eq("organization_id", organizationId).eq("name", "Lumina Tech Demo").maybeSingle();
if (!existing.data) {
  const company = await admin.from("companies").insert({
    organization_id: organizationId,
    created_by: organization.data.created_by,
    name: "Lumina Tech Demo",
    legal_name: "Lumina Tecnologia Ltda.",
    domain: "lumina-demo.example",
    segment: "Tecnologia & SaaS",
    size: "Médio Porte",
    status: "cliente",
    owner_id: organization.data.created_by,
    source: "Demo manual",
    tags: ["Demo"],
  }).select("id").single();
  if (company.error || !company.data) throw company.error ?? new Error("Company seed failed");
  const contact = await admin.from("contacts").insert({
    organization_id: organizationId,
    created_by: organization.data.created_by,
    first_name: "Ana",
    last_name: "Demo",
    full_name: "Ana Demo",
    email: "ana.demo@example.test",
    job_title: "Diretora Comercial",
    company_id: company.data.id,
    owner_id: organization.data.created_by,
    source: "Demo manual",
    tags: ["Demo"],
  });
  if (contact.error) throw contact.error;
  console.log("Manual commercial demo seed created.");
} else {
  console.log("Manual commercial demo seed already exists.");
}
