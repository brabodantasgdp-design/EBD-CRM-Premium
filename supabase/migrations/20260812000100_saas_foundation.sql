create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text unique,
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'sales', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_unique_user unique (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx on public.organization_members(user_id);
create index if not exists organization_members_organization_id_idx on public.organization_members(organization_id);
create index if not exists organization_members_org_user_idx on public.organization_members(organization_id, user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
drop trigger if exists organization_members_set_updated_at on public.organization_members;
create trigger organization_members_set_updated_at before update on public.organization_members for each row execute function public.set_updated_at();

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if old.user_id = auth.uid() and new.role is distinct from old.role then
    raise exception 'members cannot change their own role';
  end if;
  return new;
end;
$$;

drop trigger if exists organization_members_prevent_self_role_change on public.organization_members;
create trigger organization_members_prevent_self_role_change before update on public.organization_members for each row execute function public.prevent_self_role_change();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_active_member(target_organization uuid, target_user uuid default auth.uid())
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
  );
$$;

create or replace function public.is_active_admin(target_organization uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization and user_id = target_user
      and status = 'active' and role in ('owner', 'admin')
  );
$$;

create or replace function public.create_initial_organization(organization_name text, organization_slug text default null)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  new_org_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'authentication required'; end if;
  if exists (select 1 from public.organization_members where user_id = current_user_id and status = 'active') then
    raise exception 'user already belongs to an active organization';
  end if;
  insert into public.organizations (name, slug, created_by) values (trim(organization_name), organization_slug, current_user_id) returning id into new_org_id;
  insert into public.organization_members (organization_id, user_id, role, status) values (new_org_id, current_user_id, 'owner', 'active');
  return new_org_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists organizations_member_select on public.organizations;
create policy organizations_member_select on public.organizations for select to authenticated using (public.is_active_member(id));
drop policy if exists organizations_owner_update on public.organizations;
create policy organizations_owner_update on public.organizations for update to authenticated using (public.is_active_admin(id)) with check (public.is_active_admin(id));
drop policy if exists organizations_authenticated_insert on public.organizations;
create policy organizations_authenticated_insert on public.organizations for insert to authenticated with check (created_by = auth.uid());

drop policy if exists organization_members_member_select on public.organization_members;
create policy organization_members_member_select on public.organization_members for select to authenticated using (public.is_active_member(organization_id));
drop policy if exists organization_members_admin_insert on public.organization_members;
create policy organization_members_admin_insert on public.organization_members for insert to authenticated with check (public.is_active_admin(organization_id));
drop policy if exists organization_members_admin_update on public.organization_members;
create policy organization_members_admin_update on public.organization_members for update to authenticated using (public.is_active_admin(organization_id)) with check (public.is_active_admin(organization_id));
drop policy if exists organization_members_admin_delete on public.organization_members;
create policy organization_members_admin_delete on public.organization_members for delete to authenticated using (public.is_active_admin(organization_id));

revoke all on public.profiles, public.organizations, public.organization_members from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
revoke all on function public.is_active_member(uuid, uuid) from public;
revoke all on function public.is_active_admin(uuid, uuid) from public;
revoke all on function public.create_initial_organization(text, text) from public;
grant execute on function public.is_active_member(uuid, uuid) to authenticated;
grant execute on function public.is_active_admin(uuid, uuid) to authenticated;
grant execute on function public.create_initial_organization(text, text) to authenticated;
