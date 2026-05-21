'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateChecklist, updateChecklistItems } from '@/app/actions/checklists'
import type { Checklist, ChecklistItem } from '@/types/database'

interface ItemDraft {
  id?: string
  label: string
  sort_order: number
  is_active: boolean
}

interface ChecklistWithItems extends Checklist {
  checklist_items?: ChecklistItem[]
}

export default function EditChecklistForm({
  checklist,
  initialItems,
}: {
  checklist: ChecklistWithItems
  initialItems: ChecklistItem[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isActive, setIsActive] = useState(checklist.is_active)
  const [items, setItems] = useState<ItemDraft[]>(
    initialItems.map((i) => ({
      id: i.id,
      label: i.label,
      sort_order: i.sort_order,
      is_active: i.is_active,
    })),
  )

  function addItem() {
    setItems((prev) => [
      ...prev,
      { label: '', sort_order: prev.length, is_active: true },
    ])
  }

  function removeOrDeactivate(index: number) {
    const item = items[index]
    if (item.id) {
      // existing item — mark inactive
      setItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, is_active: false } : it)),
      )
    } else {
      // new item — just remove
      setItems((prev) =>
        prev.filter((_, i) => i !== index).map((it, i) => ({ ...it, sort_order: i })),
      )
    }
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    const activeIndexes = items.reduce<number[]>((indexes, item, itemIndex) => {
      if (item.is_active) indexes.push(itemIndex)
      return indexes
    }, [])
    const activeIndex = activeIndexes.indexOf(index)
    if (activeIndex === -1) return

    const swapActiveIndex = direction === 'up' ? activeIndex - 1 : activeIndex + 1
    if (swapActiveIndex < 0 || swapActiveIndex >= activeIndexes.length) return

    const next = [...items]
    const swapIdx = activeIndexes[swapActiveIndex]
    ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]

    let activeSortOrder = 0
    setItems(
      next.map((item) =>
        item.is_active ? { ...item, sort_order: activeSortOrder++ } : item
      ),
    )
  }

  function updateLabel(index: number, label: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, label } : item)))
  }

  const visibleItems = items
    .map((item, realIdx) => ({ item, realIdx }))
    .filter(({ item }) => item.is_active)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.currentTarget)

    const [r1, r2] = await Promise.all([
      updateChecklist(checklist.id, {
        title: fd.get('title') as string,
        description: fd.get('description') as string,
        is_active: isActive,
      }),
      updateChecklistItems(checklist.id, items),
    ])

    setLoading(false)
    if (r1.error || r2.error) {
      setError(r1.error ?? r2.error ?? 'Failed to save')
    } else {
      router.push('/admin/checklists')
    }
  }

  return (
    <>
      <div className="mb-8">
        <Link href="/admin/checklists" className="text-stone-400 hover:text-white text-sm transition-colors">
          ← Back to Checklists
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4">Edit Checklist</h1>
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
              defaultValue={checklist.title}
              className="w-full bg-stone-800 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">Description</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={checklist.description ?? ''}
              placeholder="Optional description…"
              className="w-full bg-stone-800 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500 resize-none"
            />
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
            {visibleItems.length === 0 && (
              <p className="text-stone-500 text-sm text-center py-4">
                No active items.{' '}
                <button type="button" onClick={addItem} className="text-amber-400 hover:underline">
                  Add one
                </button>
              </p>
            )}
            {visibleItems.map(({ item, realIdx }, visibleIdx) => {
              return (
                <div key={item.id ?? `new-${visibleIdx}`} className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveItem(realIdx, 'up')}
                      disabled={visibleIdx === 0}
                      className="text-stone-500 hover:text-stone-300 disabled:opacity-30 text-xs leading-none"
                      aria-label="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(realIdx, 'down')}
                      disabled={visibleIdx === visibleItems.length - 1}
                      className="text-stone-500 hover:text-stone-300 disabled:opacity-30 text-xs leading-none"
                      aria-label="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <span className="text-stone-600 text-xs w-5 text-center">{visibleIdx + 1}</span>
                  <input
                    value={item.label}
                    onChange={(e) => updateLabel(realIdx, e.target.value)}
                    placeholder={`Item ${visibleIdx + 1}`}
                    className="flex-1 bg-stone-800 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeOrDeactivate(realIdx)}
                    className="text-stone-500 hover:text-red-400 transition-colors text-sm px-1"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
          <Link
            href="/admin/checklists"
            className="px-5 py-2 rounded-lg text-sm font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            Cancel
          </Link>
          <Link
            href={`/admin/checklists/${checklist.id}/assignments`}
            className="ml-auto px-4 py-2 rounded-lg text-sm font-medium text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors border border-stone-800"
          >
            Manage Assignments →
          </Link>
        </div>
      </form>
    </>
  )
}
