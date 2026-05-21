-- Local development auth seed data
with seed_users as (
  select *
  from (
    values
      (
        '11111111-1111-4111-8111-111111111111'::uuid,
        '33333333-3333-4333-8333-333333333333'::uuid,
        'admin@test.com'::text,
        'Admin1234!'::text,
        'Admin User'::text,
        'admin'::text,
        '+15550000001'::text
      ),
      (
        '22222222-2222-4222-8222-222222222222'::uuid,
        '44444444-4444-4444-8444-444444444444'::uuid,
        'employee@test.com'::text,
        'Employee1234!'::text,
        'Employee User'::text,
        'employee'::text,
        '+15550000002'::text
      )
  ) as s (user_id, identity_id, email, plain_password, full_name, profile_role, phone_number)
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  phone,
  phone_change,
  phone_change_token,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  s.user_id,
  'authenticated',
  'authenticated',
  s.email,
  crypt(s.plain_password, gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  s.phone_number,
  '',
  '',
  '',
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  jsonb_build_object('full_name', s.full_name),
  now(),
  now()
from seed_users s
where not exists (
  select 1
  from auth.users u
  where u.id = s.user_id
     or lower(u.email) = lower(s.email)
);

with seed_users as (
  select *
  from (
    values
      (
        '11111111-1111-4111-8111-111111111111'::uuid,
        '33333333-3333-4333-8333-333333333333'::uuid,
        'admin@test.com'::text,
        'Admin User'::text
      ),
      (
        '22222222-2222-4222-8222-222222222222'::uuid,
        '44444444-4444-4444-8444-444444444444'::uuid,
        'employee@test.com'::text,
        'Employee User'::text
      )
  ) as s (user_id, identity_id, email, full_name)
)
insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  s.identity_id,
  s.user_id,
  s.user_id::text,
  jsonb_build_object(
    'sub', s.user_id::text,
    'email', s.email,
    'email_verified', true,
    'full_name', s.full_name
  ),
  'email',
  now(),
  now(),
  now()
from seed_users s
where exists (
  select 1
  from auth.users u
  where u.id = s.user_id
)
and not exists (
  select 1
  from auth.identities i
  where i.provider = 'email'
    and i.provider_id = s.user_id::text
);

with seed_profiles as (
  select *
  from (
    values
      (
        '11111111-1111-4111-8111-111111111111'::uuid,
        'Admin User'::text,
        'admin'::text
      ),
      (
        '22222222-2222-4222-8222-222222222222'::uuid,
        'Employee User'::text,
        'employee'::text
      )
  ) as s (user_id, full_name, profile_role)
)
insert into public.profiles (
  id,
  full_name,
  role,
  is_active
)
select
  s.user_id,
  s.full_name,
  s.profile_role,
  true
from seed_profiles s
join auth.users u on u.id = s.user_id
on conflict (id) do update
set
  full_name = excluded.full_name,
  role = excluded.role,
  is_active = excluded.is_active;
