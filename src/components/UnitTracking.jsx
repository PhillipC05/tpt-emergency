/* d:\Programming\2 WIP\TPT Open Source\tpt-emergency\src\components\UnitTracking.jsx */
import { createSignal, createEffect, onMount, onCleanup, For } from 'solid-js'
import { io } from 'socket.io-client'

export function UnitTracking() {
  const [units, setUnits] = createSignal([])
  const [selectedUnit, setSelectedUnit] = createSignal(null)
  const [history, setHistory] = createSignal({})
  const [socket, setSocket] = createSignal(null)
  const [filterStatus, setFilterStatus] = createSignal('all')

  onMount(() => {
    const socketInstance = io()
    
    socketInstance.on('unit:update', (unit) => {
      setUnits(prev => {
        const existing = prev.find(u => u.id === unit.id)
        if (existing) {
          return prev.map(u => u.id === unit.id ? { ...u, ...unit, lastSeen: Date.now() } : u)
        }
        return [...prev, { ...unit, lastSeen: Date.now() }]
      })

      // Add to position history
      if (unit.latitude && unit.longitude) {
        setHistory(prev => ({
          ...prev,
          [unit.id]: [
            ...(prev[unit.id] || []).slice(-50),
            { lat: unit.latitude, lng: unit.longitude, time: Date.now() }
          ]
        }))
      }
    })

    socketInstance.emit('units:list')
    setSocket(socketInstance)

    // Demo units
    setTimeout(() => {
      setUnits([
        {
          id: 'fire-1',
          callsign: 'Fire 1',
          type: 'fire',
          status: 'onscene',
          latitude: -36.8485,
          longitude: 174.7633,
          speed: 0,
          heading: 180,
          lastSeen: Date.now(),
          personnel: 4,
          equipment: ['Pump', 'Rescue']
        },
        {
          id: 'ambulance-3',
          callsign: 'Ambulance 3',
          type: 'ambulance',
          status: 'enroute',
          latitude: -36.8520,
          longitude: 174.7660,
          speed: 62,
          heading: 90,
          lastSeen: Date.now(),
          personnel: 2,
          equipment: ['ALS', 'Defib']
        },
        {
          id: 'police-7',
          callsign: 'Police 7',
          type: 'police',
          status: 'available',
          latitude: -36.8450,
          longitude: 174.7580,
          speed: 35,
          heading: 0,
          lastSeen: Date.now(),
          personnel: 2,
          equipment: ['Standard Patrol']
        }
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

  const unitIcons = {
    fire: '🚒',
    ambulance: '🚑',
    police: '🚔',
    disaster: '🚛'
  }

  const filteredUnits = () => {
    if (filterStatus() === 'all') return units()
    return units().filter(u => u.status === filterStatus())
  }

  const getElapsedTime = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds/60)}m ago`
    return `${Math.floor(seconds/3600)}h ago`
  }

  return (
    <div class="h-full grid grid-cols-12 gap-4 p-4">
      {/* Unit List Panel */}
      <div class="col-span-3 bg-gray-800 rounded-lg overflow-hidden flex flex-col">
        <div class="p-4 border-b border-gray-700">
          <div class="font-semibold mb-3">🚔 Active Units</div>
          <div class="flex gap-2 text-xs">
            <button 
              onClick={() => setFilterStatus('all')}
              class={`px-2 py-1 rounded ${filterStatus() === 'all' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterStatus('available')}
              class={`px-2 py-1 rounded ${filterStatus() === 'available' ? 'bg-green-600' : 'bg-gray-700'}`}
            >
              Available
            </button>
            <button 
              onClick={() => setFilterStatus('enroute')}
              class={`px-2 py-1 rounded ${filterStatus() === 'enroute' ? 'bg-yellow-600' : 'bg-gray-700'}`}
            >
              Enroute
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <For each={filteredUnits()}>
            {unit => (
              <div 
                onClick={() => setSelectedUnit(unit)}
                class={`p-3 border-l-4 border-${unit.type === 'fire' ? 'orange' : unit.type === 'ambulance' ? 'red' : 'blue'}-500 ${selectedUnit()?.id === unit.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'} cursor-pointer transition`}
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">{unitIcons[unit.type]}</span>
                    <span class="font-medium">{unit.callsign}</span>
                  </div>
                  <div class={`px-2 py-0.5 rounded text-xs ${statusColors[unit.status]}`}>
                    {unit.status}
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-400">
                  <div>📍 {unit.speed ? `${unit.speed} km/h` : 'Stationary'}</div>
                  <div>⏱️ {getElapsedTime(unit.lastSeen)}</div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Map Area */}
      <div class="col-span-6 bg-gray-800 rounded-lg overflow-hidden relative">
        <div class="absolute inset-0 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <div class="text-6xl mb-4">🗺️</div>
            <div class="text-lg font-semibold">Live Unit Position Tracking</div>
            <div class="text-sm mt-2">All units shown in real-time</div>
            <div class="mt-4 text-xs text-gray-600">
              Units update position automatically every second<br />
              Position history tracks last 50 locations
            </div>
          </div>
        </div>

        {/* Unit indicators overlay */}
        <div class="absolute bottom-4 left-4 bg-gray-900/90 p-3 rounded-lg text-xs">
          <div class="font-semibold mb-2">Legend</div>
          <div class="space-y-1">
            <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-green-500"></div> Available</div>
            <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-yellow-500"></div> Enroute</div>
            <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-red-500"></div> On Scene</div>
          </div>
        </div>
      </div>

      {/* Unit Details Panel */}
      <div class="col-span-3 bg-gray-800 rounded-lg overflow-hidden flex flex-col">
        <div class="p-4 border-b border-gray-700 font-semibold">
          📋 Unit Details
        </div>

        <div class="flex-1 p-4 overflow-y-auto">
          {selectedUnit() ? (
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="text-4xl">{unitIcons[selectedUnit().type]}</div>
                <div>
                  <div class="text-xl font-bold">{selectedUnit().callsign}</div>
                  <div class={`inline-block px-2 py-0.5 rounded text-xs ${statusColors[selectedUnit().status]}`}>
                    {selectedUnit().status.toUpperCase()}
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <div class="bg-gray-700/50 p-3 rounded-lg">
                  <div class="text-xs text-gray-400 mb-1">Current Position</div>
                  <div class="font-mono text-sm">{selectedUnit().latitude?.toFixed(6)}, {selectedUnit().longitude?.toFixed(6)}</div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-gray-700/50 p-3 rounded-lg text-center">
                    <div class="text-xs text-gray-400">Speed</div>
                    <div class="text-2xl font-bold">{selectedUnit().speed || 0}</div>
                    <div class="text-xs text-gray-400">km/h</div>
                  </div>
                  <div class="bg-gray-700/50 p-3 rounded-lg text-center">
                    <div class="text-xs text-gray-400">Personnel</div>
                    <div class="text-2xl font-bold">{selectedUnit().personnel || 0}</div>
                    <div class="text-xs text-gray-400">on board</div>
                  </div>
                </div>

                <div class="bg-gray-700/50 p-3 rounded-lg">
                  <div class="text-xs text-gray-400 mb-2">Equipment</div>
                  <div class="flex flex-wrap gap-1">
                    {selectedUnit().equipment?.map(e => (
                      <span class="px-2 py-1 bg-gray-600 rounded text-xs">{e}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div class="space-y-2 pt-4 border-t border-gray-700">
                <button class="w-full px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-500 transition">
                  📡 Send Message
                </button>
                <button class="w-full px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition">
                  🚩 Assign Call
                </button>
              </div>
            </div>
          ) : (
            <div class="h-full flex items-center justify-center text-gray-500">
              Select a unit to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}