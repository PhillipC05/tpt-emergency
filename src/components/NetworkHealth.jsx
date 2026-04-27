import { createSignal, createEffect, onCleanup } from 'solid-js'
import { db } from '../lib/offline-db'

export function NetworkHealth() {
  const [units, setUnits] = createSignal([])
  const [expanded, setExpanded] = createSignal(false)
  let updateInterval

  const loadUnitStatus = async () => {
    const allUnits = await db.units.orderBy('last_seen').reverse().toArray()
    setUnits(allUnits)
  }

  createEffect(() => {
    loadUnitStatus()
    updateInterval = setInterval(loadUnitStatus, 5000)

    return () => clearInterval(updateInterval)
  })

  onCleanup(() => clearInterval(updateInterval))

  const getConnectionStatus = (unit) => {
    const age = Date.now() - unit.last_seen

    if (age < 30000) return { status: 'online', color: 'bg-green-500', text: 'Online' }
    if (age < 120000) return { status: 'warning', color: 'bg-yellow-500', text: 'Lagged' }
    return { status: 'offline', color: 'bg-red-500', text: 'Offline' }
  }

  const onlineCount = () => units().filter(u => (Date.now() - u.last_seen) < 30000).length
  const totalCount = () => units().length

  return (
    <div class="fixed bottom-6 left-6 z-40">
      <div
        class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden cursor-pointer"
        onClick={() => setExpanded(!expanded())}
      >
        <div class="px-4 py-2 flex items-center gap-3">
          <div class={`w-3 h-3 rounded-full ${onlineCount() > 0 ? 'bg-green-500' : 'bg-red-500'} ${onlineCount() > 0 && onlineCount() < totalCount() ? 'animate-pulse' : ''}`}></div>
          <div class="text-sm">
            <div class="font-medium">Network</div>
            <div class="text-xs text-gray-400">{onlineCount()} / {totalCount()} units online</div>
          </div>
        </div>

        {expanded() && (
          <div class="border-t border-gray-700 max-h-64 overflow-auto">
            {units().map(unit => {
              const status = getConnectionStatus(unit)
              return (
                <div class="px-4 py-2 border-b border-gray-700/50 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class={`w-2 h-2 rounded-full ${status.color}`}></div>
                    <div>
                      <div class="text-sm font-medium">{unit.callsign}</div>
                      <div class="text-xs text-gray-500">{unit.type}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class={`text-xs ${status.color.replace('bg-', 'text-')}`}>{status.text}</div>
                    <div class="text-xs text-gray-500">
                      {unit.battery_level !== undefined ? `${Math.round(unit.battery_level * 100)}% 🔋` : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}