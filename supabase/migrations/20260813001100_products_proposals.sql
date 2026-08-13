create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  sku text,
  unit text not null default 'un',
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  cost_price numeric(14,2) check (cost_price is null or cost_price >= 0),
  status text not null default 'active' check (status in ('active','inactive')),
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index if not exists products_org_sku_unique on public.products(organization_id, lower(sku)) where sku is not null and archived_at is null;
create index if not exists products_org_idx on public.products(organization_id);
create index if not exists products_status_idx on public.products(organization_id, status) where archived_at is null;
create index if not exists products_name_idx on public.products(organization_id, lower(name)) where archived_at is null;

create table if not exists public.proposal_number_counters (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  next_number bigint not null default 1
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete restrict,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  number text not null,
  title text not null check (length(trim(title)) > 0),
  status text not null default 'draft' check (status in ('draft','sent','accepted','rejected','expired','cancelled')),
  currency text not null default 'BRL',
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  discount numeric(14,2) not null default 0 check (discount >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  valid_until date,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint proposals_org_number_unique unique (organization_id, number)
);

create table if not exists public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text not null check (length(trim(description)) > 0),
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  discount numeric(14,2) not null default 0 check (discount >= 0),
  line_total numeric(14,2) not null check (line_total >= 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposals_org_idx on public.proposals(organization_id, created_at desc) where archived_at is null;
create index if not exists proposals_deal_idx on public.proposals(organization_id, deal_id) where archived_at is null;
create index if not exists proposal_items_proposal_idx on public.proposal_items(organization_id, proposal_id, position);
create index if not exists proposal_items_product_idx on public.proposal_items(organization_id, product_id);

create or replace function public.validate_product_proposal_links()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if tg_table_name = 'proposals' then
    if not exists (select 1 from public.deals d where d.id = new.deal_id and d.organization_id = new.organization_id) then raise exception 'deal does not belong to organization'; end if;
    if new.company_id is not null and not exists (select 1 from public.companies c where c.id = new.company_id and c.organization_id = new.organization_id) then raise exception 'company does not belong to organization'; end if;
    if new.contact_id is not null and not exists (select 1 from public.contacts c where c.id = new.contact_id and c.organization_id = new.organization_id) then raise exception 'contact does not belong to organization'; end if;
  elsif tg_table_name = 'proposal_items' then
    if not exists (select 1 from public.proposals p where p.id = new.proposal_id and p.organization_id = new.organization_id) then raise exception 'proposal does not belong to organization'; end if;
    if new.product_id is not null and not exists (select 1 from public.products p where p.id = new.product_id and p.organization_id = new.organization_id) then raise exception 'product does not belong to organization'; end if;
  end if;
  return new;
end; $$;

create or replace function public.audit_products_proposals()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare action_name text; entity_name text;
begin
  entity_name := case when tg_table_name = 'products' then 'product' else 'proposal' end;
  if tg_op = 'INSERT' then action_name := entity_name || '.created';
  elsif tg_table_name = 'products' and old.archived_at is distinct from new.archived_at and new.archived_at is not null then action_name := 'product.archived';
  elsif tg_table_name = 'proposals' and old.archived_at is distinct from new.archived_at and new.archived_at is not null then action_name := 'proposal.archived';
  elsif tg_table_name = 'proposals' and old.status is distinct from new.status then action_name := 'proposal.' || new.status;
  else action_name := entity_name || '.updated'; end if;
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values(new.organization_id, coalesce(auth.uid(), new.created_by), action_name, entity_name, new.id, jsonb_build_object('status', coalesce(new.status, null), 'number', coalesce(new.number, null)));
  return new;
end; $$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists proposals_set_updated_at on public.proposals;
create trigger proposals_set_updated_at before update on public.proposals for each row execute function public.set_updated_at();
drop trigger if exists proposal_items_set_updated_at on public.proposal_items;
create trigger proposal_items_set_updated_at before update on public.proposal_items for each row execute function public.set_updated_at();
drop trigger if exists proposals_validate_links on public.proposals;
create trigger proposals_validate_links before insert or update on public.proposals for each row execute function public.validate_product_proposal_links();
drop trigger if exists proposal_items_validate_links on public.proposal_items;
create trigger proposal_items_validate_links before insert or update on public.proposal_items for each row execute function public.validate_product_proposal_links();
drop trigger if exists products_audit_change on public.products;
create trigger products_audit_change after insert or update on public.products for each row execute function public.audit_products_proposals();
drop trigger if exists proposals_audit_change on public.proposals;
create trigger proposals_audit_change after insert or update on public.proposals for each row execute function public.audit_products_proposals();

create or replace function public.create_proposal(
  target_org uuid, target_deal uuid, target_title text, target_currency text, target_valid_until date,
  target_notes text, target_discount numeric, target_company uuid default null, target_contact uuid default null, target_items jsonb default '[]'::jsonb
) returns public.proposals language plpgsql security invoker set search_path = pg_catalog, public as $$
declare proposal_row public.proposals; item jsonb; product_row public.products; item_qty numeric; item_price numeric; item_discount numeric; line_total numeric; subtotal_value numeric := 0; number_value bigint;
begin
  if not public.can_write_commercial(target_org) then raise exception 'organization access denied'; end if;
  if not exists (select 1 from public.deals where id=target_deal and organization_id=target_org and archived_at is null) then raise exception 'deal does not belong to organization'; end if;
  insert into public.proposal_number_counters(organization_id) values(target_org) on conflict (organization_id) do nothing;
  select next_number into number_value from public.proposal_number_counters where organization_id=target_org for update;
  update public.proposal_number_counters set next_number=next_number+1 where organization_id=target_org;
  insert into public.proposals(organization_id, deal_id, company_id, contact_id, number, title, currency, valid_until, notes, discount, created_by)
    select target_org, d.id, coalesce(target_company,d.company_id), coalesce(target_contact,d.contact_id), 'PROP-' || lpad(number_value::text,6,'0'), trim(target_title), coalesce(nullif(target_currency,''),'BRL'), target_valid_until, target_notes, greatest(coalesce(target_discount,0),0), auth.uid()
    from public.deals d where d.id=target_deal and d.organization_id=target_org returning * into proposal_row;
  if proposal_row.id is null then raise exception 'could not create proposal'; end if;
  for item in select * from jsonb_array_elements(target_items) loop
    item_qty := greatest(coalesce((item->>'quantity')::numeric,1),0.001); item_discount := greatest(coalesce((item->>'discount')::numeric,0),0);
    if nullif(item->>'product_id','') is not null then
      select * into product_row from public.products where id=(item->>'product_id')::uuid and organization_id=target_org and archived_at is null;
      if product_row.id is null then raise exception 'product does not belong to organization'; end if;
      item_price := coalesce((item->>'unit_price')::numeric,product_row.unit_price);
    else item_price := greatest(coalesce((item->>'unit_price')::numeric,0),0); end if;
    line_total := greatest(round(item_qty * item_price - item_discount, 2),0); subtotal_value := subtotal_value + line_total;
    insert into public.proposal_items(organization_id,proposal_id,product_id,description,quantity,unit_price,discount,line_total,position)
      values(target_org,proposal_row.id,nullif(item->>'product_id','')::uuid,coalesce(nullif(item->>'description',''),product_row.name,'Item'),item_qty,item_price,item_discount,line_total,coalesce((item->>'position')::int,0));
  end loop;
  update public.proposals set subtotal=round(subtotal_value,2), total=greatest(round(subtotal_value - discount,2),0) where id=proposal_row.id returning * into proposal_row;
  return proposal_row;
end; $$;

alter table public.products enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_items enable row level security;
drop policy if exists products_member_select on public.products;
create policy products_member_select on public.products for select to authenticated using (public.is_active_member(organization_id));
drop policy if exists products_operator_insert on public.products;
create policy products_operator_insert on public.products for insert to authenticated with check (public.can_write_commercial(organization_id));
drop policy if exists products_operator_update on public.products;
create policy products_operator_update on public.products for update to authenticated using (public.can_write_commercial(organization_id)) with check (public.can_write_commercial(organization_id));
drop policy if exists proposals_member_select on public.proposals;
create policy proposals_member_select on public.proposals for select to authenticated using (public.is_active_member(organization_id));
drop policy if exists proposals_operator_insert on public.proposals;
create policy proposals_operator_insert on public.proposals for insert to authenticated with check (public.can_write_commercial(organization_id) and created_by=(select auth.uid()));
drop policy if exists proposals_operator_update on public.proposals;
create policy proposals_operator_update on public.proposals for update to authenticated using (public.can_write_commercial(organization_id)) with check (public.can_write_commercial(organization_id));
drop policy if exists proposal_items_member_select on public.proposal_items;
create policy proposal_items_member_select on public.proposal_items for select to authenticated using (public.is_active_member(organization_id));
drop policy if exists proposal_items_operator_insert on public.proposal_items;
create policy proposal_items_operator_insert on public.proposal_items for insert to authenticated with check (public.can_write_commercial(organization_id));
drop policy if exists proposal_items_operator_update on public.proposal_items;
create policy proposal_items_operator_update on public.proposal_items for update to authenticated using (public.can_write_commercial(organization_id)) with check (public.can_write_commercial(organization_id));
revoke all on public.products, public.proposals, public.proposal_items, public.proposal_number_counters from anon;
grant select, insert, update on public.products, public.proposals, public.proposal_items to authenticated;
revoke all on public.proposal_number_counters from authenticated, anon;
revoke all on function public.create_proposal(uuid,uuid,text,text,date,text,numeric,uuid,uuid,jsonb) from public;
grant execute on function public.create_proposal(uuid,uuid,text,text,date,text,numeric,uuid,uuid,jsonb) to authenticated;
