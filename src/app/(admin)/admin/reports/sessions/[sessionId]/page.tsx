import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionAuditDetail } from '@/app/actions/reports'
import type { SessionStatus } from '@/types/database'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

function formatDateTime(isoStr: string | null): string {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const map: Record<SessionStatus, { label: string; className: string }> = {
    not_started: { label: 'Not Started', className: 'bg-stone-800 text-stone-400' },
    in_progress: { label: 'In Progress', className: 'bg-amber-900/40 text-amber-400' },
    completed: { label: 'Completed', className: 'bg-emerald-900/40 text-emerald-400' },
  }
  const { label, className } = map[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export default async function SessionAuditPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const { session, store, checklist, items, error } = await getSessionAuditDetail(sessionId)

  if (error === 'Unauthorized') {
    return (
      <div className="text-center py-16">
        <p className="text-stone-400">You do not have permission to view this page.</p>
      </div>
    )
  }

  if (!session || !store || !checklist) {
    notFound()
  }

  const checkedCount = items.filter((i) => i.is_checked).length
  const totalCount = items.length

  return (
    <div>
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-1.5 text-stone-400 hover:text-white text-sm transition-colors"
        >
          ← Back to Reports
        </Link>
      </div>

      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Session Audit</p>
            <h1 className="text-2xl font-bold text-white">{store.name}</h1>
            <p className="text-stone-400 mt-0.5">{checklist.title}</p>
          </div>
          <StatusBadge status={session.status} />
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Date</p>
            <p className="text-white font-medium">{formatDate(session.session_date)}</p>
          </div>
          <div>
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Progress</p>
            <p className="text-white font-medium">
              <span className={checkedCount === totalCount && totalCount > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                {checkedCount}
              </span>
              <span className="text-stone-500"> / {totalCount} items completed</span>
            </p>
          </div>
          <div>
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Started At</p>
            <p className="text-white font-medium">{formatDateTime(session.started_at)}</p>
          </div>
          <div>
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Completed At</p>
            <p className="text-white font-medium">{formatDateTime(session.completed_at)}</p>
          </div>
        </div>
      </div>

      {/* Items audit table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-800">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Item Audit Trail</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 text-stone-400 text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-3 w-12">#</th>
              <th className="text-left px-6 py-3">Item</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Checked By</th>
              <th className="text-left px-6 py-3">Checked At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-stone-500">
                  No items found for this checklist.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr
                  key={item.item_id}
                  className={`transition-colors ${
                    item.is_checked
                      ? 'hover:bg-emerald-950/20'
                      : 'hover:bg-stone-800/50'
                  }`}
                >
                  <td className={`px-6 py-4 font-mono text-xs ${item.is_checked ? 'text-stone-500' : 'text-stone-600'}`}>
                    {index + 1}
                  </td>
                  <td className={`px-6 py-4 font-medium ${item.is_checked ? 'text-white' : 'text-stone-500'}`}>
                    {item.label}
                  </td>
                  <td className="px-6 py-4">
                    {item.is_checked ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                        <span className="text-base leading-none">✓</span>
                        <span className="text-xs">Checked</span>
                      </span>
                    ) : (
                      <span className="text-stone-600 text-xs">—</span>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-xs ${item.is_checked ? 'text-stone-300' : 'text-stone-600'}`}>
                    {item.checked_by_name ?? '—'}
                  </td>
                  <td className={`px-6 py-4 text-xs whitespace-nowrap ${item.is_checked ? 'text-stone-400' : 'text-stone-600'}`}>
                    {formatDateTime(item.checked_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
