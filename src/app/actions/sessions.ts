'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'
import type {
  Checklist,
  ChecklistItem,
  ChecklistItemCheck,
  ChecklistSession,
  SessionStatus,
  Store,
} from '@/types/database'

function getLocalDate(timezone: string): string {
  // en-CA locale formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
}

// ─────────────────────────────────────────
// getOrCreateTodaySession
// ─────────────────────────────────────────
export async function getOrCreateTodaySession(
  checklistId: string,
): Promise<{ session: ChecklistSession | null; error: string | null }> {
  const profile = await getProfile()
  if (!profile) return { session: null, error: 'Not authenticated' }
  if (!profile.store_id) return { session: null, error: 'No store assigned to your profile' }

  const supabase = await createClient()

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('timezone')
    .eq('id', profile.store_id)
    .single()

  if (storeError || !store) return { session: null, error: 'Could not load store' }

  const today = getLocalDate(store.timezone)

  // Try to find existing session
  const { data: existing } = await supabase
    .from('checklist_sessions')
    .select('*')
    .eq('store_id', profile.store_id)
    .eq('checklist_id', checklistId)
    .eq('session_date', today)
    .single()

  if (existing) return { session: existing as ChecklistSession, error: null }

  // Verify checklist is assigned to the user's store before creating
  const { data: assignment } = await supabase
    .from('checklist_store_assignments')
    .select('id')
    .eq('store_id', profile.store_id)
    .eq('checklist_id', checklistId)
    .single()

  if (!assignment) return { session: null, error: 'Checklist is not assigned to your store' }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: created, error: insertError } = await supabase
    .from('checklist_sessions')
    .insert({
      store_id: profile.store_id,
      checklist_id: checklistId,
      session_date: today,
      status: 'not_started',
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: concurrentSession, error: retryError } = await supabase
        .from('checklist_sessions')
        .select('*')
        .eq('store_id', profile.store_id)
        .eq('checklist_id', checklistId)
        .eq('session_date', today)
        .single()

      if (retryError || !concurrentSession) {
        return { session: null, error: retryError?.message ?? insertError.message }
      }

      return { session: concurrentSession as ChecklistSession, error: null }
    }

    return { session: null, error: insertError.message }
  }

  if (!created) {
    return { session: null, error: 'Failed to create session' }
  }

  return { session: created as ChecklistSession, error: null }
}

// ─────────────────────────────────────────
// getSessionWithChecks
// ─────────────────────────────────────────
export type CheckWithProfile = ChecklistItemCheck & { checker_name: string | null }

export async function getSessionWithChecks(sessionId: string): Promise<{
  session: ChecklistSession | null
  checklist: Checklist | null
  store: Store | null
  items: ChecklistItem[]
  checks: CheckWithProfile[]
  error: string | null
}> {
  const empty = { session: null, checklist: null, store: null, items: [], checks: [], error: null }

  const profile = await getProfile()
  if (!profile) return { ...empty, error: 'Not authenticated' }

  const supabase = await createClient()

  const { data: session, error: sessionError } = await supabase
    .from('checklist_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) return { ...empty, error: 'Session not found' }

  // Access control: employee must belong to the session's store
  if (profile.role !== 'admin' && profile.store_id !== session.store_id) {
    return { ...empty, error: 'Access denied' }
  }

  const [checklistResult, storeResult, itemsResult, checksResult] = await Promise.all([
    supabase.from('checklists').select('*').eq('id', session.checklist_id).single(),
    supabase.from('stores').select('*').eq('id', session.store_id).single(),
    supabase
      .from('checklist_items')
      .select('*')
      .eq('checklist_id', session.checklist_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase.from('checklist_item_checks').select('*').eq('session_id', sessionId),
  ])

  const rawChecks = (checksResult.data ?? []) as ChecklistItemCheck[]

  // Fetch profiles for checked_by
  const checkerIds = [...new Set(rawChecks.filter((c) => c.checked_by).map((c) => c.checked_by!))]
  let nameMap: Record<string, string> = {}
  if (checkerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', checkerIds)
    nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]))
  }

  const checks: CheckWithProfile[] = rawChecks.map((c) => ({
    ...c,
    checker_name: c.checked_by ? (nameMap[c.checked_by] ?? null) : null,
  }))

  return {
    session: session as ChecklistSession,
    checklist: checklistResult.data as Checklist | null,
    store: storeResult.data as Store | null,
    items: (itemsResult.data ?? []) as ChecklistItem[],
    checks,
    error: null,
  }
}

