'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createChecklist } from '@/app/actions/checklists'

interface ItemDraft {
  label: string
  sort_order: number
}

export default function NewChecklistPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([{ label: '', sort_order: 0 }])

  function addItem() {
    setItems((prev) => [...prev, { label: '', sort_order: prev.length }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, sort_order: i })))
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    const next = [...items]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= next.length) return
    ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]
    setItems(next.map((item, i) => ({ ...item, sort_order: i })))
  }

  function updateLabel(index: number, label: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, label } : item)))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    const validItems = items.filter((i) => i.label.trim())

    const result = await createChecklist({
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      items: validItems,
    })

    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      const created = result.data as { id: string } | null
      router.push(`/admin/checklists/${created?.id}/edit`)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/admin/checklists" className="text-stone-400 hover:text-white text-sm transition-colors">
          ← Back to Checklists
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4">New Checklist</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              required
              placeholder="Opening Checklist"
              className="w-full bg-stone-800 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">Description</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Optional description…"
              className="w-full bg-stone-800 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500 resize-none"
            />
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Checklist Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="text-stone-500 hover:text-stone-300 disabled:opacity-30 text-xs leading-none"
                    aria-label="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                    className="text-stone-500 hover:text-stone-300 disabled:opacity-30 text-xs leading-none"
                    aria-label="Move down"
                  >
                    ▼
                  </button>
                </div>
                <span className="text-stone-600 text-xs w-5 text-center">{index + 1}</span>
                <input
                  value={item.label}
                  onChange={(e) => updateLabel(index, e.target.value)}
                  placeholder={`Item ${index + 1}`}
                  className="flex-1 bg-stone-800 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-stone-500 hover:text-red-400 transition-colors text-sm px-1"
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-stone-500 text-sm text-center py-4">
                No items yet.{' '}
                <button type="button" onClick={addItem} className="text-amber-400 hover:underline">
                  Add one
                </button>
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Creating…' : 'Create Checklist'}
          </button>
          <Link
            href="/admin/checklists"
            className="px-5 py-2 rounded-lg text-sm font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
