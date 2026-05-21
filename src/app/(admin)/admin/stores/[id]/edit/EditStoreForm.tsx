'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateStore } from '@/app/actions/stores'
import type { Store } from '@/types/database'

const US_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
]

export default function EditStoreForm({ store }: { store: Store }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isActive, setIsActive] = useState(store.is_active)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    const result = await updateStore(store.id, {
      name: fd.get('name') as string,
      code: fd.get('code') as string,
      timezone: fd.get('timezone') as string,
      is_active: isActive,
    })

    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/admin/stores')
    }
  }

  return (
    <>
      <div className="mb-8">
        <Link href="/admin/stores" className="text-stone-400 hover:text-white text-sm transition-colors">
          ← Back to Stores
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4">Edit Store</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-5">
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1.5">
            Store Name <span className="text-red-400">*</span>
          </label>
          <input
            name="name"
            required
            defaultValue={store.name}
            className="w-full bg-stone-800 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1.5">
            Store Code <span className="text-red-400">*</span>
          </label>
          <input
            name="code"
            required
            defaultValue={store.code}
            className="w-full bg-stone-800 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500 uppercase"
            style={{ textTransform: 'uppercase' }}
          />
          <p className="text-stone-500 text-xs mt-1">Short unique identifier. Will be uppercased.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1.5">
            Timezone <span className="text-red-400">*</span>
          </label>
          <select
            name="timezone"
            defaultValue={store.timezone}
            className="w-full bg-stone-800 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          >
            {US_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-300 mb-2">Status</label>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isActive ? 'bg-amber-500' : 'bg-stone-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="ml-3 text-sm text-stone-400">{isActive ? 'Active' : 'Inactive'}</span>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
          <Link
            href="/admin/stores"
            className="px-5 py-2 rounded-lg text-sm font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}
