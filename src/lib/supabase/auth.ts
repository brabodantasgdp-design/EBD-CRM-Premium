import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./server";

export async function getUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
}

export async function getCurrentOrganization() {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return null;

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id, role, status, organizations(*)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const requestedId = (await import("next/headers")).cookies().then((store) => store.get("nexus-active-organization")?.value);
  const activeId = await requestedId;
  const valid = memberships?.find((membership) => membership.organization_id === activeId) ?? memberships?.[0];
  return valid?.organizations ?? null;
}

export async function requireOrganization() {
  const organization = await getCurrentOrganization();
  return organization;
}
