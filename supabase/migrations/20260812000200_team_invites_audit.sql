create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (length(trim(email)) > 3),
  role text not null check (role in ('admin', 'manager', 'sales', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists organization_invites_pending_email_idx
  on public.organization_invites (organization_id, lower(email)) where status = 'pending';
create index if not exists organization_invites_org_idx on public.organization_invites(organization_id, status);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);

drop trigger if exists organization_invites_set_updated_at on public.organization_invites;
create trigger organization_invites_set_updated_at before update on public.organization_invites for each row execute function public.set_updated_at();

create or replace function public.can_manage_members(target_organization uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.organization_members where organization_id = target_organization and user_id = target_user and status = 'active' and role in ('owner','admin'));
$$;

create or replace function public.create_audit_log(target_org uuid, target_action text, target_entity_type text, target_entity_id uuid default null, target_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if not public.is_active_member(target_org) then raise exception 'organization access denied'; end if;
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (target_org, auth.uid(), target_action, target_entity_type, target_entity_id, coalesce(target_metadata, '{}'::jsonb));
end;
$$;

create or replace function public.change_member_role(target_member uuid, target_role text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare target public.organization_members; actor public.organization_members; active_owners integer;
begin
  select * into target from public.organization_members where id = target_member;
  if target.id is null then raise exception 'member not found'; end if;
  select * into actor from public.organization_members where organization_id = target.organization_id and user_id = auth.uid() and status = 'active';
  if actor.role not in ('owner','admin') then raise exception 'permission denied'; end if;
  if target_role not in ('admin','manager','sales','viewer') then raise exception 'role not allowed'; end if;
  if target.role = 'owner' or target.user_id = auth.uid() then raise exception 'owner protection'; end if;
  if actor.role = 'admin' and target_role = 'admin' and target.role <> 'admin' then raise exception 'admin cannot promote admin'; end if;
  update public.organization_members set role = target_role where id = target.id;
  perform public.create_audit_log(target.organization_id, 'member.role_changed', 'organization_member', target.id, jsonb_build_object('role', target_role));
  return true;
end;
$$;

create or replace function public.set_member_status(target_member uuid, target_status text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare target public.organization_members; actor public.organization_members; active_owners integer;
begin
  if target_status not in ('active','suspended') then raise exception 'status not allowed'; end if;
  select * into target from public.organization_members where id = target_member;
  select * into actor from public.organization_members where organization_id = target.organization_id and user_id = auth.uid() and status = 'active';
  if actor.role not in ('owner','admin') or target.id is null then raise exception 'permission denied'; end if;
  if target.role = 'owner' or target.user_id = auth.uid() then raise exception 'owner protection'; end if;
  if target_status = 'suspended' then
    select count(*) into active_owners from public.organization_members where organization_id = target.organization_id and role = 'owner' and status = 'active';
    if active_owners < 1 then raise exception 'organization needs an owner'; end if;
  end if;
  update public.organization_members set status = target_status where id = target.id;
  perform public.create_audit_log(target.organization_id, case when target_status = 'active' then 'member.reactivated' else 'member.suspended' end, 'organization_member', target.id);
  return true;
end;
$$;

create or replace function public.revoke_organization_invite(target_invite uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare invitation public.organization_invites;
begin
  select * into invitation from public.organization_invites where id = target_invite;
  if invitation.id is null or not public.can_manage_members(invitation.organization_id) or invitation.status <> 'pending' then raise exception 'permission denied'; end if;
  update public.organization_invites set status = 'revoked' where id = invitation.id;
  perform public.create_audit_log(invitation.organization_id, 'invite.revoked', 'organization_invite', invitation.id);
  return true;
end;
$$;

create or replace function public.accept_organization_invite(target_hash text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare invitation public.organization_invites; current_email text;
begin
  select * into invitation from public.organization_invites where token_hash = target_hash for update;
  if invitation.id is null or invitation.status <> 'pending' then raise exception 'invite invalid'; end if;
  if invitation.expires_at <= now() then update public.organization_invites set status = 'expired' where id = invitation.id; raise exception 'invite expired'; end if;
  select email into current_email from auth.users where id = auth.uid();
  if lower(current_email) <> lower(invitation.email) then raise exception 'invite email mismatch'; end if;
  insert into public.organization_members(organization_id, user_id, role, status) values (invitation.organization_id, auth.uid(), invitation.role, 'active') on conflict (organization_id, user_id) do nothing;
  update public.organization_invites set status = 'accepted', accepted_at = now() where id = invitation.id;
  perform public.create_audit_log(invitation.organization_id, 'invite.accepted', 'organization_invite', invitation.id);
  return invitation.organization_id;
end;
$$;

alter table public.organization_invites enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists organization_invites_member_select on public.organization_invites;
create policy organization_invites_member_select on public.organization_invites for select to authenticated using (public.is_active_member(organization_id));
drop policy if exists organization_invites_admin_insert on public.organization_invites;
create policy organization_invites_admin_insert on public.organization_invites for insert to authenticated with check (public.can_manage_members(organization_id) and invited_by = auth.uid());
drop policy if exists audit_logs_member_select on public.audit_logs;
create policy audit_logs_member_select on public.audit_logs for select to authenticated using (public.is_active_member(organization_id));

drop policy if exists organization_members_admin_update on public.organization_members;
create policy organization_members_admin_update on public.organization_members for update to authenticated using (public.can_manage_members(organization_id) and user_id <> auth.uid() and role <> 'owner') with check (public.can_manage_members(organization_id) and role <> 'owner');
drop policy if exists organization_members_admin_delete on public.organization_members;
create policy organization_members_admin_delete on public.organization_members for delete to authenticated using (public.can_manage_members(organization_id) and user_id <> auth.uid() and role <> 'owner');

revoke all on public.organization_invites, public.audit_logs from anon;
grant select, insert on public.organization_invites to authenticated;
grant select on public.audit_logs to authenticated;
grant execute on function public.can_manage_members(uuid, uuid) to authenticated;
grant execute on function public.create_audit_log(uuid, text, text, uuid, jsonb) to authenticated;
grant execute on function public.change_member_role(uuid, text) to authenticated;
grant execute on function public.set_member_status(uuid, text) to authenticated;
grant execute on function public.revoke_organization_invite(uuid) to authenticated;
grant execute on function public.accept_organization_invite(text) to authenticated;
