import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTodayChecklistsForStore, getOrCreateTodaySession } from '@/app/actions/sessions'
import type { SessionStatus } from '@/types/database'

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

function ProgressBar({ checked, total }: { checked: number; total: number }) {
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs text-stone-500 mb-1.5">
        <span>{checked} of {total} items completed</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function formatDate(timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  }).format(new Date())
}

export default async function EmployeeDashboard() {
  const { checklists, store, error } = await getTodayChecklistsForStore()

  if (error === 'no_store') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Opening Checklists</h1>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">🏪</div>
          <h2 className="font-semibold text-white mb-1">No store assigned</h2>
          <p className="text-stone-500 text-sm">
            Your account has not been assigned to a store. Please contact your manager.
          </p>
        </div>
      </div>
    )
  }

  const today = store ? formatDate(store.timezone) : ''

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Opening Checklists</h1>
        <p className="text-stone-400 mt-1">
          {store?.name && <span className="text-amber-400 font-medium">{store.name}</span>}
          {store?.name && ' · '}
          {today}
        </p>
      </div>

      {checklists.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="font-semibold text-white mb-1">No checklists assigned yet</h2>
          <p className="text-stone-500 text-sm">
            No checklists assigned to your store yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {checklists.map(({ checklist, session, totalItems, checkedItems }) => {
            async function openChecklist() {
              'use server'
              const { session: s, error: e } = await getOrCreateTodaySession(checklist.id)
              if (e || !s) return
              redirect(`/employee/checklist/${s.id}`)
            }

            return (
              <div
                key={checklist.id}
                className="bg-stone-900 border border-stone-800 rounded-xl p-5 hover:border-stone-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-semibold text-white text-base">{checklist.title}</h2>
                    {checklist.description && (
                      <p className="text-stone-500 text-sm mt-0.5">{checklist.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={session?.status ?? 'not_started'} />
                    {session ? (
                      <Link
                        href={`/employee/checklist/${session.id}`}
                        className="text-sm font-medium bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-1.5 rounded-lg transition-colors"
                      >
                        {session.status === 'completed' ? 'Review' : 'Open'}
                      </Link>
                    ) : (
                      <form action={openChecklist}>
                        <button
                          type="submit"
                          className="text-sm font-medium bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-1.5 rounded-lg transition-colors"
                        >
                          Open
                        </button>
                      </form>
                    )}
                  </div>
                </div>
                <ProgressBar checked={checkedItems} total={totalItems} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
