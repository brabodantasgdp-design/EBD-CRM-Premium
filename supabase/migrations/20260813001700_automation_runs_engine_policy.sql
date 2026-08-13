drop policy if exists automation_runs_engine_insert on public.automation_runs;
create policy automation_runs_engine_insert on public.automation_runs for insert to authenticated
with check (
  public.is_active_member(organization_id)
  and exists (select 1 from public.automations a where a.id = automation_id and a.organization_id = automation_runs.organization_id)
);

drop policy if exists automation_runs_engine_update on public.automation_runs;
create policy automation_runs_engine_update on public.automation_runs for update to authenticated
using (public.is_active_member(organization_id))
with check (public.is_active_member(organization_id));

grant insert, update on public.automation_runs to authenticated;
