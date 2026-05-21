# Error Patterns & Anti-Patterns

## Project: Dom Cellebre Burger — Opening Checklist App

## Encountered & Resolved

### SQL migration ordering (SQLSTATE 42P01)
**Pattern:** Helper functions or RLS policies that reference a table defined later in the same migration file fail with "relation does not exist"
**Resolution:** Always order migration statements: CREATE TABLE first, then helper functions, then RLS enables + policies, then triggers
**File:** `supabase/migrations/20240001_initial_schema.sql`

### Supabase `is_admin()` + TypeScript generic narrowing
**Pattern:** Using named interface references (e.g., `Row: Store`) in the `Database` type causes TypeScript 5.x to fail with "Type does not satisfy constraint GenericSchema" in supabase-js v2
**Resolution:** Use inline object types in the `Database` type (matching supabase CLI generator output format)
**File:** `src/types/database.ts`

### Middleware profile query error handling
**Pattern:** Using `if (error && !data)` allows silent bypass when Supabase returns both error and stale data
**Resolution:** Always use `if (error || !data)` for Supabase query failure checks in security-critical paths
**File:** `src/middleware.ts`

### started_at timestamp overwrite
**Pattern:** Unconditionally setting `started_at = now()` on every session status update overwrites the original start time
**Resolution:** Fetch existing `started_at` before update; use `existing_started_at ?? now` — only set if null
**File:** `src/app/actions/sessions.ts`

### Item reorder with inactive items
**Pattern:** Move operations on a filtered visible list that use real array indices (including inactive items) swap with the wrong neighbour
**Resolution:** Reorder logic must operate only within the active items subset; inactive items keep existing sort_order and are unaffected
**File:** `src/app/(admin)/admin/checklists/[id]/edit/EditChecklistForm.tsx`

### Optimistic UI partial revert
**Pattern:** On server action error, reverting only the boolean state but not the metadata state (checker name/timestamp) leaves stale display data
**Resolution:** Always revert ALL optimistic state fields on error, not just the primary boolean
**File:** `src/components/ChecklistItemRow.tsx`

## Anti-Patterns to Avoid
- Never use `@supabase/auth-helpers-nextjs` — use `@supabase/ssr` exclusively
- Never hard-delete checklists that have associated sessions — always soft-delete
- Never compute session_date from server UTC — always use the store's timezone field
- Never allow middleware to silently default to a role on DB query failure
