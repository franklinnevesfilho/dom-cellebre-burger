'use client'

import { useState, useTransition } from 'react'
import { inviteEmployee } from '@/app/actions/employees'
import type { Store } from '@/types/database'

interface Props {
  stores: Store[]
}

export default function InviteEmployeeForm({ stores }: Props) {
  const [isPending, startTransition] = useTransition()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [storeId, setStoreId] = useState<string>('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)

    startTransition(async () => {
      const { error } = await inviteEmployee({
        email,
        full_name: fullName,
        store_id: storeId || null,
      })

      if (error) {
        setErrorMsg(error)
      } else {
        setSuccessMsg(`Invite sent to ${email}`)
        setFullName('')
        setEmail('')
        setStoreId('')
      }
    })
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-8">
      <h2 className="text-base font-semibold text-white mb-4">Invite Employee</h2>

      {successMsg && (
        <div className="mb-4 bg-emerald-900/30 border border-emerald-700 text-emerald-300 rounded-lg px-4 py-3 text-sm">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-400 font-medium uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Smith"
            className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-400 font-medium uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-400 font-medium uppercase tracking-wider">
            Store
          </label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="">No store assigned</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {isPending ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
      </form>
    </div>
  )
}
