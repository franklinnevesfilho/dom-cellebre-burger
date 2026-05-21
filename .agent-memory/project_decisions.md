# Project Decisions

## Project: Dom Cellebre Burger — Opening Checklist App
Stack: Next.js 14 (App Router, TypeScript, Tailwind CSS), Supabase (Auth + Postgres + RLS), Vercel

## Architecture Decisions

### Auth & Roles
- Supabase Auth handles login/logout for both admin and employee roles
- Role stored in `profiles.role` ('admin' | 'employee')
- Employee store assignment via `profiles.store_id` (single store per employee)
- Admins can access all stores; employees scoped to their store via RLS
- Middleware enforces role-based routing: `/admin/*` → admin only, `/employee/*` → employee or admin
- Profile query failure in middleware redirects to `/login?error=session` (never silently falls back to a default role)

### Data Model
- `stores` → `profiles` (many employees per store via store_id FK)
- `checklists` → `checklist_items` (ordered by sort_order)
- `checklist_store_assignments` — many-to-many join: checklists ↔ stores
- `checklist_sessions` — one daily record per (store_id, checklist_id, session_date); unique constraint enforced
- `checklist_item_checks` — per-item check record per session; unique constraint per (session_id, checklist_item_id)

### Session Semantics
- Daily sessions are SHARED: multiple employees in the same store work on the same session
- `session_date` is computed from the store's `timezone` field (not server UTC) — use `Intl.DateTimeFormat`
- `started_at` is only set once (when transitioning from `not_started`); never overwritten on subsequent checks
- Session status auto-calculates after each item toggle: not_started / in_progress / completed
- `completed_at` is set when all active items are checked; cleared if any item is unchecked

### Checklist Integrity
- Checklist deletion = soft delete (`is_active = false`) once the checklist has been used in any session
- Hard delete only allowed if no sessions reference the checklist
- Inactive items are excluded from completion calculations but preserved in the DB

### Concurrency
- Race condition on concurrent session creation handled: catch Postgres `23505` unique violation, retry SELECT, return existing session as success

### Migrations (in order)
1. `20240001_initial_schema.sql` — stores, profiles, is_admin() helper, RLS, auto-profile trigger
2. `20240002_checklist_schema.sql` — checklists, checklist_items, checklist_store_assignments, RLS
3. `20240003_session_schema.sql` — checklist_sessions, checklist_item_checks, RLS

### RLS Strategy
- `is_admin()` helper function (security definer) used in all admin policies
- Employee policies use store_id subquery joins to scope access
- Defense-in-depth: application-level role checks + RLS both enforced

### Hosting & Local Dev
- Production: Vercel (frontend + API routes) + Supabase cloud project
- Local dev: `npx supabase start` (all images pre-pulled), `npx supabase db reset` to re-apply migrations
- `.env.local` contains placeholder values for local dev; real values set in Vercel env dashboard
