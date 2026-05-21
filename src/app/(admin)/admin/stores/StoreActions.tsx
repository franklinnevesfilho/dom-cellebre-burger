'use client'

import { useRouter } from 'next/navigation'
import { deleteStore } from '@/app/actions/stores'
import type { Store } from '@/types/database'
import Link from 'next/link'

export default function StoreActions({ store }: { store: Store }) {
  const router = useRouter()

  async function handleDeactivate() {
    if (!confirm(`Deactivate store "${store.name}"?`)) return
    const { error } = await deleteStore(store.id)
    if (error) alert(error)
    else router.refresh()
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/admin/stores/${store.id}/edit`}
        className="text-stone-400 hover:text-amber-400 transition-colors text-xs font-medium px-2 py-1 rounded hover:bg-stone-700"
      >
        Edit
      </Link>
      {store.is_active && (
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
