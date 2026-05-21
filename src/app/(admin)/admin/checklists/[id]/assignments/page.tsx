import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AssignmentToggle from './AssignmentToggle'
import type { ChecklistStoreAssignment, Store } from '@/types/database'

export default async function AssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [checklistResult, storesResult, assignmentsResult] = await Promise.all([
    supabase.from('checklists').select('id, title').eq('id', id).single(),
    supabase.from('stores').select('*').order('name'),
    supabase
      .from('checklist_store_assignments')
      .select('*')
      .eq('checklist_id', id),
  ])

  const checklist = checklistResult.data as { id: string; title: string } | null
  const stores = storesResult.data
  const assignments = assignmentsResult.data

  if (!checklist) notFound()

  const assignedStoreIds = new Set((assignments as ChecklistStoreAssignment[] ?? []).map((a) => a.store_id))

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link
          href={`/admin/checklists/${id}/edit`}
          className="text-stone-400 hover:text-white text-sm transition-colors"
        >
          ← Back to Edit
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4">Store Assignments</h1>
        <p className="text-stone-400 mt-1">
          Assign <span className="text-amber-400">{checklist.title}</span> to stores.
        </p>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 text-stone-400 text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-3">Store</th>
              <th className="text-left px-6 py-3">Code</th>
              <th className="text-right px-6 py-3">Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {!stores || stores.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-stone-500">
                  No stores found.{' '}
                  <Link href="/admin/stores/new" className="text-amber-400 hover:underline">
                    Add a store first
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              (stores as Store[]).map((store) => (
                <tr key={store.id} className="hover:bg-stone-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{store.name}</p>
                    {!store.is_active && (
                      <span className="text-xs text-stone-500">(inactive)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-stone-300 font-mono">{store.code}</td>
                  <td className="px-6 py-4 text-right">
                    <AssignmentToggle
                      checklistId={id}
                      storeId={store.id}
                      assigned={assignedStoreIds.has(store.id)}
                    />
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
