/* d:\Programming\2 WIP\TPT Open Source\tpt-emergency\src\components\IncidentTimeline.jsx */
import { createSignal, createEffect, onMount, For } from 'solid-js'

export function IncidentTimeline(props) {
  const [events, setEvents] = createSignal([])
  const [filter, setFilter] = createSignal('all')

  const eventTypes = {
    'incident:create': { icon: '🚨', color: 'border-red-500', bg: 'bg-red-900/20' },
    'unit:assign': { icon: '🚒', color: 'border-orange-500', bg: 'bg-orange-900/20' },
    'unit:arrive': { icon: '✅', color: 'border-green-500', bg: 'bg-green-900/20' },
    'status:update': { icon: '📋', color: 'border-blue-500', bg: 'bg-blue-900/20' },
    'message:send': { icon: '💬', color: 'border-gray-500', bg: 'bg-gray-700/20' },
    'patient:update': { icon: '🩺', color: 'border-pink-500', bg: 'bg-pink-900/20' }
  }

  onMount(() => {
    // Demo timeline data
    setEvents([
      {
        id: 'evt-1',
        type: 'incident:create',
        timestamp: Date.now() - 1800000,
        user: 'Dispatch',
        message: 'Incident created: Structure Fire, 123 Main St',
        data: { incidentId: 'INC-2026-0001' }
      },
      {
        id: 'evt-2',
        type: 'unit:assign',
        timestamp: Date.now() - 1740000,
        user: 'Dispatch',
        message: 'Assigned Fire 1 to incident',
        data: { unitId: 'fire-1' }
      },
      {
        id: 'evt-3',
        type: 'unit:assign',
        timestamp: Date.now() - 1710000,
        user: 'Dispatch',
        message: 'Assigned Ambulance 3 to incident',
        data: { unitId: 'ambulance-3' }
      },
      {
        id: 'evt-4',
        type: 'unit:arrive',
        timestamp: Date.now() - 1200000,
        user: 'Fire 1',
        message: 'Unit arrived on scene',
        data: { unitId: 'fire-1' }
      },
      {
        id: 'evt-5',
        type: 'status:update',
        timestamp: Date.now() - 900000,
        user: 'Fire 1',
        message: 'Fire contained, performing search and rescue',
        data: { status: 'contained' }
      },
      {
        id: 'evt-6',
        type: 'patient:update',
        timestamp: Date.now() - 600000,
        user: 'Ambulance 3',
        message: '1 patient transported to General Hospital',
        data: { patients: 1 }
      }
    ])
  })

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getElapsed = (timestamp) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes/60)}h ${minutes%60}m ago`
  }

  const filteredEvents = () => {
    if (filter() === 'all') return events()
    return events().filter(e => e.type.startsWith(filter()))
  }

  return (
    <div class="h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden">
      <div class="p-4 border-b border-gray-700">
        <div class="font-semibold mb-3">📜 Incident Timeline</div>
        <div class="flex gap-2 flex-wrap text-xs">
          <button 
            onClick={() => setFilter('all')}
            class={`px-2 py-1 rounded ${filter() === 'all' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            All Events
          </button>
          <button 
            onClick={() => setFilter('incident')}
            class={`px-2 py-1 rounded ${filter() === 'incident' ? 'bg-red-600' : 'bg-gray-700'}`}
          >
            Incidents
          </button>
          <button 
            onClick={() => setFilter('unit')}
            class={`px-2 py-1 rounded ${filter() === 'unit' ? 'bg-orange-600' : 'bg-gray-700'}`}
          >
            Units
          </button>
          <button 
            onClick={() => setFilter('message')}
            class={`px-2 py-1 rounded ${filter() === 'message' ? 'bg-gray-600' : 'bg-gray-700'}`}
          >
            Messages
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <div class="relative">
          {/* Timeline line */}
          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700"></div>

          <For each={filteredEvents()}>
            {event => {
              const style = eventTypes[event.type] || eventTypes['status:update']
              return (
                <div class="relative pl-10 pb-6">
                  {/* Event dot */}
                  <div class={`absolute left-2 w-5 h-5 rounded-full ${style.bg} border-2 ${style.color} flex items-center justify-center text-xs`}>
                    {style.icon}
                  </div>

                  <div class={`${style.bg} rounded-lg p-3 border-l-2 ${style.color}`}>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm font-medium">{event.user}</span>
                      <span class="text-xs text-gray-400">{formatTime(event.timestamp)}</span>
                    </div>
                    <div class="text-sm text-gray-300">{event.message}</div>
                    <div class="text-xs text-gray-500 mt-1">{getElapsed(event.timestamp)}</div>
                  </div>
                </div>
              )
            }}
          </For>
        </div>
      </div>
    </div>
  )
}