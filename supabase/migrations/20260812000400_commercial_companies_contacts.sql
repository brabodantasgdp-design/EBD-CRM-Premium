create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  legal_name text,
  cnpj text,
  domain text,
  phone text,
  email text,
  segment text not null default 'Tecnologia & SaaS',
  size text not null default 'Médio Porte',
  employee_count text,
  estimated_revenue text,
  status text not null default 'prospect' check (status in ('prospect', 'cliente', 'inativo', 'ex_cliente')),
  owner_id uuid references auth.users(id) on delete set null,
  source text,
  tags text[] not null default '{}',
  address jsonb,
  custom_fields jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  first_name text not null default '',
  last_name text,
  full_name text not null check (length(trim(full_name)) > 0),
  email text,
  phone text,
  mobile_phone text,
  job_title text,
  company_id uuid references public.companies(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  lifecycle_status text not null default 'active' check (lifecycle_status in ('active', 'inactive', 'customer', 'former_customer')),
  source text,
  tags text[] not null default '{}',
  custom_fields jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists companies_organization_id_idx on public.companies(organization_id);
create index if not exists companies_organization_status_idx on public.companies(organization_id, status);
create index if not exists companies_organization_owner_idx on public.companies(organization_id, owner_id);
create index if not exists companies_organization_created_idx on public.companies(organization_id, created_at desc);
create index if not exists contacts_organization_id_idx on public.contacts(organization_id);
create index if not exists contacts_organization_status_idx on public.contacts(organization_id, lifecycle_status);
create index if not exists contacts_organization_company_idx on public.contacts(organization_id, company_id);
create index if not exists contacts_organization_owner_idx on public.contacts(organization_id, owner_id);
create index if not exists contacts_organization_created_idx on public.contacts(organization_id, created_at desc);
create unique index if not exists companies_organization_cnpj_unique_idx on public.companies(organization_id, cnpj) where cnpj is not null and cnpj <> '' and archived_at is null;
create unique index if not exists companies_organization_domain_unique_idx on public.companies(organization_id, lower(domain)) where domain is not null and domain <> '' and archived_at is null;
create unique index if not exists contacts_organization_email_unique_idx on public.contacts(organization_id, lower(email)) where email is not null and email <> '' and archived_at is null;

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at before update on public.companies for each row execute function public.set_updated_at();
drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at before update on public.contacts for each row execute function public.set_updated_at();

create or replace function public.can_write_commercial(target_organization uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = target_organization
      and m.user_id = target_user
      and m.status = 'active'
      and o.status = 'active'
      and m.role in ('owner', 'admin', 'manager', 'sales')
  );
$$;

create or replace function public.validate_commercial_owner()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.owner_id is not null and not public.is_active_member(new.organization_id, new.owner_id) then
    raise exception 'owner must be an active member of the organization';
  end if;
  if not public.is_active_member(new.organization_id, new.created_by) then
    raise exception 'creator must be an active member of the organization';
  end if;
  return new;
end;
$$;

create or replace function public.validate_contact_company_organization()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.company_id is not null and not exists (
    select 1 from public.companies c
    where c.id = new.company_id and c.organization_id = new.organization_id
  ) then
    raise exception 'contact company must belong to the same organization';
  end if;
  return new;
end;
$$;

drop trigger if exists companies_validate_owner on public.companies;
create trigger companies_validate_owner before insert or update on public.companies for each row execute function public.validate_commercial_owner();
drop trigger if exists contacts_validate_owner on public.contacts;
create trigger contacts_validate_owner before insert or update on public.contacts for each row execute function public.validate_commercial_owner();
drop trigger if exists contacts_validate_company on public.contacts;
create trigger contacts_validate_company before insert or update on public.contacts for each row execute function public.validate_contact_company_organization();

create or replace function public.audit_commercial_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  actor uuid := coalesce(auth.uid(), new.created_by, old.created_by);
  entity text := tg_table_name;
  action_name text;
begin
  if tg_op = 'INSERT' then
    action_name := entity || '.created';
  elsif new.archived_at is distinct from old.archived_at and new.archived_at is not null then
    action_name := entity || '.archived';
  else
    action_name := entity || '.updated';
  end if;
  insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (new.organization_id, actor, action_name, entity, new.id, '{}'::jsonb);
  return new;
end;
$$;

drop trigger if exists companies_audit_change on public.companies;
create trigger companies_audit_change after insert or update on public.companies for each row execute function public.audit_commercial_change();
drop trigger if exists contacts_audit_change on public.contacts;
create trigger contacts_audit_change after insert or update on public.contacts for each row execute function public.audit_commercial_change();

alter table public.companies enable row level security;
alter table public.contacts enable row level security;

drop policy if exists companies_member_select on public.companies;
create policy companies_member_select on public.companies for select to authenticated using (public.is_active_member(organization_id));
drop policy if exists companies_member_insert on public.companies;
create policy companies_member_insert on public.companies for insert to authenticated with check (public.can_write_commercial(organization_id) and created_by = auth.uid());
drop policy if exists companies_member_update on public.companies;
create policy companies_member_update on public.companies for update to authenticated using (public.can_write_commercial(organization_id)) with check (public.can_write_commercial(organization_id));

drop policy if exists contacts_member_select on public.contacts;
create policy contacts_member_select on public.contacts for select to authenticated using (public.is_active_member(organization_id));
drop policy if exists contacts_member_insert on public.contacts;
create policy contacts_member_insert on public.contacts for insert to authenticated with check (public.can_write_commercial(organization_id) and created_by = auth.uid());
drop policy if exists contacts_member_update on public.contacts;
create policy contacts_member_update on public.contacts for update to authenticated using (public.can_write_commercial(organization_id)) with check (public.can_write_commercial(organization_id));

revoke all on public.companies, public.contacts from anon;
grant select, insert, update on public.companies, public.contacts to authenticated;
revoke delete on public.companies, public.contacts from authenticated;
revoke all on function public.can_write_commercial(uuid, uuid) from public;
grant execute on function public.can_write_commercial(uuid, uuid) to authenticated;
