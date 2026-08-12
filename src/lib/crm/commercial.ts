import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyItem, CompanyStatus, ContactItem, ContactLifecycleStatus } from "../../types/crm";
import type { Database, Json } from "../../types/database.types";

type Client = SupabaseClient<Database>;
type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];

const companyStatuses: CompanyStatus[] = ["prospect", "cliente", "inativo", "ex_cliente"];
const contactStatuses: ContactLifecycleStatus[] = ["active", "inactive", "customer", "former_customer"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asCompanyStatus(value: string): CompanyStatus {
  return companyStatuses.includes(value as CompanyStatus) ? value as CompanyStatus : "prospect";
}

function asContactStatus(value: string): ContactLifecycleStatus {
  return contactStatuses.includes(value as ContactLifecycleStatus) ? value as ContactLifecycleStatus : "active";
}

function asRecord(value: Json | null): Record<string, string> | undefined {
  if (!value || Array.isArray(value) || typeof value !== "object") return undefined;
  return Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === "string")) as Record<string, string>;
}

function mapCompany(row: CompanyRow, ownerName?: string): CompanyItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    legalName: row.legal_name ?? undefined,
    cnpj: row.cnpj ?? undefined,
    domain: row.domain ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    segment: row.segment,
    size: row.size,
    employeeCount: row.employee_count ?? undefined,
    estimatedRevenue: row.estimated_revenue ?? undefined,
    status: asCompanyStatus(row.status),
    ownerId: row.owner_id ?? "",
    ownerName: ownerName || row.owner_id || "Sem responsável",
    source: row.source ?? undefined,
    tags: row.tags ?? [],
    address: asRecord(row.address) as CompanyItem["address"],
    customFields: Array.isArray(row.custom_fields) ? undefined : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapContact(row: ContactRow, ownerName?: string): ContactItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    firstName: row.first_name,
    lastName: row.last_name ?? undefined,
    fullName: row.full_name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    mobilePhone: row.mobile_phone ?? undefined,
    jobTitle: row.job_title ?? undefined,
    companyId: row.company_id ?? undefined,
    ownerId: row.owner_id ?? "",
    ownerName: ownerName || row.owner_id || "Sem responsável",
    lifecycleStatus: asContactStatus(row.lifecycle_status),
    source: row.source ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function normalizeCnpj(value: string | undefined): string | null {
  const normalized = value?.replace(/\D/g, "") ?? "";
  return normalized || null;
}

function normalizeDomain(value: string | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized || null;
}

export async function listCompanies(client: Client, organizationId: string) {
  const { data, error } = await client.from("companies").select("*").eq("organization_id", organizationId).is("archived_at", null).order("created_at", { ascending: false });
  if (error) throw error;
  const ownerIds = [...new Set((data ?? []).map((row) => row.owner_id).filter((id): id is string => Boolean(id)))];
  const owners = ownerIds.length ? await client.from("profiles").select("id, full_name").in("id", ownerIds) : { data: [] };
  const ownerNames = new Map((owners.data ?? []).map((owner) => [owner.id, owner.full_name || undefined]));
  return (data ?? []).map((row) => mapCompany(row, row.owner_id ? ownerNames.get(row.owner_id) : undefined));
}

export async function listContacts(client: Client, organizationId: string) {
  const { data, error } = await client.from("contacts").select("*").eq("organization_id", organizationId).is("archived_at", null).order("created_at", { ascending: false });
  if (error) throw error;
  const ownerIds = [...new Set((data ?? []).map((row) => row.owner_id).filter((id): id is string => Boolean(id)))];
  const owners = ownerIds.length ? await client.from("profiles").select("id, full_name").in("id", ownerIds) : { data: [] };
  const ownerNames = new Map((owners.data ?? []).map((owner) => [owner.id, owner.full_name || undefined]));
  return (data ?? []).map((row) => mapContact(row, row.owner_id ? ownerNames.get(row.owner_id) : undefined));
}

export async function createCompany(client: Client, organizationId: string, userId: string, input: Partial<CompanyItem>) {
  const payload: Database["public"]["Tables"]["companies"]["Insert"] = {
    organization_id: organizationId,
    created_by: userId,
    name: input.name?.trim() || "Nova Empresa",
    legal_name: input.legalName?.trim() || null,
    cnpj: normalizeCnpj(input.cnpj),
    domain: normalizeDomain(input.domain),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    segment: input.segment?.trim() || "Tecnologia & SaaS",
    size: input.size?.trim() || "Médio Porte",
    employee_count: input.employeeCount == null ? null : String(input.employeeCount),
    estimated_revenue: input.estimatedRevenue?.trim() || null,
    status: input.status || "prospect",
    owner_id: input.ownerId && uuidPattern.test(input.ownerId) ? input.ownerId : userId,
    source: input.source?.trim() || "Manual",
    tags: input.tags ?? [],
    address: (input.address as Json | undefined) ?? null,
    custom_fields: (input.customFields as unknown as Json | undefined) ?? null,
  };
  const { data, error } = await client.from("companies").insert(payload).select("*").single();
  if (error) throw error;
  return mapCompany(data);
}

