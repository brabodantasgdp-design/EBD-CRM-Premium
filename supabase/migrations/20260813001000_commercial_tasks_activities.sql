create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  status text not null default 'pending' check (status in ('pending','completed')),
  priority text check (priority in ('low','medium','high')),
  due_date date,
  due_at timestamptz,
  completed_at timestamptz,
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  entity_type text check (entity_type in ('lead','contact','company','deal')),
  entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint tasks_entity_pair_check check ((entity_type is null) = (entity_id is null))
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null check (type in ('meeting','call','email','note','follow_up')),
  title text not null check (length(trim(title)) > 0),
  description text,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  start_at timestamptz not null,
  end_at timestamptz,
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  entity_type text check (entity_type in ('lead','contact','company','deal')),
  entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint activities_entity_pair_check check ((entity_type is null) = (entity_id is null)),
  constraint activities_end_after_start check (end_at is null or end_at >= start_at)
);

create index if not exists tasks_org_due_idx on public.tasks(organization_id, due_date, due_at) where archived_at is null;
create index if not exists tasks_entity_idx on public.tasks(organization_id, entity_type, entity_id) where archived_at is null;
create index if not exists activities_org_start_idx on public.activities(organization_id, start_at) where archived_at is null;
create index if not exists activities_entity_idx on public.activities(organization_id, entity_type, entity_id) where archived_at is null;

create or replace function public.entity_belongs_to_org(target_org uuid, target_type text, target_id uuid)
returns boolean language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  if target_type is null and target_id is null then return true; end if;
  if target_type is null or target_id is null then return false; end if;
  if target_type = 'lead' then return exists(select 1 from public.leads where id=target_id and organization_id=target_org);
  elsif target_type = 'contact' then return exists(select 1 from public.contacts where id=target_id and organization_id=target_org);
  elsif target_type = 'company' then return exists(select 1 from public.companies where id=target_id and organization_id=target_org);
  elsif target_type = 'deal' then return exists(select 1 from public.deals where id=target_id and organization_id=target_org);
  end if;
  return false;
end; $$;

create or replace function public.can_operate_task_activity(target_org uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
    where m.organization_id=target_org and m.user_id=target_user and m.status='active' and o.status='active'
      and m.role in ('owner','admin','manager','sales'));
$$;

create or replace function public.validate_task_activity_link()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if not public.entity_belongs_to_org(new.organization_id, new.entity_type, new.entity_id) then
    raise exception 'entity does not belong to organization';
  end if;
  return new;
end; $$;

create or replace function public.audit_task_activity_change()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare action_name text; entity_name text;
begin
  entity_name := case when tg_table_name = 'tasks' then 'task' else 'activity' end;
  if tg_op='INSERT' then action_name := entity_name || '.created';
  elsif new.archived_at is distinct from old.archived_at and new.archived_at is not null then action_name := entity_name || '.archived';
  elsif tg_table_name='tasks' and old.status='pending' and new.status='completed' then action_name := 'task.completed';
  elsif tg_table_name='tasks' and old.status='completed' and new.status='pending' then action_name := 'task.reopened';
  elsif tg_table_name='activities' and old.status <> 'completed' and new.status='completed' then action_name := 'activity.completed';
  elsif tg_table_name='activities' and old.status <> 'cancelled' and new.status='cancelled' then action_name := 'activity.cancelled';
  else action_name := entity_name || '.updated'; end if;
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values(new.organization_id, coalesce(auth.uid(), new.created_by), action_name, entity_name, new.id,
      jsonb_build_object('status', new.status, 'entity_type', new.entity_type, 'entity_id', new.entity_id));
  return new;
end; $$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();
drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at before update on public.activities for each row execute function public.set_updated_at();
drop trigger if exists tasks_validate_link on public.tasks;
create trigger tasks_validate_link before insert or update on public.tasks for each row execute function public.validate_task_activity_link();
drop trigger if exists activities_validate_link on public.activities;
create trigger activities_validate_link before insert or update on public.activities for each row execute function public.validate_task_activity_link();
drop trigger if exists tasks_audit_change on public.tasks;
create trigger tasks_audit_change after insert or update on public.tasks for each row execute function public.audit_task_activity_change();
drop trigger if exists activities_audit_change on public.activities;
create trigger activities_audit_change after insert or update on public.activities for each row execute function public.audit_task_activity_change();

alter table public.tasks enable row level security;
alter table public.activities enable row level security;
drop policy if exists tasks_member_select on public.tasks;
create policy tasks_member_select on public.tasks for select to authenticated using (public.is_active_member(organization_id));
drop policy if exists tasks_operator_insert on public.tasks;
create policy tasks_operator_insert on public.tasks for insert to authenticated with check (public.can_operate_task_activity(organization_id) and created_by=auth.uid());
drop policy if exists tasks_operator_update on public.tasks;
create policy tasks_operator_update on public.tasks for update to authenticated using (public.can_operate_task_activity(organization_id)) with check (public.can_operate_task_activity(organization_id));
drop policy if exists activities_member_select on public.activities;
create policy activities_member_select on public.activities for select to authenticated using (public.is_active_member(organization_id));
drop policy if exists activities_operator_insert on public.activities;
create policy activities_operator_insert on public.activities for insert to authenticated with check (public.can_operate_task_activity(organization_id) and created_by=auth.uid());
drop policy if exists activities_operator_update on public.activities;
create policy activities_operator_update on public.activities for update to authenticated using (public.can_operate_task_activity(organization_id)) with check (public.can_operate_task_activity(organization_id));

revoke all on public.tasks, public.activities from anon;
grant select, insert, update on public.tasks, public.activities to authenticated;
revoke all on function public.entity_belongs_to_org(uuid,text,uuid), public.can_operate_task_activity(uuid,uuid) from public;
grant execute on function public.entity_belongs_to_org(uuid,text,uuid), public.can_operate_task_activity(uuid,uuid) to authenticated;
