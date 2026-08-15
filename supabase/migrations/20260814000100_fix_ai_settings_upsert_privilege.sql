-- The BYOK write path is authorized in the server route before this table is
-- accessed. PostgREST still needs to read the conflict key for an upsert.
-- Keep the encrypted credential unavailable to authenticated clients.
grant select (organization_id) on public.organization_ai_settings to authenticated;

drop policy if exists organization_ai_settings_admin_select on public.organization_ai_settings;
create policy organization_ai_settings_admin_select on public.organization_ai_settings for select to authenticated
  using (public.can_manage_members(organization_id));