// ─────────────────────────────────────────
// toggleItemCheck
// ─────────────────────────────────────────
export async function toggleItemCheck(
  sessionId: string,
  itemId: string,
  isChecked: boolean,
): Promise<{ check: ChecklistItemCheck | null; sessionStatus: SessionStatus | null; error: string | null }> {
  const profile = await getProfile()
  if (!profile) return { check: null, sessionStatus: null, error: 'Not authenticated' }

  const supabase = await createClient()

  // Verify the session belongs to the caller's store
  const { data: session, error: sessionError } = await supabase
    .from('checklist_sessions')
    .select('store_id, checklist_id, started_at, status')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return { check: null, sessionStatus: null, error: 'Session not found' }
  }

  if (profile.role !== 'admin' && profile.store_id !== session.store_id) {
    return { check: null, sessionStatus: null, error: 'Access denied: wrong store' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const now = new Date().toISOString()

  const { data: check, error: upsertError } = await supabase
    .from('checklist_item_checks')
    .upsert(
      {
        session_id: sessionId,
        checklist_item_id: itemId,
        is_checked: isChecked,
        checked_at: isChecked ? now : null,
        checked_by: user?.id ?? null,
        updated_at: now,
      },
      { onConflict: 'session_id,checklist_item_id' },
    )
    .select()
    .single()

  if (upsertError || !check) {
    return { check: null, sessionStatus: null, error: upsertError?.message ?? 'Failed to update check' }
  }

  // Recalculate session status
  const [{ count: totalCount }, { count: checkedCount }] = await Promise.all([
    supabase
      .from('checklist_items')
      .select('*', { count: 'exact', head: true })
      .eq('checklist_id', session.checklist_id)
      .eq('is_active', true),
    supabase
      .from('checklist_item_checks')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('is_checked', true),
  ])

  let newStatus: SessionStatus = 'not_started'
  let completedAt: string | null = null

  if ((checkedCount ?? 0) >= (totalCount ?? 0) && (totalCount ?? 0) > 0) {
    newStatus = 'completed'
    completedAt = now
  } else if ((checkedCount ?? 0) > 0) {
    newStatus = 'in_progress'
  }

  await supabase
    .from('checklist_sessions')
    .update({
      status: newStatus,
      completed_at: completedAt,
      started_at: newStatus !== 'not_started' ? session.started_at ?? now : null,
      updated_at: now,
    })
    .eq('id', sessionId)

  revalidatePath(`/employee/checklist/${sessionId}`)
  revalidatePath('/employee')

  return { check: check as ChecklistItemCheck, sessionStatus: newStatus, error: null }
}

// ─────────────────────────────────────────
// getTodayChecklistsForStore
// ─────────────────────────────────────────
export type ChecklistWithProgress = {
  checklist: Checklist
  session: ChecklistSession | null
  totalItems: number
  checkedItems: number
}

export async function getTodayChecklistsForStore(): Promise<{
  checklists: ChecklistWithProgress[]
  store: Store | null
  error: string | null
}> {
  const profile = await getProfile()
  if (!profile) return { checklists: [], store: null, error: 'Not authenticated' }
  if (!profile.store_id) return { checklists: [], store: null, error: 'no_store' }

  const supabase = await createClient()

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .eq('id', profile.store_id)
    .single()

  if (storeError || !store) return { checklists: [], store: null, error: 'Could not load store' }

  const today = getLocalDate(store.timezone)

  // Get assigned checklists for this store
  const { data: assignments, error: assignErr } = await supabase
    .from('checklist_store_assignments')
    .select('checklist_id')
    .eq('store_id', profile.store_id)

  if (assignErr) return { checklists: [], store: store as Store, error: assignErr.message }

  const checklistIds = (assignments ?? []).map((a) => a.checklist_id)
  if (checklistIds.length === 0) return { checklists: [], store: store as Store, error: null }

  // Get active checklists
  const { data: checklistsData, error: clError } = await supabase
    .from('checklists')
    .select('*')
    .in('id', checklistIds)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (clError) return { checklists: [], store: store as Store, error: clError.message }
  const checklists = (checklistsData ?? []) as Checklist[]
  if (checklists.length === 0) return { checklists: [], store: store as Store, error: null }

  const activeChecklistIds = checklists.map((c) => c.id)

  // Get total item counts per checklist
  const { data: allItems } = await supabase
    .from('checklist_items')
    .select('checklist_id')
    .in('checklist_id', activeChecklistIds)
    .eq('is_active', true)

  const itemCountMap: Record<string, number> = {}
  ;(allItems ?? []).forEach((item) => {
    itemCountMap[item.checklist_id] = (itemCountMap[item.checklist_id] ?? 0) + 1
  })

  // Get today's sessions for this store
  const { data: sessionsData } = await supabase
    .from('checklist_sessions')
    .select('*')
    .eq('store_id', profile.store_id)
    .eq('session_date', today)
    .in('checklist_id', activeChecklistIds)

  const sessions = (sessionsData ?? []) as ChecklistSession[]
  const sessionMap: Record<string, ChecklistSession> = {}
  sessions.forEach((s) => {
    sessionMap[s.checklist_id] = s
  })

  // Get checked item counts for existing sessions
  const sessionIds = sessions.map((s) => s.id)
  const checkedCountMap: Record<string, number> = {}
  if (sessionIds.length > 0) {
    const { data: checks } = await supabase
      .from('checklist_item_checks')
      .select('session_id')
      .in('session_id', sessionIds)
      .eq('is_checked', true)

    ;(checks ?? []).forEach((c) => {
      checkedCountMap[c.session_id] = (checkedCountMap[c.session_id] ?? 0) + 1
    })
  }

  const result: ChecklistWithProgress[] = checklists.map((cl) => {
    const session = sessionMap[cl.id] ?? null
    const totalItems = itemCountMap[cl.id] ?? 0
    const checkedItems = session ? (checkedCountMap[session.id] ?? 0) : 0
    return { checklist: cl, session, totalItems, checkedItems }
  })

  return { checklists: result, store: store as Store, error: null }
}
