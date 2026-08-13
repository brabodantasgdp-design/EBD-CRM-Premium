create table if not exists public.pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  is_default boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint pipelines_id_organization_unique unique (id, organization_id)
);

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  pipeline_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  position integer not null check (position >= 0),
  probability integer not null check (probability between 0 and 100),
  color text,
  stage_type text not null default 'open' check (stage_type in ('open', 'won', 'lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint pipeline_stages_id_pipeline_unique unique (id, pipeline_id),
  constraint pipeline_stages_pipeline_fk foreign key (pipeline_id, organization_id)
    references public.pipelines(id, organization_id) on delete cascade
);

alter table public.companies add constraint companies_id_organization_unique unique (id, organization_id);
alter table public.contacts add constraint contacts_id_organization_unique unique (id, organization_id);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  company_id uuid,
  contact_id uuid,
  pipeline_id uuid not null,
  stage_id uuid not null,
  owner_id uuid references auth.users(id) on delete set null,
  value numeric(14,2) not null default 0 check (value >= 0),
  currency text not null default 'BRL',
  probability integer not null check (probability between 0 and 100),
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  expected_close_date date,
  loss_reason text,
  loss_note text,
  won_at timestamptz,
  lost_at timestamptz,
  tags text[] not null default '{}',
  custom_fields jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint deals_pipeline_fk foreign key (pipeline_id, organization_id)
    references public.pipelines(id, organization_id) on delete restrict,
  constraint deals_stage_fk foreign key (stage_id, pipeline_id)
    references public.pipeline_stages(id, pipeline_id) on delete restrict,
  constraint deals_company_fk foreign key (company_id, organization_id)
    references public.companies(id, organization_id) on delete set null,
  constraint deals_contact_fk foreign key (contact_id, organization_id)
    references public.contacts(id, organization_id) on delete set null,
  constraint deals_id_organization_unique unique (id, organization_id)
);

create table if not exists public.deal_stage_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  from_pipeline_id uuid,
  from_stage_id uuid,
  to_pipeline_id uuid not null,
  to_stage_id uuid not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  constraint deal_history_deal_org_fk foreign key (deal_id, organization_id)
    references public.deals(id, organization_id) on delete cascade,
  constraint deal_history_to_stage_fk foreign key (to_stage_id, to_pipeline_id)
    references public.pipeline_stages(id, pipeline_id) on delete restrict
);

create index if not exists pipelines_organization_position_idx on public.pipelines(organization_id, position) where archived_at is null;
create unique index if not exists pipelines_default_org_idx on public.pipelines(organization_id) where is_default and archived_at is null;
create index if not exists pipeline_stages_pipeline_position_idx on public.pipeline_stages(pipeline_id, position) where archived_at is null;
create index if not exists deals_organization_status_idx on public.deals(organization_id, status) where archived_at is null;
create index if not exists deals_organization_pipeline_stage_idx on public.deals(organization_id, pipeline_id, stage_id) where archived_at is null;
create index if not exists deals_organization_company_idx on public.deals(organization_id, company_id) where archived_at is null;
create index if not exists deals_organization_contact_idx on public.deals(organization_id, contact_id) where archived_at is null;
create index if not exists deal_history_deal_created_idx on public.deal_stage_history(deal_id, created_at desc);

drop trigger if exists pipelines_set_updated_at on public.pipelines;
create trigger pipelines_set_updated_at before update on public.pipelines for each row execute function public.set_updated_at();
drop trigger if exists pipeline_stages_set_updated_at on public.pipeline_stages;
create trigger pipeline_stages_set_updated_at before update on public.pipeline_stages for each row execute function public.set_updated_at();
drop trigger if exists deals_set_updated_at on public.deals;
create trigger deals_set_updated_at before update on public.deals for each row execute function public.set_updated_at();

create or replace function public.can_manage_pipeline(target_organization uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
    where m.organization_id=target_organization and m.user_id=target_user and m.status='active' and o.status='active'
      and m.role in ('owner','admin','manager'));
$$;

create or replace function public.can_operate_deal(target_organization uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
    where m.organization_id=target_organization and m.user_id=target_user and m.status='active' and o.status='active'
      and m.role in ('owner','admin','manager','sales'));
$$;

create or replace function public.audit_deal_change()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare action_name text;
begin
  if tg_op='INSERT' then action_name := 'deal.created';
  elsif new.archived_at is distinct from old.archived_at and new.archived_at is not null then action_name := 'deal.archived';
  elsif new.status='won' and old.status is distinct from new.status then action_name := 'deal.won';
  elsif new.status='lost' and old.status is distinct from new.status then action_name := 'deal.lost';
  else action_name := 'deal.updated'; end if;
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values(new.organization_id, coalesce(auth.uid(), new.created_by), action_name, 'deal', new.id, '{}'::jsonb);
  return new;
