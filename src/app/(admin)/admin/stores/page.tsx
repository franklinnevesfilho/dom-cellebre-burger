import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StoreActions from './StoreActions'
import type { Store } from '@/types/database'

export default async function StoresPage() {
  const supabase = await createClient()
  const { data: raw, error } = await supabase.from('stores').select('*').order('name')
  const stores = (raw as unknown as Store[] | null) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Stores</h1>
          <p className="text-stone-400 mt-1">Manage restaurant locations and settings.</p>
        </div>
        <Link
          href="/admin/stores/new"
          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add Store
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">
          {error?.message}
        </div>
      )}

      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 text-stone-400 text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-3">Name</th>
              <th className="text-left px-6 py-3">Code</th>
              <th className="text-left px-6 py-3">Timezone</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-right px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {!stores || stores.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-stone-500">
                  No stores yet.{' '}
                  <Link href="/admin/stores/new" className="text-amber-400 hover:underline">
                    Add your first store
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr key={store.id} className="hover:bg-stone-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{store.name}</td>
                  <td className="px-6 py-4 text-stone-300 font-mono">{store.code}</td>
                  <td className="px-6 py-4 text-stone-300">{store.timezone}</td>
                  <td className="px-6 py-4">
                    {store.is_active ? (
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
                    <StoreActions store={store} />
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
