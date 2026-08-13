create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  status text not null default 'draft' check (status in ('draft','active','paused','archived')),
  trigger_type text not null check (trigger_type in ('deal.stage_changed','deal.won','deal.lost','lead.created','lead.converted','task.overdue','activity.completed','proposal.accepted','proposal.expired')),
  conditions jsonb not null default '[]'::jsonb check (jsonb_typeof(conditions) = 'array'),
  actions jsonb not null default '[]'::jsonb check (jsonb_typeof(actions) = 'array'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  automation_id uuid not null references public.automations(id) on delete cascade,
  trigger_entity_type text not null check (trigger_entity_type in ('lead','contact','company','deal','task','activity','proposal')),
  trigger_entity_id uuid not null,
  event_type text not null,
  idempotency_key text not null,
  event_chain_id uuid not null,
  depth integer not null default 0 check (depth between 0 and 5),
  status text not null default 'pending' check (status in ('pending','running','success','failed','skipped')),
  started_at timestamptz,
  finished_at timestamptz,
  attempt integer not null default 1 check (attempt > 0),
  error_code text,
  error_message_sanitized text,
  context jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, automation_id, idempotency_key)
);

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('lead','contact','company','deal')),
  entity_id uuid not null,
  type text not null check (type in ('task','activity','reminder','message_draft')),
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  scheduled_for timestamptz not null,
  completed_at timestamptz,
  cancelled_at timestamptz,
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  source text not null default 'manual' check (source in ('manual','automation','scheduler')),
  automation_id uuid references public.automations(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  processing_attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists automations_org_status_idx on public.automations(organization_id, status) where archived_at is null;
create index if not exists automation_runs_org_created_idx on public.automation_runs(organization_id, created_at desc);
create index if not exists automation_runs_entity_idx on public.automation_runs(organization_id, trigger_entity_type, trigger_entity_id);
create index if not exists follow_ups_org_schedule_idx on public.follow_ups(organization_id, scheduled_for) where archived_at is null and status = 'scheduled';
create index if not exists follow_ups_entity_idx on public.follow_ups(organization_id, entity_type, entity_id) where archived_at is null;

create or replace function public.can_manage_automations(target_org uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.organization_members where organization_id = target_org and user_id = target_user and status = 'active' and role in ('owner','admin'));
$$;

create or replace function public.validate_follow_up_link()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if not public.entity_belongs_to_org(new.organization_id, new.entity_type, new.entity_id) then
    raise exception 'entity does not belong to organization';
  end if;
  if new.owner_id is not null and not public.is_active_member(new.organization_id, new.owner_id) then
    raise exception 'owner does not belong to organization';
  end if;
  return new;
end; $$;

create or replace function public.audit_automation_change()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare action_name text;
begin
  if tg_table_name = 'automations' then
    if tg_op = 'INSERT' then action_name := 'automation.created';
    elsif old.status <> 'active' and new.status = 'active' then action_name := 'automation.activated';
    elsif old.status = 'active' and new.status = 'paused' then action_name := 'automation.paused';
    elsif old.archived_at is null and new.archived_at is not null then action_name := 'automation.archived';
    else action_name := 'automation.updated'; end if;
    insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
      values(new.organization_id, coalesce(auth.uid(), new.created_by), action_name, 'automation', new.id, jsonb_build_object('status', new.status, 'trigger_type', new.trigger_type));
  elsif tg_table_name = 'follow_ups' and tg_op = 'INSERT' then
    insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
      values(new.organization_id, coalesce(auth.uid(), new.created_by), 'followup.created', 'follow_up', new.id, jsonb_build_object('type', new.type, 'source', new.source));
  elsif tg_table_name = 'follow_ups' and old.status <> new.status then
    insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
      values(new.organization_id, coalesce(auth.uid(), new.created_by), case when new.status = 'completed' then 'followup.completed' else 'followup.cancelled' end, 'follow_up', new.id, jsonb_build_object('status', new.status));
  end if;
  return new;
end; $$;

drop trigger if exists automations_set_updated_at on public.automations;
create trigger automations_set_updated_at before update on public.automations for each row execute function public.set_updated_at();
drop trigger if exists follow_ups_set_updated_at on public.follow_ups;
create trigger follow_ups_set_updated_at before update on public.follow_ups for each row execute function public.set_updated_at();
drop trigger if exists follow_ups_validate_link on public.follow_ups;
create trigger follow_ups_validate_link before insert or update on public.follow_ups for each row execute function public.validate_follow_up_link();
drop trigger if exists automations_audit_change on public.automations;
create trigger automations_audit_change after insert or update on public.automations for each row execute function public.audit_automation_change();
drop trigger if exists follow_ups_audit_change on public.follow_ups;
create trigger follow_ups_audit_change after insert or update on public.follow_ups for each row execute function public.audit_automation_change();

alter table public.automations enable row level security;
alter table public.automation_runs enable row level security;
alter table public.follow_ups enable row level security;

drop policy if exists automations_member_select on public.automations;
create policy automations_member_select on public.automations for select to authenticated using (public.is_active_member(organization_id));
drop policy if exists automations_admin_insert on public.automations;
create policy automations_admin_insert on public.automations for insert to authenticated with check (public.can_manage_automations(organization_id) and created_by = (select auth.uid()));
drop policy if exists automations_admin_update on public.automations;
create policy automations_admin_update on public.automations for update to authenticated using (public.can_manage_automations(organization_id)) with check (public.can_manage_automations(organization_id));
drop policy if exists automation_runs_member_select on public.automation_runs;
create policy automation_runs_member_select on public.automation_runs for select to authenticated using (public.is_active_member(organization_id));
drop policy if exists follow_ups_member_select on public.follow_ups;
create policy follow_ups_member_select on public.follow_ups for select to authenticated using (public.is_active_member(organization_id));
drop policy if exists follow_ups_operator_insert on public.follow_ups;
create policy follow_ups_operator_insert on public.follow_ups for insert to authenticated with check (public.can_operate_task_activity(organization_id) and created_by = (select auth.uid()));
drop policy if exists follow_ups_operator_update on public.follow_ups;
create policy follow_ups_operator_update on public.follow_ups for update to authenticated using (public.can_operate_task_activity(organization_id)) with check (public.can_operate_task_activity(organization_id));

revoke all on public.automations, public.automation_runs, public.follow_ups from anon;
grant select, insert, update on public.automations, public.follow_ups to authenticated;
grant select on public.automation_runs to authenticated;
grant execute on function public.can_manage_automations(uuid, uuid) to authenticated;
