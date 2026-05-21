'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { assignChecklistToStore, unassignChecklistFromStore } from '@/app/actions/assignments'

export default function AssignmentToggle({
  checklistId,
  storeId,
  assigned,
}: {
  checklistId: string
  storeId: string
  assigned: boolean
}) {
  const router = useRouter()
  const [isAssigned, setIsAssigned] = useState(assigned)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    if (isAssigned) {
      const { error } = await unassignChecklistFromStore(checklistId, storeId)
      if (!error) setIsAssigned(false)
    } else {
      const { error } = await assignChecklistToStore(checklistId, storeId)
      if (!error) setIsAssigned(true)
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        isAssigned ? 'bg-amber-500' : 'bg-stone-700'
      }`}
      aria-label={isAssigned ? 'Unassign' : 'Assign'}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isAssigned ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
