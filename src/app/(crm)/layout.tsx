import type { ReactNode } from "react";
import { requireUser, requireOrganization } from "../../lib/supabase/auth";
import { hasSupabaseConfiguration } from "../../lib/supabase/env";
import { OrganizationRequired } from "../../components/auth/OrganizationRequired";

export default async function CrmLayout({ children }: Readonly<{ children: ReactNode }>) {
  if (!hasSupabaseConfiguration()) return children;
  await requireUser();
  const organization = await requireOrganization();
  if (!organization) return <OrganizationRequired />;
  return children;
}
