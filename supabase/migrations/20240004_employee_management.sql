-- ─────────────────────────────────────────
-- EMPLOYEE MANAGEMENT
-- ─────────────────────────────────────────

-- 1. Add new columns to profiles
alter table profiles
  add column if not exists deleted_at  timestamptz default null,
  add column if not exists invited_at  timestamptz default null;

-- 2. Update handle_new_user trigger to read invite metadata
create or replace function handle_new_user()
returns trigger as $$
declare
  v_role     text;
  v_store_id uuid;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'employee');

  if (new.raw_user_meta_data->>'store_id') is not null
     and (new.raw_user_meta_data->>'store_id') <> '' then
    v_store_id := (new.raw_user_meta_data->>'store_id')::uuid;
  else
    v_store_id := null;
  end if;

  insert into public.profiles (id, full_name, role, store_id, invited_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    v_role,
    v_store_id,
    case when v_role = 'employee' then now() else null end
  );

  return new;
end;
$$ language plpgsql security definer;

-- 3. RLS: block soft-deleted users from reading their own profile
-- Drop the existing employee self-select policy and recreate it with the deleted_at guard
drop policy if exists "Users can view own profile" on profiles;

create policy "Users can view own profile"
  on profiles for select
  to authenticated
  using (id = auth.uid() and deleted_at is null);

-- Admins retain full access — no changes needed to "Admins can view all profiles"
-- (that policy uses is_admin() with no deleted_at filter, so admins always see everything)
