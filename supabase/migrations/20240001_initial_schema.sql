-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- STORES
-- ─────────────────────────────────────────
create table stores (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  code       text        unique not null,
  timezone   text        not null default 'America/New_York',
  is_active  boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
create table profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  full_name  text        not null,
  role       text        not null check (role in ('admin', 'employee')),
  store_id   uuid        references stores(id) on delete set null,
  is_active  boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- HELPER FUNCTION
-- ─────────────────────────────────────────
create or replace function is_admin()
returns boolean as $$
  select exists(
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
$$ language sql security definer;

alter table stores enable row level security;

-- All authenticated users can read active stores
create policy "Authenticated users can view active stores"
  on stores for select
  to authenticated
  using (is_active = true);

-- Only admins can insert stores
create policy "Admins can insert stores"
  on stores for insert
  to authenticated
  with check (is_admin());

-- Only admins can update stores
create policy "Admins can update stores"
  on stores for update
  to authenticated
  using (is_admin())
  with check (is_admin());

alter table profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on profiles for select
  to authenticated
  using (id = auth.uid());

-- Admins can read all profiles
create policy "Admins can view all profiles"
  on profiles for select
  to authenticated
  using (is_admin());

-- Admins can insert profiles
create policy "Admins can insert profiles"
  on profiles for insert
  to authenticated
  with check (is_admin());

-- Admins can update profiles
create policy "Admins can update profiles"
  on profiles for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ─────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGN-UP
-- ─────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, store_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'employee',
    null
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
