'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateEmployeeStore,
  toggleEmployeeActive,
  softDeleteEmployee,
} from '@/app/actions/employees'
import type { EmployeeRow, Store } from '@/types/database'

interface Props {
  employee: EmployeeRow
  stores: Store[]
}

export default function EmployeeActions({ employee, stores }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [storeSaved, setStoreSaved] = useState(false)

  const isDeleted = employee.deleted_at !== null

  // Deleted — no actions
  if (isDeleted) {
    return (
      <span className="text-stone-600 text-xs">
        Deleted{' '}
        {employee.deleted_at
          ? new Date(employee.deleted_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : ''}
      </span>
    )
  }

  function handleStoreChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStoreId = e.target.value || null
    setError(null)
    setStoreSaved(false)
    startTransition(async () => {
      const { error: err } = await updateEmployeeStore(employee.id, newStoreId)
      if (err) {
        setError(err)
      } else {
        setStoreSaved(true)
        setTimeout(() => setStoreSaved(false), 2000)
        router.refresh()
      }
    })
  }

  function handleToggle(activate: boolean) {
    const verb = activate ? 'Re-enable' : 'Disable'
    const consequence = activate
      ? 'They will be able to log in again.'
      : 'They will be blocked from logging in.'
    if (!window.confirm(`${verb} ${employee.full_name}? ${consequence}`)) return
    setError(null)
    startTransition(async () => {
      const { error: err } = await toggleEmployeeActive(employee.id, activate)
      if (err) setError(err)
      else router.refresh()
    })
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Delete ${employee.full_name}? This is permanent and cannot be undone.`,
      )
    )
      return
    setError(null)
    startTransition(async () => {
      const { error: err } = await softDeleteEmployee(employee.id)
      if (err) setError(err)
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      {/* Store selector */}
      <div className="flex items-center gap-2">
        <select
          defaultValue={employee.store_id ?? ''}
          onChange={handleStoreChange}
          disabled={isPending}
          className="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50 transition-colors"
        >
          <option value="">Unassigned</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {storeSaved && (
          <span className="text-xs text-emerald-400 font-medium">Saved</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {employee.is_active ? (
          <button
            onClick={() => handleToggle(false)}
            disabled={isPending}
            className="text-xs font-medium px-2 py-1 rounded text-amber-400 hover:text-amber-300 hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            Disable
          </button>
        ) : (
          <button
            onClick={() => handleToggle(true)}
            disabled={isPending}
            className="text-xs font-medium px-2 py-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            Re-enable
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs font-medium px-2 py-1 rounded border border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-50 transition-colors"
        >
          Delete
        </button>
      </div>

      {error && <p className="text-xs text-red-400 text-right">{error}</p>}
    </div>
  )
}
