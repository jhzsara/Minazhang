-- MinaZhang backend schema. Run via Supabase migrations or SQL Editor.
-- Never store card numbers, CVVs, raw IBANs or passport images here.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Member',
 role text not null default 'subscriber' check (role in ('subscriber','admin')),
 age_verified boolean not null default false,
 verification_reference text,
 subscription_status text not null default 'inactive' check (subscription_status in ('inactive','trialing','active','past_due','canceled')),
 subscription_id text,
 trial_ends_at timestamptz,
 current_period_ends_at timestamptz,
 topic_preferences jsonb not null default '[]'::jsonb check (jsonb_typeof(topic_preferences)='array'),
 created_at timestamptz not null default now()
);
create table if not exists public.conversations (
 id uuid primary key default gen_random_uuid(),
 subscriber_id uuid not null unique references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.conversations(id) on delete cascade,
 sender_id uuid not null references public.profiles(id) on delete cascade,
 body text, image_url text, created_at timestamptz not null default now(),
 constraint message_has_content check (coalesce(length(trim(body)),0)>0 or image_url is not null)
);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id,created_at);
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'); $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,display_name) values(new.id,coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'Member')) on conflict(id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles for select using(id=auth.uid() or public.is_admin());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update using(public.is_admin()) with check(public.is_admin());
drop policy if exists conversation_select_participant_or_admin on public.conversations;
create policy conversation_select_participant_or_admin on public.conversations for select using(subscriber_id=auth.uid() or public.is_admin());
drop policy if exists conversation_insert_own on public.conversations;
create policy conversation_insert_own on public.conversations for insert with check(subscriber_id=auth.uid());
drop policy if exists messages_select_participant_or_admin on public.messages;
create policy messages_select_participant_or_admin on public.messages for select using(public.is_admin() or exists(select 1 from public.conversations c where c.id=conversation_id and c.subscriber_id=auth.uid()));
drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant on public.messages for insert with check(sender_id=auth.uid() and (public.is_admin() or exists(select 1 from public.conversations c where c.id=conversation_id and c.subscriber_id=auth.uid())));
drop policy if exists messages_delete_admin on public.messages;
create policy messages_delete_admin on public.messages for delete using(public.is_admin());
do $$ begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end $$;
