create table if not exists public.organization_ai_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('groq', 'gemini')),
  model text not null check (length(trim(model)) between 1 and 160),
  encrypted_api_key text not null check (length(encrypted_api_key) > 0),
  key_last_four text check (key_last_four is null or length(key_last_four) between 1 and 4),
  enabled boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_ai_settings_org_idx on public.organization_ai_settings(organization_id);
drop trigger if exists organization_ai_settings_set_updated_at on public.organization_ai_settings;
create trigger organization_ai_settings_set_updated_at before update on public.organization_ai_settings for each row execute function public.set_updated_at();

alter table public.organization_ai_settings enable row level security;
drop policy if exists organization_ai_settings_admin_insert on public.organization_ai_settings;
create policy organization_ai_settings_admin_insert on public.organization_ai_settings for insert to authenticated
  with check (public.can_manage_members(organization_id) and created_by = auth.uid());
drop policy if exists organization_ai_settings_admin_update on public.organization_ai_settings;
create policy organization_ai_settings_admin_update on public.organization_ai_settings for update to authenticated
  using (public.can_manage_members(organization_id)) with check (public.can_manage_members(organization_id) and updated_by = auth.uid());
drop policy if exists organization_ai_settings_admin_delete on public.organization_ai_settings;
create policy organization_ai_settings_admin_delete on public.organization_ai_settings for delete to authenticated
  using (public.can_manage_members(organization_id));

-- The encrypted column is intentionally not granted to authenticated clients.
revoke all on public.organization_ai_settings from anon, authenticated;
grant insert, update, delete on public.organization_ai_settings to authenticated;

create or replace function public.audit_ai_setting_change()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if auth.uid() is not null then
    perform public.create_audit_log(new.organization_id,
      case when tg_op = 'INSERT' then 'ai.settings.created' when new.enabled then 'ai.settings.updated' else 'ai.settings.disabled' end,
      'organization_ai_settings', new.id,
      jsonb_build_object('provider', new.provider, 'model', new.model, 'enabled', new.enabled, 'key_last_four', new.key_last_four));
  end if;
  return new;
end;
$$;
drop trigger if exists organization_ai_settings_audit on public.organization_ai_settings;
create trigger organization_ai_settings_audit after insert or update on public.organization_ai_settings for each row execute function public.audit_ai_setting_change();
