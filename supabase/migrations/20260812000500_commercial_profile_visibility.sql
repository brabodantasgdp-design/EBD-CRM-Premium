create or replace function public.can_view_profile(target_user uuid, viewer uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.organization_members target_member
    join public.organization_members viewer_member
      on viewer_member.organization_id = target_member.organization_id
    join public.organizations o on o.id = target_member.organization_id
    where target_member.user_id = target_user
      and viewer_member.user_id = viewer
      and target_member.status = 'active'
      and viewer_member.status = 'active'
      and o.status = 'active'
  );
$$;

drop policy if exists profiles_organization_member_select on public.profiles;
create policy profiles_organization_member_select on public.profiles for select to authenticated using (public.can_view_profile(id));

revoke all on function public.can_view_profile(uuid, uuid) from public;
grant execute on function public.can_view_profile(uuid, uuid) to authenticated;
