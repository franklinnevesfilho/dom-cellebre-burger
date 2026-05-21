import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSessionsReport } from '@/app/actions/reports'
import type { SessionStatus, Store } from '@/types/database'

function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const map: Record<SessionStatus, { label: string; className: string }> = {
    not_started: { label: 'Not Started', className: 'bg-stone-800 text-stone-400' },
    in_progress: { label: 'In Progress', className: 'bg-amber-900/40 text-amber-400' },
    completed: { label: 'Completed', className: 'bg-emerald-900/40 text-emerald-400' },
  }
  const { label, className } = map[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

type SearchParams = { storeId?: string; date?: string; status?: string }

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const todayUTC = getTodayUTC()
  const selectedDate = params.date ?? todayUTC
  const selectedStoreId = params.storeId ?? ''
  const selectedStatus = params.status ?? ''

  const supabase = await createClient()
  const { data: storesData } = await supabase
    .from('stores')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
  const stores = (storesData ?? []) as Pick<Store, 'id' | 'name'>[]

  const { sessions, error } = await getSessionsReport({
    storeId: selectedStoreId || undefined,
    date: selectedDate,
    status: selectedStatus || undefined,
  })

  const totalCount = sessions.length
  const completedCount = sessions.filter((s) => s.status === 'completed').length
  const inProgressCount = sessions.filter((s) => s.status === 'in_progress').length
  const notStartedCount = sessions.filter((s) => s.status === 'not_started').length

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Session Reports</h1>
        <p className="text-stone-400 mt-1">
          View daily checklist completion status across all stores.
        </p>
      </div>

      {/* Filter bar */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        {/* Store filter */}
        <select
          name="storeId"
          defaultValue={selectedStoreId}
          className="bg-stone-900 border border-stone-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
        >
          <option value="">All Stores</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>

        {/* Date filter */}
        <input
          type="date"
          name="date"
          defaultValue={selectedDate}
          className="bg-stone-900 border border-stone-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
        />

        {/* Status filter */}
        <select
          name="status"
          defaultValue={selectedStatus}
          className="bg-stone-900 border border-stone-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
        >
          <option value="">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Sessions', value: totalCount, color: 'text-white' },
          { label: 'Completed', value: completedCount, color: 'text-emerald-400' },
          { label: 'In Progress', value: inProgressCount, color: 'text-amber-400' },
          { label: 'Not Started', value: notStartedCount, color: 'text-stone-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-4"
          >
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 text-stone-400 text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-3">Date</th>
              <th className="text-left px-6 py-3">Store</th>
              <th className="text-left px-6 py-3">Checklist</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Progress</th>
              <th className="text-left px-6 py-3">Started At</th>
              <th className="text-left px-6 py-3">Completed At</th>
              <th className="text-left px-6 py-3">Opened By</th>
              <th className="text-right px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <p className="text-stone-400 font-medium">No sessions found for the selected filters.</p>
                  <p className="text-stone-600 text-xs mt-1">
                    Try a different date or adjust your filters.
                  </p>
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id} className="hover:bg-stone-800/50 transition-colors">
                  <td className="px-6 py-4 text-stone-300 whitespace-nowrap">
                    {formatDate(session.session_date)}
                  </td>
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    {session.store_name}
                  </td>
                  <td className="px-6 py-4 text-stone-300 max-w-[180px] truncate">
                    {session.checklist_title}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={session.status} />
                  </td>
                  <td className="px-6 py-4 text-stone-300 whitespace-nowrap">
                    {session.checked_items} / {session.total_items}
                    {session.total_items > 0 && (
                      <span className="text-stone-600 ml-1 text-xs">
                        items
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-stone-400 whitespace-nowrap">
                    {formatTime(session.started_at)}
                  </td>
                  <td className="px-6 py-4 text-stone-400 whitespace-nowrap">
                    {formatTime(session.completed_at)}
                  </td>
                  <td className="px-6 py-4 text-stone-400 whitespace-nowrap">
                    {session.created_by_name ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/reports/sessions/${session.id}`}
                      className="text-amber-400 hover:text-amber-300 text-xs font-medium transition-colors"
                    >
                      View Details →
                    </Link>
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
