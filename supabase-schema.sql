-- MinaZhang backend schema. Run via Supabase migrations or SQL Editor.
-- Never store real card numbers, CVVs, raw IBANs or passport images here.
-- The demo_payment_submissions table below is limited by CHECK constraints to fixed synthetic test values only.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Member',
 birth_date date,
 country text,
 address_line text,
 role text not null default 'subscriber' check (role in ('subscriber','admin')),
 age_verified boolean not null default false,
 verification_completed boolean not null default false,
 verification_completed_at timestamptz,
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

-- Verification gate: validates 18+ and updates only the authenticated member's profile.
create or replace function public.complete_profile_verification(p_display_name text,p_birth_date date,p_country text,p_address_line text) returns public.profiles language plpgsql security definer set search_path=public as $$ declare result public.profiles; begin if auth.uid() is null then raise exception 'Not authenticated'; end if; if p_display_name is null or length(trim(p_display_name))<2 then raise exception 'Please enter your name'; end if; if p_birth_date is null or p_birth_date > (current_date - interval '18 years')::date then raise exception 'You must be 18 or older'; end if; if p_country is null or length(trim(p_country))<2 then raise exception 'Please select your country'; end if; if p_address_line is null or length(trim(p_address_line))<5 then raise exception 'Please enter your address'; end if; update public.profiles set display_name=trim(p_display_name),birth_date=p_birth_date,country=trim(p_country),address_line=trim(p_address_line),age_verified=true,verification_completed=true,verification_completed_at=now() where id=auth.uid() returning * into result; return result; end; $$;
revoke all on function public.complete_profile_verification(text,date,text,text) from public; grant execute on function public.complete_profile_verification(text,date,text,text) to authenticated;

-- Fake payment storage test. This intentionally cannot store arbitrary or real card/CVV values.
create table if not exists public.demo_payment_submissions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 test_card_number text not null check (test_card_number = '4242424242424242'),
 test_cvv text not null check (test_cvv = '123'),
 test_expiry text not null check (test_expiry = '12/34'),
 created_at timestamptz not null default now()
);
create index if not exists demo_payment_submissions_user_created_idx on public.demo_payment_submissions(user_id,created_at desc);
alter table public.demo_payment_submissions enable row level security;
drop policy if exists demo_payment_insert_own on public.demo_payment_submissions;
create policy demo_payment_insert_own on public.demo_payment_submissions for insert to authenticated with check (user_id=auth.uid());
drop policy if exists demo_payment_select_admin on public.demo_payment_submissions;
create policy demo_payment_select_admin on public.demo_payment_submissions for select to authenticated using (public.is_admin());
drop policy if exists demo_payment_delete_admin on public.demo_payment_submissions;
create policy demo_payment_delete_admin on public.demo_payment_submissions for delete to authenticated using (public.is_admin());
grant insert,select on public.demo_payment_submissions to authenticated;