end; $$;

create or replace function public.audit_pipeline_change()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare action_name text;
begin
  action_name := case when tg_op='INSERT' then 'pipeline.created' else 'pipeline.updated' end;
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values(new.organization_id, coalesce(auth.uid(), new.created_by), action_name, 'pipeline', new.id, '{}'::jsonb);
  return new;
end; $$;

drop trigger if exists pipelines_audit_change on public.pipelines;
create trigger pipelines_audit_change after insert or update on public.pipelines for each row execute function public.audit_pipeline_change();

drop trigger if exists deals_audit_change on public.deals;
create trigger deals_audit_change after insert or update on public.deals for each row execute function public.audit_deal_change();

create or replace function public.move_deal_stage(target_deal uuid, target_pipeline uuid, target_stage uuid, target_note text default null)
returns public.deals language plpgsql security definer set search_path = pg_catalog, public as $$
declare current_deal public.deals; next_stage public.pipeline_stages; actor uuid := auth.uid(); old_pipeline uuid; old_stage uuid;
begin
  select * into current_deal from public.deals where id=target_deal and organization_id in (select organization_id from public.organization_members where user_id=actor and status='active') for update;
  if not found or not public.can_operate_deal(current_deal.organization_id, actor) then raise exception 'deal access denied'; end if;
  select * into next_stage from public.pipeline_stages where id=target_stage and pipeline_id=target_pipeline and organization_id=current_deal.organization_id and archived_at is null;
  if not found then raise exception 'stage access denied'; end if;
  old_pipeline := current_deal.pipeline_id;
  old_stage := current_deal.stage_id;
  update public.deals set pipeline_id=target_pipeline, stage_id=target_stage, probability=next_stage.probability,
    status=case when next_stage.stage_type='won' then 'won' when next_stage.stage_type='lost' then 'lost' else 'open' end,
    won_at=case when next_stage.stage_type='won' then coalesce(won_at,now()) else null end,
    lost_at=case when next_stage.stage_type='lost' then coalesce(lost_at,now()) else null end,
    updated_at=now() where id=target_deal returning * into current_deal;
  insert into public.deal_stage_history(organization_id,deal_id,from_pipeline_id,from_stage_id,to_pipeline_id,to_stage_id,changed_by,note)
    values(current_deal.organization_id,current_deal.id,old_pipeline,old_stage,target_pipeline,target_stage,actor,target_note);
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,metadata)
    values(current_deal.organization_id,actor,'deal.stage_changed','deal',current_deal.id,jsonb_build_object('to_stage_id',target_stage));
  return current_deal;
end; $$;

create or replace function public.mark_deal_won(target_deal uuid, target_stage uuid default null)
returns public.deals language plpgsql security definer set search_path = pg_catalog, public as $$
declare d public.deals; s public.pipeline_stages; actor uuid := auth.uid();
begin
  select * into d from public.deals where id=target_deal for update;
  if not found or not public.can_operate_deal(d.organization_id,actor) then raise exception 'deal access denied'; end if;
  select * into s from public.pipeline_stages where pipeline_id=d.pipeline_id and (target_stage is null or id=target_stage) and stage_type='won' and archived_at is null order by position limit 1;
  if not found then raise exception 'won stage not found'; end if;
  return public.move_deal_stage(d.id,d.pipeline_id,s.id,'Negócio marcado como ganho');
end; $$;

create or replace function public.mark_deal_lost(target_deal uuid, target_reason text, target_note text default null, target_stage uuid default null)
returns public.deals language plpgsql security definer set search_path = pg_catalog, public as $$
declare d public.deals; s public.pipeline_stages; actor uuid := auth.uid();
begin
  if nullif(trim(target_reason),'') is null then raise exception 'loss reason is required'; end if;
  select * into d from public.deals where id=target_deal for update;
  if not found or not public.can_operate_deal(d.organization_id,actor) then raise exception 'deal access denied'; end if;
  select * into s from public.pipeline_stages where pipeline_id=d.pipeline_id and (target_stage is null or id=target_stage) and stage_type='lost' and archived_at is null order by position limit 1;
  if not found then raise exception 'lost stage not found'; end if;
  update public.deals set loss_reason=trim(target_reason), loss_note=target_note where id=d.id;
  return public.move_deal_stage(d.id,d.pipeline_id,s.id,'Negócio marcado como perdido');
end; $$;

