import { getEmployees } from '@/app/actions/employees'
import { getStores } from '@/app/actions/stores'
import type { EmployeeRow, Store } from '@/types/database'
import InviteEmployeeForm from './InviteEmployeeForm'
import EmployeeActions from './EmployeeActions'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusBadge({ employee }: { employee: EmployeeRow }) {
  if (employee.deleted_at !== null) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
        Deleted
      </span>
    )
  }
  if (!employee.is_active) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
        Disabled
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
      Active
    </span>
  )
}

export default async function EmployeesPage() {
  const [{ employees, error }, { data: rawStores }] = await Promise.all([
    getEmployees(),
    getStores(),
  ])

  const stores: Store[] = (rawStores ?? []) as Store[]

  const activeCount = employees.filter(
    (e) => e.is_active && e.deleted_at === null,
  ).length
  const disabledCount = employees.filter(
    (e) => !e.is_active && e.deleted_at === null,
  ).length
  const deletedCount = employees.filter((e) => e.deleted_at !== null).length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Employees</h1>
        <p className="text-stone-400 mt-1">Manage employee accounts and store assignments.</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-3">
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{employees.length}</p>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-3">
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Active</p>
          <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-3">
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Disabled</p>
          <p className="text-2xl font-bold text-amber-400">{disabledCount}</p>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-3">
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Deleted</p>
          <p className="text-2xl font-bold text-red-400">{deletedCount}</p>
        </div>
      </div>

      {/* Invite form */}
      <InviteEmployeeForm stores={stores} />

      {/* Error state */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Employee table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 text-stone-400 text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-3">Name</th>
              <th className="text-left px-6 py-3 hidden sm:table-cell">Store</th>
              <th className="text-left px-6 py-3 hidden md:table-cell">Status</th>
              <th className="text-left px-6 py-3 hidden lg:table-cell">Invited</th>
              <th className="text-right px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-stone-500">
                  No employees yet. Send your first invite above.
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const isDeleted = emp.deleted_at !== null
                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors ${
                      isDeleted
                        ? 'opacity-50'
                        : 'hover:bg-stone-800/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${
                          isDeleted
                            ? 'line-through text-stone-500'
                            : 'text-white'
                        }`}
                      >
                        {emp.full_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-400 hidden sm:table-cell">
                      {emp.store_name ?? (
                        <span className="text-stone-600">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <StatusBadge employee={emp} />
                    </td>
                    <td className="px-6 py-4 text-stone-400 hidden lg:table-cell">
                      {formatDate(emp.invited_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <EmployeeActions employee={emp} stores={stores} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
