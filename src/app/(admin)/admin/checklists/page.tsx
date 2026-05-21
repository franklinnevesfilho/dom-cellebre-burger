import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ChecklistActions from './ChecklistActions'
import type { Checklist, ChecklistItem } from '@/types/database'

type ChecklistWithItems = Checklist & { checklist_items: ChecklistItem[] }

export default async function ChecklistsPage() {
  const supabase = await createClient()
  const { data: raw, error } = await supabase
    .from('checklists')
    .select('*, checklist_items(*)')
    .order('created_at', { ascending: false })

  const checklists = (raw as unknown as ChecklistWithItems[] | null) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Checklists</h1>
          <p className="text-stone-400 mt-1">Create and manage opening checklists.</p>
        </div>
        <Link
          href="/admin/checklists/new"
          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + New Checklist
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">
          {error.message}
        </div>
      )}

      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 text-stone-400 text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-3">Title</th>
              <th className="text-left px-6 py-3">Items</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-right px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {!checklists || checklists.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-stone-500">
                  No checklists yet.{' '}
                  <Link href="/admin/checklists/new" className="text-amber-400 hover:underline">
                    Create your first checklist
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              checklists.map((checklist) => {
                const items = checklist.checklist_items ?? []
                const activeItems = items.filter((i) => i.is_active).length
                return (
                  <tr key={checklist.id} className="hover:bg-stone-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{checklist.title}</p>
                      {checklist.description && (
                        <p className="text-stone-500 text-xs mt-0.5 line-clamp-1">{checklist.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-stone-300">
                      {activeItems} item{activeItems !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4">
                      {checklist.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-500 inline-block" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChecklistActions checklist={checklist} />
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
