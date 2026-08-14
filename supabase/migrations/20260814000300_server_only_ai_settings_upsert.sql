-- PostgREST requires table SELECT for an authenticated upsert, which would
-- make this secret-bearing table unnecessarily readable from the client.
-- Move persistence into a narrowly validated server-side RPC instead.
revoke select on public.organization_ai_settings from authenticated;
revoke select (
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
) on public.organization_ai_settings from authenticated;

drop policy if exists organization_ai_settings_admin_select on public.organization_ai_settings;

create or replace function public.upsert_organization_ai_setting(
  target_organization uuid,
  target_provider text,
  target_model text,
  target_encrypted_api_key text,
  target_key_last_four text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.can_manage_members(target_organization) then
    raise exception 'Owner or admin permission required' using errcode = '42501';
  end if;

  if target_provider not in ('groq', 'gemini')
     or length(trim(target_model)) not between 1 and 160
     or length(target_encrypted_api_key) = 0
     or length(target_key_last_four) not between 1 and 4 then
    raise exception 'Invalid AI setting' using errcode = '22023';
  end if;

  insert into public.organization_ai_settings (
    organization_id,
    provider,
    model,
    encrypted_api_key,
    key_last_four,
    enabled,
    created_by,
    updated_by
  ) values (
    target_organization,
    target_provider,
    trim(target_model),
    target_encrypted_api_key,
    target_key_last_four,
    true,
    auth.uid(),
    auth.uid()
  )
  on conflict (organization_id) do update set
    provider = excluded.provider,
    model = excluded.model,
    encrypted_api_key = excluded.encrypted_api_key,
    key_last_four = excluded.key_last_four,
    enabled = true,
    updated_by = auth.uid(),
    updated_at = now();
end;
$$;

revoke all on function public.upsert_organization_ai_setting(uuid, text, text, text, text) from public;
grant execute on function public.upsert_organization_ai_setting(uuid, text, text, text, text) to authenticated;