create or replace function public.reopen_deal(target_deal uuid, target_pipeline uuid, target_stage uuid)
returns public.deals language plpgsql security definer set search_path = pg_catalog, public as $$
declare d public.deals; s public.pipeline_stages; actor uuid := auth.uid(); result public.deals;
begin
  select * into d from public.deals where id=target_deal for update;
  if not found or not public.can_operate_deal(d.organization_id,actor) then raise exception 'deal access denied'; end if;
  select * into s from public.pipeline_stages where id=target_stage and pipeline_id=target_pipeline and stage_type='open' and archived_at is null;
  if not found then raise exception 'open stage not found'; end if;
  update public.deals set status='open', won_at=null, lost_at=null, loss_reason=null, loss_note=null where id=d.id;
  result := public.move_deal_stage(d.id,target_pipeline,target_stage,'Negócio reaberto');
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,metadata) values(d.organization_id,actor,'deal.reopened','deal',d.id,'{}'::jsonb);
  return result;
end; $$;

create or replace function public.archive_deal(target_deal uuid)
returns public.deals language plpgsql security definer set search_path = pg_catalog, public as $$
declare d public.deals; actor uuid := auth.uid();
begin
  select * into d from public.deals where id=target_deal for update;
  if not found or not public.can_operate_deal(d.organization_id,actor) then raise exception 'deal access denied'; end if;
  update public.deals set archived_at=now() where id=d.id returning * into d; return d;
end; $$;

create or replace function public.seed_default_pipeline(target_organization uuid, target_user uuid default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare pipe uuid;
begin
  select id into pipe from public.pipelines where organization_id=target_organization and is_default and archived_at is null limit 1;
  if pipe is not null then return pipe; end if;
  insert into public.pipelines(organization_id,name,description,is_default,position,created_by) values(target_organization,'Vendas','Pipeline padrão de vendas',true,0,target_user) returning id into pipe;
  insert into public.pipeline_stages(organization_id,pipeline_id,name,position,probability,color,stage_type) values
    (target_organization,pipe,'Qualificação',0,20,'slate','open'),
    (target_organization,pipe,'Diagnóstico',1,40,'blue','open'),
    (target_organization,pipe,'Proposta',2,60,'indigo','open'),
    (target_organization,pipe,'Negociação',3,80,'amber','open'),
    (target_organization,pipe,'Ganho',4,100,'emerald','won'),
    (target_organization,pipe,'Perdido',5,0,'rose','lost');
  return pipe;
end; $$;

create or replace function public.seed_default_pipeline_trigger()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin perform public.seed_default_pipeline(new.id,new.created_by); return new; end; $$;
drop trigger if exists organizations_seed_default_pipeline on public.organizations;
create trigger organizations_seed_default_pipeline after insert on public.organizations for each row execute function public.seed_default_pipeline_trigger();

do $$ declare org record; begin for org in select id,created_by from public.organizations where status='active' loop perform public.seed_default_pipeline(org.id,org.created_by); end loop; end $$;

alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.deals enable row level security;
alter table public.deal_stage_history enable row level security;

create policy pipelines_member_select on public.pipelines for select to authenticated using (public.is_active_member(organization_id));
create policy pipelines_manager_insert on public.pipelines for insert to authenticated with check (public.can_manage_pipeline(organization_id) and (created_by is null or created_by=auth.uid()));
create policy pipelines_manager_update on public.pipelines for update to authenticated using (public.can_manage_pipeline(organization_id)) with check (public.can_manage_pipeline(organization_id));
create policy stages_member_select on public.pipeline_stages for select to authenticated using (public.is_active_member(organization_id));
create policy stages_manager_insert on public.pipeline_stages for insert to authenticated with check (public.can_manage_pipeline(organization_id));
create policy stages_manager_update on public.pipeline_stages for update to authenticated using (public.can_manage_pipeline(organization_id)) with check (public.can_manage_pipeline(organization_id));
create policy deals_member_select on public.deals for select to authenticated using (public.is_active_member(organization_id));
create policy deals_operator_insert on public.deals for insert to authenticated with check (public.can_operate_deal(organization_id) and created_by=auth.uid());
create policy deals_operator_update on public.deals for update to authenticated using (public.can_operate_deal(organization_id)) with check (public.can_operate_deal(organization_id));
create policy history_member_select on public.deal_stage_history for select to authenticated using (public.is_active_member(organization_id));

revoke all on public.pipelines,public.pipeline_stages,public.deals,public.deal_stage_history from anon;
grant select,insert,update on public.pipelines,public.pipeline_stages,public.deals to authenticated;
grant select on public.deal_stage_history to authenticated;
revoke all on function public.can_manage_pipeline(uuid,uuid),public.can_operate_deal(uuid,uuid),public.seed_default_pipeline(uuid,uuid) from public;
grant execute on function public.can_manage_pipeline(uuid,uuid),public.can_operate_deal(uuid,uuid) to authenticated;
grant execute on function public.move_deal_stage(uuid,uuid,uuid,text),public.mark_deal_won(uuid,uuid),public.mark_deal_lost(uuid,text,text,uuid),public.reopen_deal(uuid,uuid,uuid),public.archive_deal(uuid) to authenticated;
