-- ─────────────────────────────────────────
-- CHECKLIST SESSIONS
-- ─────────────────────────────────────────
create table checklist_sessions (
  id            uuid        primary key default gen_random_uuid(),
  store_id      uuid        not null references stores(id) on delete cascade,
  checklist_id  uuid        not null references checklists(id) on delete cascade,
  session_date  date        not null,
  status        text        not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  started_at    timestamptz,
  completed_at  timestamptz,
  created_by    uuid        references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(store_id, checklist_id, session_date)
);

-- ─────────────────────────────────────────
-- CHECKLIST ITEM CHECKS
-- ─────────────────────────────────────────
create table checklist_item_checks (
  id                uuid        primary key default gen_random_uuid(),
  session_id        uuid        not null references checklist_sessions(id) on delete cascade,
  checklist_item_id uuid        not null references checklist_items(id) on delete cascade,
  is_checked        boolean     not null default false,
  checked_at        timestamptz,
  checked_by        uuid        references auth.users(id) on delete set null,
  updated_at        timestamptz not null default now(),
  unique(session_id, checklist_item_id)
);

-- ─────────────────────────────────────────
-- RLS: checklist_sessions
-- ─────────────────────────────────────────
alter table checklist_sessions enable row level security;

create policy "Admins full access on checklist_sessions"
  on checklist_sessions for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Employees can view sessions for their store"
  on checklist_sessions for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.store_id = checklist_sessions.store_id
    )
  );

create policy "Employees can insert sessions for their store"
  on checklist_sessions for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.store_id = checklist_sessions.store_id
    )
  );

create policy "Employees can update sessions for their store"
  on checklist_sessions for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.store_id = checklist_sessions.store_id
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.store_id = checklist_sessions.store_id
    )
  );

-- ─────────────────────────────────────────
-- RLS: checklist_item_checks
-- ─────────────────────────────────────────
alter table checklist_item_checks enable row level security;

create policy "Admins full access on checklist_item_checks"
  on checklist_item_checks for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Employees can view checks for their store sessions"
  on checklist_item_checks for select
  to authenticated
  using (
    exists (
      select 1 from checklist_sessions cs
      join profiles p on p.id = auth.uid()
      where cs.id = checklist_item_checks.session_id
        and cs.store_id = p.store_id
    )
  );

create policy "Employees can insert checks for their store sessions"
  on checklist_item_checks for insert
  to authenticated
  with check (
    exists (
      select 1 from checklist_sessions cs
      join profiles p on p.id = auth.uid()
      where cs.id = checklist_item_checks.session_id
        and cs.store_id = p.store_id
    )
  );

create policy "Employees can update checks for their store sessions"
  on checklist_item_checks for update
  to authenticated
  using (
    exists (
      select 1 from checklist_sessions cs
      join profiles p on p.id = auth.uid()
      where cs.id = checklist_item_checks.session_id
        and cs.store_id = p.store_id
    )
  )
  with check (
    exists (
      select 1 from checklist_sessions cs
      join profiles p on p.id = auth.uid()
      where cs.id = checklist_item_checks.session_id
        and cs.store_id = p.store_id
    )
  );
