create or replace function public.replace_proposal_items(target_org uuid, target_proposal uuid, target_items jsonb)
returns public.proposals language plpgsql security definer set search_path = pg_catalog, public as $$
declare proposal_row public.proposals; item jsonb; product_row public.products; item_qty numeric; item_price numeric; item_discount numeric; line_total numeric; subtotal_value numeric := 0;
begin
  if auth.uid() is null or not public.can_write_commercial(target_org, auth.uid()) then raise exception 'organization access denied'; end if;
  select * into proposal_row from public.proposals where id=target_proposal and organization_id=target_org and archived_at is null for update;
  if proposal_row.id is null then raise exception 'proposal not found'; end if;
  delete from public.proposal_items where proposal_id=target_proposal and organization_id=target_org;
  for item in select * from jsonb_array_elements(coalesce(target_items,'[]'::jsonb)) loop
    item_qty := greatest(coalesce((item->>'quantity')::numeric,1),0.001); item_discount := greatest(coalesce((item->>'discount')::numeric,0),0);
    if nullif(item->>'product_id','') is not null then
      select * into product_row from public.products where id=(item->>'product_id')::uuid and organization_id=target_org and archived_at is null;
      if product_row.id is null then raise exception 'product does not belong to organization'; end if;
      item_price := coalesce((item->>'unit_price')::numeric,product_row.unit_price);
    else item_price := greatest(coalesce((item->>'unit_price')::numeric,0),0); end if;
    line_total := greatest(round(item_qty * item_price - item_discount, 2),0); subtotal_value := subtotal_value + line_total;
    insert into public.proposal_items(organization_id,proposal_id,product_id,description,quantity,unit_price,discount,line_total,position)
      values(target_org,target_proposal,nullif(item->>'product_id','')::uuid,coalesce(nullif(item->>'description',''),case when product_row.id is null then 'Item' else product_row.name end),item_qty,item_price,item_discount,line_total,coalesce((item->>'position')::int,0));
  end loop;
  update public.proposals set subtotal=round(subtotal_value,2), total=greatest(round(subtotal_value - discount,2),0) where id=target_proposal returning * into proposal_row;
  return proposal_row;
end; $$;
revoke all on function public.replace_proposal_items(uuid,uuid,jsonb) from public;
grant execute on function public.replace_proposal_items(uuid,uuid,jsonb) to authenticated;
