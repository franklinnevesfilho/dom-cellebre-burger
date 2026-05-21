'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'

export async function getChecklistAssignments(checklistId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('checklist_store_assignments')
    .select('*, stores(*)')
    .eq('checklist_id', checklistId)
  return { data, error: error?.message ?? null }
}

export async function assignChecklistToStore(checklistId: string, storeId: string) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('checklist_store_assignments')
    .insert({
      checklist_id: checklistId,
      store_id: storeId,
      assigned_by: user?.id ?? null,
    })
    .select()
    .single()

  if (!error) revalidatePath(`/admin/checklists/${checklistId}/assignments`)
  return { data, error: error?.message ?? null }
}

export async function unassignChecklistFromStore(checklistId: string, storeId: string) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('checklist_store_assignments')
    .delete()
    .eq('checklist_id', checklistId)
    .eq('store_id', storeId)

  if (!error) revalidatePath(`/admin/checklists/${checklistId}/assignments`)
  return { data: true, error: error?.message ?? null }
}
