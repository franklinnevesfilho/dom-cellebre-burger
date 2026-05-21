import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditChecklistForm from './EditChecklistForm'
import type { Checklist, ChecklistItem } from '@/types/database'

export default async function EditChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('checklists')
    .select('*, checklist_items(*)')
    .eq('id', id)
    .single()

  if (!raw) notFound()

  const checklist = raw as unknown as Checklist & { checklist_items: ChecklistItem[] }
  const items = (checklist.checklist_items ?? []).sort(
    (a, b) => a.sort_order - b.sort_order,
  )

  return (
    <div className="max-w-2xl">
      <EditChecklistForm checklist={checklist} initialItems={items} />
    </div>
  )
}
