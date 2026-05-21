import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionWithChecks } from '@/app/actions/sessions'
import ChecklistItemRow from '@/components/ChecklistItemRow'
import type { SessionStatus } from '@/types/database'
import type { CheckWithProfile } from '@/app/actions/sessions'

function StatusBadge({ status }: { status: SessionStatus }) {
  const map: Record<SessionStatus, { label: string; className: string }> = {
    not_started: { label: 'Not Started', className: 'bg-stone-800 text-stone-400' },
    in_progress: { label: 'In Progress', className: 'bg-amber-900/50 text-amber-400 border border-amber-800' },
    completed: { label: 'Completed', className: 'bg-green-900/50 text-green-400 border border-green-800' },
  }
  const { label, className } = map[status]
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>{label}</span>
  )
}

function formatDate(isoDate: string): string {
  // session_date is YYYY-MM-DD — parse as local date
  const [year, month, day] = isoDate.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

interface PageProps {
  params: Promise<{ sessionId: string }>
}

export default async function ChecklistSessionPage({ params }: PageProps) {
  const { sessionId } = await params
  const { session, checklist, store, items, checks, error } = await getSessionWithChecks(sessionId)

  if (error === 'Access denied' || error === 'Session not found' || !session || !checklist) {
    notFound()
  }

  const checkMap: Record<string, CheckWithProfile> = {}
  checks.forEach((c) => {
    checkMap[c.checklist_item_id] = c
  })

  const checkedCount = checks.filter((c) => c.is_checked).length
  const totalCount = items.length
  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/employee"
          className="inline-flex items-center gap-1.5 text-stone-400 hover:text-white text-sm transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to checklists
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{checklist.title}</h1>
            <p className="text-stone-400 text-sm mt-1">
              {store?.name && <span className="text-amber-400 font-medium">{store.name}</span>}
              {store?.name && ' · '}
              {formatDate(session.session_date)}
            </p>
          </div>
          <StatusBadge status={session.status} />
        </div>
      </div>

      {/* Progress */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-stone-400">
            <span className="text-white font-semibold">{checkedCount}</span> of{' '}
            <span className="text-white font-semibold">{totalCount}</span> completed
          </span>
          <span className={`font-semibold ${pct === 100 ? 'text-green-400' : 'text-amber-400'}`}>
            {pct}%
          </span>
        </div>
        <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pct === 100 ? 'bg-green-500' : 'bg-amber-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {session.status === 'completed' && (
          <p className="text-green-400 text-sm mt-3 text-center font-medium">
            ✓ All items completed
          </p>
        )}
      </div>

      {/* Checklist items */}
      {items.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-10 text-center">
          <p className="text-stone-500 text-sm">No items in this checklist.</p>
        </div>
      ) : (
        <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-stone-800">
            {items.map((item) => (
              <ChecklistItemRow
                key={item.id}
                sessionId={session.id}
                item={item}
                check={checkMap[item.id] ?? null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
