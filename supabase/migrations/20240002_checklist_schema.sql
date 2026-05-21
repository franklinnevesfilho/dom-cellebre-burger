-- ─────────────────────────────────────────
-- CHECKLISTS
-- ─────────────────────────────────────────
create table checklists (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text,
  is_active   boolean     not null default true,
  created_by  uuid        references auth.users(id) on delete set null,
  updated_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- CHECKLIST ITEMS
-- ─────────────────────────────────────────
create table checklist_items (
  id           uuid        primary key default gen_random_uuid(),
  checklist_id uuid        not null references checklists(id) on delete cascade,
  label        text        not null,
  sort_order   integer     not null default 0,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- CHECKLIST STORE ASSIGNMENTS
-- ─────────────────────────────────────────
create table checklist_store_assignments (
  id           uuid        primary key default gen_random_uuid(),
  checklist_id uuid        not null references checklists(id) on delete cascade,
  store_id     uuid        not null references stores(id) on delete cascade,
  assigned_at  timestamptz not null default now(),
  assigned_by  uuid        references auth.users(id) on delete set null,
  unique(checklist_id, store_id)
);

-- ─────────────────────────────────────────
-- RLS: checklists
-- ─────────────────────────────────────────
alter table checklists enable row level security;

create policy "Admins full access on checklists"
  on checklists for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Employees can view active checklists"
  on checklists for select
  to authenticated
  using (is_active = true);

-- ─────────────────────────────────────────
-- RLS: checklist_items
-- ─────────────────────────────────────────
alter table checklist_items enable row level security;

create policy "Admins full access on checklist_items"
  on checklist_items for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Employees can view active checklist_items"
  on checklist_items for select
  to authenticated
  using (is_active = true);

-- ─────────────────────────────────────────
-- RLS: checklist_store_assignments
-- ─────────────────────────────────────────
alter table checklist_store_assignments enable row level security;

create policy "Admins full access on checklist_store_assignments"
  on checklist_store_assignments for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Employees can view assignments for their store"
  on checklist_store_assignments for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.store_id = checklist_store_assignments.store_id
    )
  );