export async function updateCompany(client: Client, organizationId: string, id: string, input: Partial<CompanyItem>) {
  const payload: Database["public"]["Tables"]["companies"]["Update"] = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.legalName !== undefined) payload.legal_name = input.legalName?.trim() || null;
  if (input.cnpj !== undefined) payload.cnpj = normalizeCnpj(input.cnpj);
  if (input.domain !== undefined) payload.domain = normalizeDomain(input.domain);
  if (input.phone !== undefined) payload.phone = input.phone?.trim() || null;
  if (input.email !== undefined) payload.email = input.email?.trim() || null;
  if (input.segment !== undefined) payload.segment = input.segment;
  if (input.size !== undefined) payload.size = input.size;
  if (input.employeeCount !== undefined) payload.employee_count = input.employeeCount == null ? null : String(input.employeeCount);
  if (input.estimatedRevenue !== undefined) payload.estimated_revenue = input.estimatedRevenue || null;
  if (input.status !== undefined) payload.status = input.status;
  if (input.ownerId !== undefined && (!input.ownerId || uuidPattern.test(input.ownerId))) payload.owner_id = input.ownerId || null;
  if (input.source !== undefined) payload.source = input.source || null;
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.address !== undefined) payload.address = (input.address as Json) ?? null;
  if (input.customFields !== undefined) payload.custom_fields = (input.customFields as unknown as Json) ?? null;
  if (input.archivedAt !== undefined) payload.archived_at = input.archivedAt ?? null;
  const { data, error } = await client.from("companies").update(payload).eq("id", id).eq("organization_id", organizationId).select("*").single();
  if (error) throw error;
  return mapCompany(data);
}

export async function createContact(client: Client, organizationId: string, userId: string, input: Partial<ContactItem>) {
  const fullName = input.fullName?.trim() || `${input.firstName || ""} ${input.lastName || ""}`.trim() || "Novo Contato";
  const payload: Database["public"]["Tables"]["contacts"]["Insert"] = {
    organization_id: organizationId,
    created_by: userId,
    first_name: input.firstName?.trim() || fullName.split(/\s+/)[0] || "",
    last_name: input.lastName?.trim() || null,
    full_name: fullName,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    mobile_phone: input.mobilePhone?.trim() || null,
    job_title: input.jobTitle?.trim() || null,
    company_id: input.companyId || null,
    owner_id: input.ownerId && uuidPattern.test(input.ownerId) ? input.ownerId : userId,
    lifecycle_status: input.lifecycleStatus || "active",
    source: input.source?.trim() || "Manual",
    tags: input.tags ?? [],
    custom_fields: (input.customFields as unknown as Json | undefined) ?? null,
  };
  const { data, error } = await client.from("contacts").insert(payload).select("*").single();
  if (error) throw error;
  return mapContact(data);
}

export async function updateContact(client: Client, organizationId: string, id: string, input: Partial<ContactItem>) {
  const payload: Database["public"]["Tables"]["contacts"]["Update"] = {};
  if (input.firstName !== undefined) payload.first_name = input.firstName;
  if (input.lastName !== undefined) payload.last_name = input.lastName || null;
  if (input.fullName !== undefined || input.firstName !== undefined || input.lastName !== undefined) payload.full_name = input.fullName || `${input.firstName || ""} ${input.lastName || ""}`.trim() || "Novo Contato";
  if (input.email !== undefined) payload.email = input.email || null;
  if (input.phone !== undefined) payload.phone = input.phone || null;
  if (input.mobilePhone !== undefined) payload.mobile_phone = input.mobilePhone || null;
  if (input.jobTitle !== undefined) payload.job_title = input.jobTitle || null;
  if (input.companyId !== undefined) payload.company_id = input.companyId || null;
  if (input.ownerId !== undefined && (!input.ownerId || uuidPattern.test(input.ownerId))) payload.owner_id = input.ownerId || null;
  if (input.lifecycleStatus !== undefined) payload.lifecycle_status = input.lifecycleStatus;
  if (input.source !== undefined) payload.source = input.source || null;
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.customFields !== undefined) payload.custom_fields = (input.customFields as unknown as Json) ?? null;
  if (input.archivedAt !== undefined) payload.archived_at = input.archivedAt ?? null;
  const { data, error } = await client.from("contacts").update(payload).eq("id", id).eq("organization_id", organizationId).select("*").single();
  if (error) throw error;
  return mapContact(data);
}
