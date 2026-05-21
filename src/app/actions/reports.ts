'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'
import type {
  AuditItemRow,
  Checklist,
  ChecklistSession,
  SessionReportRow,
  SessionStatus,
  Store,
} from '@/types/database'

function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0]
}

// ─────────────────────────────────────────
// getSessionsReport
// ─────────────────────────────────────────
export async function getSessionsReport(filters: {
  storeId?: string
  date?: string
  status?: string
}): Promise<{ sessions: SessionReportRow[]; error: string | null }> {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { sessions: [], error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const targetDate = filters.date && filters.date.trim() !== '' ? filters.date : getTodayUTC()

  let query = supabase.from('checklist_sessions').select('*').eq('session_date', targetDate)

  if (filters.storeId && filters.storeId.trim() !== '') {
    query = query.eq('store_id', filters.storeId)
  }

  if (filters.status && filters.status.trim() !== '') {
    query = query.eq('status', filters.status as SessionStatus)
  }

  const { data: sessions, error } = await query

  if (error) return { sessions: [], error: error.message }
  if (!sessions || sessions.length === 0) return { sessions: [], error: null }

  const storeIds = [...new Set(sessions.map((s) => s.store_id))]
  const checklistIds = [...new Set(sessions.map((s) => s.checklist_id))]
  const creatorIds = [...new Set(sessions.filter((s) => s.created_by).map((s) => s.created_by!))]

  const [storesResult, checklistsResult] = await Promise.all([
    supabase.from('stores').select('id, name').in('id', storeIds),
    supabase.from('checklists').select('id, title').in('id', checklistIds),
  ])

  const profilesResult =
    creatorIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', creatorIds)
      : { data: [] as { id: string; full_name: string }[], error: null }

  const itemCountsResult = await supabase
    .from('checklist_items')
    .select('checklist_id')
    .in('checklist_id', checklistIds)
    .eq('is_active', true)

  const checksResult = await supabase
    .from('checklist_item_checks')
    .select('session_id')
    .in(
      'session_id',
      sessions.map((s) => s.id),
    )
    .eq('is_checked', true)

  const storeMap: Record<string, string> = {}
  ;(storesResult.data ?? []).forEach((s) => {
    storeMap[s.id] = s.name
  })

  const checklistMap: Record<string, string> = {}
  ;(checklistsResult.data ?? []).forEach((c) => {
    checklistMap[c.id] = c.title
  })

  const profileMap: Record<string, string> = {}
  ;(profilesResult.data ?? []).forEach((p) => {
    profileMap[p.id] = p.full_name
  })

  const itemCountMap: Record<string, number> = {}
  ;(itemCountsResult.data ?? []).forEach((i) => {
    itemCountMap[i.checklist_id] = (itemCountMap[i.checklist_id] ?? 0) + 1
  })

  const checkedCountMap: Record<string, number> = {}
  ;(checksResult.data ?? []).forEach((c) => {
    checkedCountMap[c.session_id] = (checkedCountMap[c.session_id] ?? 0) + 1
  })

  const rows: SessionReportRow[] = sessions
    .map((s) => ({
      id: s.id,
      session_date: s.session_date,
      status: s.status as SessionStatus,
      started_at: s.started_at,
      completed_at: s.completed_at,
      store_name: storeMap[s.store_id] ?? 'Unknown Store',
      checklist_title: checklistMap[s.checklist_id] ?? 'Unknown Checklist',
      created_by_name: s.created_by ? (profileMap[s.created_by] ?? null) : null,
      total_items: itemCountMap[s.checklist_id] ?? 0,
      checked_items: checkedCountMap[s.id] ?? 0,
    }))
    .sort((a, b) => {
      if (b.session_date !== a.session_date) {
        return b.session_date.localeCompare(a.session_date)
      }
      return a.store_name.localeCompare(b.store_name)
    })

  return { sessions: rows, error: null }
}

// ─────────────────────────────────────────
// getSessionAuditDetail
// ─────────────────────────────────────────
export async function getSessionAuditDetail(sessionId: string): Promise<{
  session: ChecklistSession | null
  store: Store | null
  checklist: Checklist | null
  items: AuditItemRow[]
  error: string | null
}> {
  const empty = { session: null, store: null, checklist: null, items: [], error: null }

  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { ...empty, error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const { data: session, error: sessionError } = await supabase
    .from('checklist_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) return { ...empty, error: 'Session not found' }

  const [storeResult, checklistResult] = await Promise.all([
    supabase.from('stores').select('*').eq('id', session.store_id).single(),
    supabase.from('checklists').select('*').eq('id', session.checklist_id).single(),
  ])

  const [itemsResult, checksResult] = await Promise.all([
    supabase
      .from('checklist_items')
      .select('*')
      .eq('checklist_id', session.checklist_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase.from('checklist_item_checks').select('*').eq('session_id', sessionId),
  ])

  const rawChecks = checksResult.data ?? []
  const checkerIds = [...new Set(rawChecks.filter((c) => c.checked_by).map((c) => c.checked_by!))]

  let profileMap: Record<string, string> = {}
  if (checkerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, deleted_at')
      .in('id', checkerIds)
    profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.deleted_at ? 'Deleted User' : p.full_name]),
    )
  }

  type RawCheck = (typeof rawChecks)[number]
  const checkMap: Record<string, RawCheck> = {}
  rawChecks.forEach((c) => {
    checkMap[c.checklist_item_id] = c
  })

  const activeItems = itemsResult.data ?? []
  const auditItems: AuditItemRow[] = activeItems.map((item) => {
    const check = checkMap[item.id]
    return {
      item_id: item.id,
      label: item.label,
      sort_order: item.sort_order,
      is_checked: check?.is_checked ?? false,
      checked_at: check?.checked_at ?? null,
      checked_by_name: check?.is_checked
        ? (check.checked_by ? (profileMap[check.checked_by] ?? 'Deleted User') : 'Deleted User')
        : null,
    }
  })

  return {
    session: session as ChecklistSession,
    store: storeResult.data as Store | null,
    checklist: checklistResult.data as Checklist | null,
    items: auditItems,
    error: null,
  }
}
