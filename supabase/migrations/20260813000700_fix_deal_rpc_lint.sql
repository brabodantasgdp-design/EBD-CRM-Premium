create or replace function public.reopen_deal(target_deal uuid, target_pipeline uuid, target_stage uuid)
returns public.deals language plpgsql security definer set search_path = pg_catalog, public as $$
declare d public.deals; s public.pipeline_stages; actor uuid := auth.uid(); result public.deals;
begin
  select * into d from public.deals where id=target_deal for update;
  if not found or not public.can_operate_deal(d.organization_id,actor) then raise exception 'deal access denied'; end if;
  select * into s from public.pipeline_stages where id=target_stage and pipeline_id=target_pipeline and stage_type='open' and archived_at is null;
  if s.id is null then raise exception 'open stage not found'; end if;
  update public.deals set status='open', won_at=null, lost_at=null, loss_reason=null, loss_note=null where id=d.id;
  result := public.move_deal_stage(d.id,target_pipeline,target_stage,'Negócio reaberto');
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,metadata) values(d.organization_id,actor,'deal.reopened','deal',d.id,'{}'::jsonb);
  return result;
end; $$;
