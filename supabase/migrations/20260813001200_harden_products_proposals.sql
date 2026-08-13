create or replace function public.create_proposal(
  target_org uuid, target_deal uuid, target_title text, target_currency text, target_valid_until date,
  target_notes text, target_discount numeric, target_company uuid default null, target_contact uuid default null, target_items jsonb default '[]'::jsonb
) returns public.proposals language plpgsql security definer set search_path = pg_catalog, public as $$
declare proposal_row public.proposals; item jsonb; product_row public.products; item_qty numeric; item_price numeric; item_discount numeric; line_total numeric; subtotal_value numeric := 0; number_value bigint;
begin
  if auth.uid() is null or not public.can_write_commercial(target_org, auth.uid()) then raise exception 'organization access denied'; end if;
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
      values(target_org,proposal_row.id,nullif(item->>'product_id','')::uuid,coalesce(nullif(item->>'description',''),case when product_row.id is null then 'Item' else product_row.name end),item_qty,item_price,item_discount,line_total,coalesce((item->>'position')::int,0));
  end loop;
  update public.proposals set subtotal=round(subtotal_value,2), total=greatest(round(subtotal_value - discount,2),0) where id=proposal_row.id returning * into proposal_row;
  return proposal_row;
end; $$;
revoke all on function public.create_proposal(uuid,uuid,text,text,date,text,numeric,uuid,uuid,jsonb) from public;
grant execute on function public.create_proposal(uuid,uuid,text,text,date,text,numeric,uuid,uuid,jsonb) to authenticated;

create or replace function public.guard_proposal_status()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status and not (
    (old.status='draft' and new.status in ('sent','cancelled')) or
    (old.status='sent' and new.status in ('accepted','rejected','cancelled')) or
    (old.status=new.status)
  ) then raise exception 'invalid proposal status transition'; end if;
  return new;
end; $$;
drop trigger if exists proposals_status_guard on public.proposals;
create trigger proposals_status_guard before update on public.proposals for each row execute function public.guard_proposal_status();
