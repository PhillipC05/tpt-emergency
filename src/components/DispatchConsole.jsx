/* d:\Programming\2 WIP\TPT Open Source\tpt-emergency\src\components\DispatchConsole.jsx */
import { createSignal, createEffect, onMount, For } from 'solid-js'
import { io } from 'socket.io-client'

export function DispatchConsole() {
  const [units, setUnits] = createSignal([])
  const [activeCalls, setActiveCalls] = createSignal([])
  const [messages, setMessages] = createSignal([])
  const [socket, setSocket] = createSignal(null)
  const [selectedUnit, setSelectedUnit] = createSignal(null)

  onMount(() => {
    const socketInstance = io()
    
    socketInstance.on('unit:status', (unit) => {
      setUnits(prev => {
        const existing = prev.find(u => u.id === unit.id)
        if (existing) {
          return prev.map(u => u.id === unit.id ? { ...u, ...unit, lastSeen: Date.now() } : u)
        }
        return [...prev, { ...unit, lastSeen: Date.now() }]
      })
    })

    socketInstance.on('unit:position', (position) => {
      setUnits(prev => prev.map(u => u.id === position.unitId ? {
        ...u,
        latitude: position.latitude,
        longitude: position.longitude,
        heading: position.heading,
        speed: position.speed,
        lastSeen: Date.now()
      } : u))
    })

    socketInstance.on('message:received', (msg) => {
      setMessages(prev => [msg, ...prev])
    })

    setSocket(socketInstance)

    // Simulate test units
    setTimeout(() => {
      setUnits([
        { id: 'unit-1', callsign: 'Fire 1', type: 'fire', status: 'available', lastSeen: Date.now() },
        { id: 'unit-2', callsign: 'Ambulance 3', type: 'ambulance', status: 'enroute', lastSeen: Date.now() },
        { id: 'unit-3', callsign: 'Police 7', type: 'police', status: 'onscene', lastSeen: Date.now() },
        { id: 'unit-4', callsign: 'Rescue 2', type: 'disaster', status: 'available', lastSeen: Date.now() }
      ])
    }, 500)
  })

  const statusColors = {
    available: 'bg-green-600',
    enroute: 'bg-yellow-600',
    onscene: 'bg-red-600',
    busy: 'bg-orange-600',
    offline: 'bg-gray-600'
  }

  const unitColors = {
    fire: 'border-orange-500',
    ambulance: 'border-red-500',
    police: 'border-blue-500',
    disaster: 'border-yellow-500'
  }

  const sendMessage = (unitId, text) => {
    if (socket()) {
      const msg = {
        id: crypto.randomUUID(),
        from: 'dispatch',
        to: unitId,
        text,
        timestamp: Date.now()
      }
      socket().emit('message:send', msg)
      setMessages(prev => [msg, ...prev])
    }
  }

  return (
    <div class="h-full grid grid-cols-3 gap-4 p-4">
      {/* Unit List */}
      <div class="bg-gray-800 rounded-lg overflow-hidden flex flex-col">
        <div class="p-4 border-b border-gray-700 font-semibold flex items-center justify-between">
          <span>📻 Active Units</span>
          <span class="text-sm text-gray-400">{units().length} online</span>
        </div>
        <div class="flex-1 overflow-y-auto">
          <For each={units()}>
            {unit => (
              <div 
                onClick={() => setSelectedUnit(unit)}
                class={`p-3 border-l-4 ${unitColors[unit.type]} ${selectedUnit()?.id === unit.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'} cursor-pointer transition`}
              >
                <div class="flex items-center justify-between">
                  <div class="font-medium">{unit.callsign}</div>
                  <div class={`px-2 py-0.5 rounded text-xs ${statusColors[unit.status]}`}>
                    {unit.status}
                  </div>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  Last seen: {new Date(unit.lastSeen).toLocaleTimeString()}
                  {unit.speed && ` | ${unit.speed} km/h`}
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Active Calls */}
      <div class="bg-gray-800 rounded-lg overflow-hidden flex flex-col">
        <div class="p-4 border-b border-gray-700 font-semibold">
          🚨 Active Calls
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-2">
          <div class="p-3 bg-red-900/30 rounded-lg border border-red-700">
            <div class="font-semibold">INC-2026-0001</div>
            <div class="text-sm text-gray-300">Structure Fire - 123 Main St</div>
            <div class="text-xs text-gray-400 mt-1">
              Assigned: Fire 1, Ambulance 3
            </div>
          </div>
          
          <div class="p-3 bg-yellow-900/30 rounded-lg border border-yellow-700">
            <div class="font-semibold">INC-2026-0002</div>
            <div class="text-sm text-gray-300">Traffic Accident - Highway 1</div>
            <div class="text-xs text-gray-400 mt-1">
              Assigned: Police 7
            </div>
          </div>
        </div>
      </div>

      {/* Communications Panel */}
      <div class="bg-gray-800 rounded-lg overflow-hidden flex flex-col">
        <div class="p-4 border-b border-gray-700 font-semibold">
          💬 Communications
          {selectedUnit() && <span class="text-sm text-gray-400 ml-2">→ {selectedUnit().callsign}</span>}
        </div>
        
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          <For each={messages().slice(0, 20)}>
            {msg => (
              <div class={`p-2 rounded-lg ${msg.from === 'dispatch' ? 'bg-blue-900/30 ml-8' : 'bg-gray-700 mr-8'}`}>
                <div class="text-xs text-gray-400 mb-1">{msg.from} • {new Date(msg.timestamp).toLocaleTimeString()}</div>
                <div class="text-sm">{msg.text}</div>
              </div>
            )}
          </For>
        </div>

        <div class="p-3 border-t border-gray-700">
          <input 
            type="text" 
            placeholder="Send message to unit..."
            class="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value && selectedUnit()) {
                sendMessage(selectedUnit().id, e.currentTarget.value)
                e.currentTarget.value = ''
              }
            }}
            disabled={!selectedUnit()}
          />
        </div>
      </div>
    </div>
  )
}