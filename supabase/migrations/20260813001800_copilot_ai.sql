create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  feature text not null check (feature in ('chat','summary','next_steps','closing_strategy','risk_analysis','lead_score','draft')),
  entity_type text check (entity_type in ('lead','contact','company','deal')),
  entity_id uuid,
  provider text not null,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  status text not null check (status in ('success','failed','rate_limited','timeout')),
  latency_ms integer,
  context_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  title text,
  entity_type text check (entity_type in ('lead','contact','company','deal')),
  entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('user','assistant','system')),
  content text not null check (length(trim(content)) > 0),
  entity_type text check (entity_type in ('lead','contact','company','deal')),
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_org_created_idx on public.ai_usage_logs(organization_id, created_at desc);
create index if not exists ai_usage_user_created_idx on public.ai_usage_logs(organization_id, user_id, created_at desc);
create index if not exists ai_conversations_org_updated_idx on public.ai_conversations(organization_id, updated_at desc);
create index if not exists ai_messages_conversation_created_idx on public.ai_messages(conversation_id, created_at desc);

create or replace function public.ai_conversation_touch()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin update public.ai_conversations set updated_at = now() where id = new.conversation_id; return new; end; $$;
drop trigger if exists ai_messages_touch_conversation on public.ai_messages;
create trigger ai_messages_touch_conversation after insert on public.ai_messages for each row execute function public.ai_conversation_touch();

alter table public.ai_usage_logs enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

drop policy if exists ai_usage_member_select on public.ai_usage_logs;
create policy ai_usage_member_select on public.ai_usage_logs for select to authenticated using (public.is_active_member(organization_id));
drop policy if exists ai_usage_member_insert on public.ai_usage_logs;
create policy ai_usage_member_insert on public.ai_usage_logs for insert to authenticated with check (public.is_active_member(organization_id) and user_id = (select auth.uid()));
drop policy if exists ai_conversations_member_all on public.ai_conversations;
create policy ai_conversations_member_all on public.ai_conversations for all to authenticated using (public.is_active_member(organization_id) and user_id = (select auth.uid())) with check (public.is_active_member(organization_id) and user_id = (select auth.uid()));
drop policy if exists ai_messages_member_all on public.ai_messages;
create policy ai_messages_member_all on public.ai_messages for all to authenticated using (public.is_active_member(organization_id) and user_id = (select auth.uid())) with check (public.is_active_member(organization_id) and user_id = (select auth.uid()) and exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.organization_id = ai_messages.organization_id and c.user_id = (select auth.uid())));

revoke all on public.ai_usage_logs, public.ai_conversations, public.ai_messages from anon;
grant select, insert on public.ai_usage_logs to authenticated;
grant select, insert, update on public.ai_conversations to authenticated;
grant select, insert on public.ai_messages to authenticated;
