import { createSignal, createEffect } from 'solid-js'
import { db } from '../lib/offline-db'

export function GlobalUndo() {
  const [undoCount, setUndoCount] = createSignal(0)

  createEffect(async () => {
    const count = await db.undo_log.count()
    setUndoCount(count)
  })

  const undoLast = async () => {
    const last = await db.undo_log.orderBy('id').reverse().first()
    
    if (!last) return

    // Execute undo operation
    switch (last.action) {
      case 'incident_update':
        await db.incidents.update(last.data.id, last.data.previous)
        break
      case 'incident_status_change':
        await db.incidents.update(last.data.incident_id, { status: last.data.previous_status })
        break
      case 'unit_assigned':
        // Remove unit assignment
        break
    }

    // Remove from undo log
    await db.undo_log.delete(last.id)

    setUndoCount(prev => prev - 1)
  }

  if (undoCount() === 0) return null

  return (
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <button
        onClick={undoLast}
        class="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg shadow-xl flex items-center gap-2 hover:bg-gray-600"
      >
        <span>↩️</span>
        <span class="font-medium">Undo Last Action</span>
        <span class="px-2 py-0.5 bg-gray-800 rounded text-sm">{undoCount()}</span>
      </button>
    </div>
  )
}