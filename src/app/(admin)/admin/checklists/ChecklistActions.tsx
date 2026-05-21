'use client'

import { useRouter } from 'next/navigation'
import { deleteChecklist } from '@/app/actions/checklists'
import type { Checklist } from '@/types/database'
import Link from 'next/link'

export default function ChecklistActions({ checklist }: { checklist: Checklist }) {
  const router = useRouter()

  async function handleDeactivate() {
    if (!confirm(`Deactivate checklist "${checklist.title}"?`)) return
    const { error } = await deleteChecklist(checklist.id)
    if (error) alert(error)
    else router.refresh()
  }

  return (
    <div className="flex items-center justify-end gap-2 flex-wrap">
      <Link
        href={`/admin/checklists/${checklist.id}/edit`}
        className="text-stone-400 hover:text-amber-400 transition-colors text-xs font-medium px-2 py-1 rounded hover:bg-stone-700"
      >
        Edit
      </Link>
      <Link
        href={`/admin/checklists/${checklist.id}/assignments`}
        className="text-stone-400 hover:text-amber-400 transition-colors text-xs font-medium px-2 py-1 rounded hover:bg-stone-700"
      >
        Assign
      </Link>
      {checklist.is_active && (
        <button
          onClick={handleDeactivate}
          className="text-stone-400 hover:text-red-400 transition-colors text-xs font-medium px-2 py-1 rounded hover:bg-stone-700"
        >
          Deactivate
        </button>
      )}
    </div>
  )
}
