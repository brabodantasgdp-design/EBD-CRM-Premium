-- ON CONFLICT DO UPDATE must evaluate the row-level policies and conflict
-- target. Grant only non-secret metadata columns to the authenticated role.
-- encrypted_api_key remains inaccessible to authenticated clients.
grant select (
  id,
  organization_id,
  provider,
  model,
  key_last_four,
  enabled,
  created_by,
  updated_by,
  created_at,
  updated_at
) on public.organization_ai_settings to authenticated;
