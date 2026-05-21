'use client'

import { useState, useTransition } from 'react'
import { toggleItemCheck } from '@/app/actions/sessions'
import type { ChecklistItem } from '@/types/database'
import type { CheckWithProfile } from '@/app/actions/sessions'

interface Props {
  sessionId: string
  item: ChecklistItem
  check: CheckWithProfile | null
}

function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString))
}

export default function ChecklistItemRow({ sessionId, item, check }: Props) {
  const [isPending, startTransition] = useTransition()
  const [optimisticChecked, setOptimisticChecked] = useState(check?.is_checked ?? false)
  const [optimisticCheck, setOptimisticCheck] = useState<CheckWithProfile | null>(check)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked
    setOptimisticChecked(newChecked)

    startTransition(async () => {
      const result = await toggleItemCheck(sessionId, item.id, newChecked)
      if (result.error) {
        // Revert optimistic state on error
        setOptimisticChecked(!newChecked)
        setOptimisticCheck(check)
      } else if (result.check) {
        setOptimisticCheck({
          ...result.check,
          checker_name: optimisticCheck?.checker_name ?? null,
        })
      }
    })
  }

  return (
    <label
      className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors select-none
        ${optimisticChecked ? 'bg-stone-800/60' : 'bg-stone-900 hover:bg-stone-800/40'}
        ${isPending ? 'opacity-60' : ''}`}
    >
      <div className="pt-0.5">
        <input
          type="checkbox"
          checked={optimisticChecked}
          onChange={handleChange}
          disabled={isPending}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0
            ${optimisticChecked
              ? 'bg-amber-500 border-amber-500'
              : 'border-stone-600 bg-transparent'
            }
            ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {optimisticChecked && (
            <svg className="w-3 h-3 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {isPending && !optimisticChecked && (
            <div className="w-2 h-2 rounded-full bg-stone-600 animate-pulse" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <span
          className={`text-sm font-medium transition-colors ${
            optimisticChecked ? 'text-stone-500 line-through' : 'text-white'
          }`}
        >
          {item.label}
        </span>
        {optimisticChecked && optimisticCheck?.checked_by && optimisticCheck.checked_at && (
          <p className="text-xs text-stone-600 mt-0.5">
            Checked
            {optimisticCheck.checker_name ? ` by ${optimisticCheck.checker_name}` : ''}
            {' at '}
            {formatTime(optimisticCheck.checked_at)}
          </p>
        )}
      </div>
    </label>
  )
}
