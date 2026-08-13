create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  company_name text,
  email text,
  phone text,
  status text not null default 'new' check (status in ('new','contacted','qualified','nurturing','disqualified','converted')),
  source text,
  owner_id uuid references auth.users(id) on delete set null,
  score integer check (score between 0 and 100),
  temperature text,
  tags text[] not null default '{}',
  custom_fields jsonb not null default '{}'::jsonb,
  converted_at timestamptz,
  converted_contact_id uuid,
  converted_company_id uuid,
  converted_deal_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint leads_id_organization_unique unique (id, organization_id),
  constraint leads_converted_links_same_org check (
    (status <> 'converted' and converted_at is null and converted_contact_id is null and converted_company_id is null and converted_deal_id is null)
    or (status = 'converted' and converted_at is not null and converted_contact_id is not null and converted_company_id is not null and converted_deal_id is not null)
  )
);

create index if not exists leads_organization_created_idx on public.leads(organization_id, created_at desc) where archived_at is null;
create index if not exists leads_organization_status_idx on public.leads(organization_id, status) where archived_at is null;
create index if not exists leads_organization_email_idx on public.leads(organization_id, lower(email)) where email is not null and archived_at is null;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads for each row execute function public.set_updated_at();

create or replace function public.can_operate_lead(target_organization uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
    where m.organization_id=target_organization and m.user_id=target_user and m.status='active' and o.status='active'
      and m.role in ('owner','admin','manager','sales'));
$$;

create or replace function public.audit_lead_change()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare action_name text;
begin
  if tg_op='INSERT' then action_name := 'lead.created';
  elsif new.archived_at is distinct from old.archived_at and new.archived_at is not null then action_name := 'lead.archived';
  elsif new.status='converted' and old.status is distinct from new.status then action_name := 'lead.converted';
  else action_name := 'lead.updated'; end if;
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values(new.organization_id, coalesce(auth.uid(), new.created_by), action_name, 'lead', new.id,
      case when action_name='lead.converted' then jsonb_build_object('contact_id',new.converted_contact_id,'company_id',new.converted_company_id,'deal_id',new.converted_deal_id) else '{}'::jsonb end);
  return new;
end; $$;

drop trigger if exists leads_audit_change on public.leads;
create trigger leads_audit_change after insert or update on public.leads for each row execute function public.audit_lead_change();

create or replace function public.guard_lead_conversion()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if old.status = 'converted' and (new.status is distinct from old.status or new.converted_contact_id is distinct from old.converted_contact_id or new.converted_company_id is distinct from old.converted_company_id or new.converted_deal_id is distinct from old.converted_deal_id) then
    raise exception 'converted lead is immutable';
  end if;
  if old.status <> 'converted' and new.status = 'converted' and current_setting('app.lead_conversion', true) <> 'true' then
    raise exception 'lead conversion must use convert_lead';
  end if;
  return new;
end; $$;
drop trigger if exists leads_guard_conversion on public.leads;
create trigger leads_guard_conversion before update on public.leads for each row execute function public.guard_lead_conversion();

create or replace function public.convert_lead(
  target_lead uuid,
  target_pipeline uuid,
  target_stage uuid,
  target_company_name text default null,
  target_contact_name text default null,
  target_deal_name text default null,
  target_value numeric default 0
)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare l public.leads; c public.companies; ct public.contacts; d public.deals; p public.pipelines; s public.pipeline_stages; actor uuid := auth.uid();
begin
  select * into l from public.leads where id=target_lead for update;
  if not found or not public.can_operate_lead(l.organization_id, actor) then raise exception 'lead access denied'; end if;
  if l.status='converted' or l.converted_at is not null then raise exception 'lead already converted'; end if;
  select * into p from public.pipelines where id=target_pipeline and organization_id=l.organization_id and archived_at is null;
  if not found then raise exception 'pipeline access denied'; end if;
  select * into s from public.pipeline_stages where id=target_stage and pipeline_id=p.id and organization_id=l.organization_id and archived_at is null and stage_type='open';
  if not found then raise exception 'stage access denied'; end if;

  select * into c from public.companies where organization_id=l.organization_id and archived_at is null and lower(name)=lower(coalesce(nullif(trim(target_company_name),''),nullif(trim(l.company_name),''))) limit 1 for update;
  if not found then
    insert into public.companies(organization_id,name,source,owner_id,created_by) values(l.organization_id,coalesce(nullif(trim(target_company_name),''),nullif(trim(l.company_name),''),'Empresa do Lead'), 'Conversão de Lead', l.owner_id, actor) returning * into c;
  end if;

  select * into ct from public.contacts where organization_id=l.organization_id and archived_at is null and ((l.email is not null and lower(email)=lower(l.email)) or (l.phone is not null and phone=l.phone)) limit 1 for update;
  if not found then
    insert into public.contacts(organization_id,first_name,last_name,full_name,email,phone,company_id,source,owner_id,created_by)
      values(l.organization_id,split_part(coalesce(nullif(trim(target_contact_name),''),l.name),' ',1),null,coalesce(nullif(trim(target_contact_name),''),l.name),l.email,l.phone,c.id,'Conversão de Lead',l.owner_id,actor) returning * into ct;
  elsif ct.company_id is null then
    update public.contacts set company_id=c.id where id=ct.id returning * into ct;
  end if;

  insert into public.deals(organization_id,name,company_id,contact_id,pipeline_id,stage_id,owner_id,value,currency,probability,status,created_by)
    values(l.organization_id,coalesce(nullif(trim(target_deal_name),''),'Negócio de '||l.name),c.id,ct.id,p.id,s.id,l.owner_id,coalesce(target_value,0),'BRL',s.probability,'open',actor) returning * into d;
  perform set_config('app.lead_conversion','true',true);
  update public.leads set status='converted', converted_at=now(), converted_contact_id=ct.id, converted_company_id=c.id, converted_deal_id=d.id where id=l.id;
  return jsonb_build_object('lead_id',l.id,'company_id',c.id,'contact_id',ct.id,'deal_id',d.id);
end; $$;

alter table public.leads enable row level security;
create policy leads_member_select on public.leads for select to authenticated using (public.is_active_member(organization_id));
create policy leads_operator_insert on public.leads for insert to authenticated with check (public.can_operate_lead(organization_id) and created_by=auth.uid());
create policy leads_operator_update on public.leads for update to authenticated using (public.can_operate_lead(organization_id)) with check (public.can_operate_lead(organization_id));
revoke all on public.leads from anon;
grant select,insert,update on public.leads to authenticated;
revoke all on function public.can_operate_lead(uuid,uuid), public.convert_lead(uuid,uuid,uuid,text,text,text,numeric) from public;
grant execute on function public.can_operate_lead(uuid,uuid) to authenticated;
grant execute on function public.convert_lead(uuid,uuid,uuid,text,text,text,numeric) to authenticated;
