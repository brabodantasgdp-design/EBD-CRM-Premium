create or replace function public.guard_deal_transition()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'open' then raise exception 'new deals must start open'; end if;
  elsif (new.pipeline_id is distinct from old.pipeline_id or new.stage_id is distinct from old.stage_id or new.status is distinct from old.status or new.probability is distinct from old.probability or new.won_at is distinct from old.won_at or new.lost_at is distinct from old.lost_at)
    and current_setting('app.deal_transition', true) <> 'on' then
    raise exception 'deal stage transitions must use the authorized RPC';
  end if;
  return new;
end; $$;

drop trigger if exists deals_guard_transition on public.deals;
create trigger deals_guard_transition before insert or update on public.deals for each row execute function public.guard_deal_transition();

create or replace function public.move_deal_stage(target_deal uuid, target_pipeline uuid, target_stage uuid, target_note text default null)
returns public.deals language plpgsql security definer set search_path = pg_catalog, public as $$
declare current_deal public.deals; next_stage public.pipeline_stages; actor uuid := auth.uid(); old_pipeline uuid; old_stage uuid;
begin
  select * into current_deal from public.deals where id=target_deal and organization_id in (select organization_id from public.organization_members where user_id=actor and status='active') for update;
  if not found or not public.can_operate_deal(current_deal.organization_id, actor) then raise exception 'deal access denied'; end if;
  select * into next_stage from public.pipeline_stages where id=target_stage and pipeline_id=target_pipeline and organization_id=current_deal.organization_id and archived_at is null;
  if not found then raise exception 'stage access denied'; end if;
  old_pipeline := current_deal.pipeline_id; old_stage := current_deal.stage_id;
  perform set_config('app.deal_transition','on',true);
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

create or replace function public.reopen_deal(target_deal uuid, target_pipeline uuid, target_stage uuid)
returns public.deals language plpgsql security definer set search_path = pg_catalog, public as $$
declare d public.deals; s public.pipeline_stages; actor uuid := auth.uid(); result public.deals;
begin
  select * into d from public.deals where id=target_deal for update;
  if not found or not public.can_operate_deal(d.organization_id,actor) then raise exception 'deal access denied'; end if;
  select * into s from public.pipeline_stages where id=target_stage and pipeline_id=target_pipeline and stage_type='open' and archived_at is null;
  if s.id is null then raise exception 'open stage not found'; end if;
  perform set_config('app.deal_transition','on',true);
  update public.deals set status='open', won_at=null, lost_at=null, loss_reason=null, loss_note=null where id=d.id;
  result := public.move_deal_stage(d.id,target_pipeline,target_stage,'Negócio reaberto');
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,metadata) values(d.organization_id,actor,'deal.reopened','deal',d.id,'{}'::jsonb);
  return result;
end; $$;
