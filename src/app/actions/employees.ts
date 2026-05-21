'use server'

import { getProfile } from '@/lib/auth/getProfile'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { EmployeeRow } from '@/types/database'

// ─────────────────────────────────────────
// getEmployees
// ─────────────────────────────────────────
export async function getEmployees(): Promise<{
  employees: EmployeeRow[]
  error: string | null
}> {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { employees: [], error: 'Unauthorized' }
  }

  const [profilesResult, storesResult] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .order('full_name', { ascending: true }),
    supabaseAdmin.from('stores').select('id, name'),
  ])

  if (profilesResult.error) {
    return { employees: [], error: profilesResult.error.message }
  }

  const storeMap: Record<string, string> = {}
  for (const s of storesResult.data ?? []) {
    storeMap[s.id] = s.name
  }

  const employees: EmployeeRow[] = (profilesResult.data ?? []).map((p) => ({
    ...p,
    role: p.role as 'admin' | 'employee',
    store_name: p.store_id ? (storeMap[p.store_id] ?? null) : null,
  }))

  return { employees, error: null }
}

// ─────────────────────────────────────────
// inviteEmployee
// ─────────────────────────────────────────
export async function inviteEmployee(data: {
  email: string
  full_name: string
  store_id: string | null
}): Promise<{ error: string | null }> {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const { email, full_name, store_id } = data

  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { role: 'employee', full_name, store_id },
  })

  if (inviteError) {
    const msg = inviteError.message.toLowerCase()
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
      return { error: 'An account with this email already exists' }
    }
    return { error: inviteError.message }
  }

  return { error: null }
}

// ─────────────────────────────────────────
// updateEmployeeStore
// ─────────────────────────────────────────
export async function updateEmployeeStore(
  employeeId: string,
  storeId: string | null,
): Promise<{ error: string | null }> {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ store_id: storeId, updated_at: new Date().toISOString() })
    .eq('id', employeeId)
    .eq('role', 'employee')

  return { error: error?.message ?? null }
}

// ─────────────────────────────────────────
// toggleEmployeeActive
// ─────────────────────────────────────────
export async function toggleEmployeeActive(
  employeeId: string,
  isActive: boolean,
): Promise<{ error: string | null }> {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  // Cannot change status of a soft-deleted employee
  const { data: target, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('deleted_at')
    .eq('id', employeeId)
    .single()

  if (fetchError) return { error: fetchError.message }
  if (target?.deleted_at !== null) {
    return { error: 'Cannot change status of a deleted employee' }
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', employeeId)
    .eq('role', 'employee')

  return { error: error?.message ?? null }
}

// ─────────────────────────────────────────
// softDeleteEmployee
// ─────────────────────────────────────────
export async function softDeleteEmployee(employeeId: string): Promise<{ error: string | null }> {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', employeeId)
    .eq('role', 'employee')

  return { error: error?.message ?? null }
}
