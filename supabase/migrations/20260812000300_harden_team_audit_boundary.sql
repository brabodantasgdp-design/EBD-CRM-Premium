create or replace function public.create_organization_invite(target_org uuid, target_email text, target_role text, target_token_hash text, target_expires_at timestamptz)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare new_id uuid;
begin
  if not public.can_manage_members(target_org) then raise exception 'permission denied'; end if;
  if target_role not in ('admin','manager','sales','viewer') or target_email is null or target_token_hash is null or target_expires_at <= now() then raise exception 'invite invalid'; end if;
  insert into public.organization_invites(organization_id, email, role, token_hash, invited_by, expires_at)
  values (target_org, lower(trim(target_email)), target_role, target_token_hash, auth.uid(), target_expires_at)
  returning id into new_id;
  perform public.create_audit_log(target_org, 'member.invited', 'organization_invite', new_id, jsonb_build_object('role', target_role, 'email', lower(trim(target_email))));
  return new_id;
end;
$$;

drop policy if exists organization_invites_admin_insert on public.organization_invites;
revoke insert on public.organization_invites from authenticated;
revoke execute on function public.create_audit_log(uuid, text, text, uuid, jsonb) from authenticated;
grant execute on function public.create_organization_invite(uuid, text, text, text, timestamptz) to authenticated;
