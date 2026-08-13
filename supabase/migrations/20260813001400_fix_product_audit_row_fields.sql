create or replace function public.audit_products_proposals()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare action_name text; entity_name text; actor uuid; new_row jsonb;
begin
  entity_name := case when tg_table_name = 'products' then 'product' else 'proposal' end;
  actor := auth.uid();
  if actor is null then raise exception 'authenticated actor required'; end if;
  new_row := to_jsonb(new);
  if tg_op = 'INSERT' then action_name := entity_name || '.created';
  elsif tg_table_name = 'products' and old.archived_at is distinct from new.archived_at and new.archived_at is not null then action_name := 'product.archived';
  elsif tg_table_name = 'proposals' and old.archived_at is distinct from new.archived_at and new.archived_at is not null then action_name := 'proposal.archived';
  elsif tg_table_name = 'proposals' and old.status is distinct from new.status then action_name := 'proposal.' || new.status;
  else action_name := entity_name || '.updated'; end if;
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values(new.organization_id, actor, action_name, entity_name, new.id, jsonb_build_object('status', new_row->>'status', 'number', new_row->>'number'));
  return new;
end; $$;
