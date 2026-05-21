'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createStore } from '@/app/actions/stores'

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

export default function NewStorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    const result = await createStore({
      name: fd.get('name') as string,
      code: fd.get('code') as string,
      timezone: fd.get('timezone') as string,
    })

    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/admin/stores')
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <Link href="/admin/stores" className="text-stone-400 hover:text-white text-sm transition-colors">
          ← Back to Stores
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4">Add Store</h1>
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
            placeholder="Downtown Location"
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
            placeholder="DT01"
            className="w-full bg-stone-800 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500 uppercase"
            style={{ textTransform: 'uppercase' }}
          />
          <p className="text-stone-500 text-xs mt-1">Short unique identifier (e.g. DT01). Will be uppercased.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1.5">
            Timezone <span className="text-red-400">*</span>
          </label>
          <select
            name="timezone"
            defaultValue="America/New_York"
            className="w-full bg-stone-800 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          >
            {US_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Creating…' : 'Create Store'}
          </button>
          <Link
            href="/admin/stores"
            className="px-5 py-2 rounded-lg text-sm font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
