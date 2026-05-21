'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/getProfile'

export async function getStores() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name')
  return { data, error: error?.message ?? null }
}

export async function createStore(input: {
  name: string
  code: string
  timezone: string
}) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .insert({
      name: input.name,
      code: input.code.toUpperCase(),
      timezone: input.timezone,
      is_active: true,
    })
    .select()
    .single()

  if (!error) revalidatePath('/admin/stores')
  return { data, error: error?.message ?? null }
}

export async function updateStore(
  id: string,
  input: { name: string; code: string; timezone: string; is_active: boolean },
) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .update({
      name: input.name,
      code: input.code.toUpperCase(),
      timezone: input.timezone,
      is_active: input.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (!error) revalidatePath('/admin/stores')
  return { data, error: error?.message ?? null }
}

export async function deleteStore(id: string) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (!error) revalidatePath('/admin/stores')
  return { data, error: error?.message ?? null }
}
