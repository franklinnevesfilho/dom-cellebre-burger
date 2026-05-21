'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'

export async function getChecklists() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('checklists')
    .select('*, checklist_items(*)')
    .order('created_at', { ascending: false })
  return { data, error: error?.message ?? null }
}

export async function createChecklist(input: {
  title: string
  description: string
  items: { label: string; sort_order: number }[]
}) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: checklist, error: checklistError } = await supabase
    .from('checklists')
    .insert({
      title: input.title,
      description: input.description || null,
      is_active: true,
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    })
    .select()
    .single()

  if (checklistError || !checklist) {
    return { data: null, error: checklistError?.message ?? 'Failed to create checklist' }
  }

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase.from('checklist_items').insert(
      input.items.map((item) => ({
        checklist_id: checklist.id,
        label: item.label,
        sort_order: item.sort_order,
        is_active: true,
      })),
    )
    if (itemsError) {
      return { data: null, error: itemsError.message }
    }
  }

  revalidatePath('/admin/checklists')
  return { data: checklist, error: null }
}

export async function updateChecklist(
  id: string,
  input: { title: string; description: string; is_active: boolean },
) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('checklists')
    .update({
      title: input.title,
      description: input.description || null,
      is_active: input.is_active,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (!error) revalidatePath('/admin/checklists')
  return { data, error: error?.message ?? null }
}

export async function updateChecklistItems(
  checklistId: string,
  items: { id?: string; label: string; sort_order: number; is_active: boolean }[],
) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const validItems = items.filter((item) => item.label.trim())
  const newItems = validItems.filter((i) => !i.id)
  const existingItems = validItems.filter((i) => i.id)

  if (newItems.length > 0) {
    const { error } = await supabase.from('checklist_items').insert(
      newItems.map((item) => ({
        checklist_id: checklistId,
        label: item.label,
        sort_order: item.sort_order,
        is_active: item.is_active,
      })),
    )
    if (error) return { data: null, error: error.message }
  }

  for (const item of existingItems) {
    const { error } = await supabase
      .from('checklist_items')
      .update({
        label: item.label,
        sort_order: item.sort_order,
        is_active: item.is_active,
      })
      .eq('id', item.id as string)
      .eq('checklist_id', checklistId)
    if (error) return { data: null, error: error.message }
  }

  revalidatePath(`/admin/checklists/${checklistId}/edit`)
  revalidatePath('/admin/checklists')
  return { data: true, error: null }
}

export async function deleteChecklist(id: string) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('checklists')
    .update({
      is_active: false,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (!error) revalidatePath('/admin/checklists')
  return { data, error: error?.message ?? null }
}

