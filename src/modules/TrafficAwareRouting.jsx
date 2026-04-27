/**
 * TPT Emergency System - ETA Traffic Aware Routing
 * @module src/modules/TrafficAwareRouting.jsx
 * Intelligent route calculation with real-time traffic and ETA estimation
 */

import { createSignal, onMount, onCleanup, For } from 'solid-js'

export function TrafficAwareRouting() {
  const [activeTab, setActiveTab] = createSignal('active')
  const [routes, setRoutes] = createSignal([])
  const [trafficZones, setTrafficZones] = createSignal([])
  const [activeIncidents, setActiveIncidents] = createSignal([])
  const [units, setUnits] = createSignal([])
  const [selectedRoute, setSelectedRoute] = createSignal(null)
  const [simulating, setSimulating] = createSignal(false)

  const generateMockData = () => {
    const unitList = [
      { id: 'u1', name: 'Ambulance 1', type: 'Ambulance', status: 'responding', eta: 7, destination: 'General Hospital' },
      { id: 'u2', name: 'Engine 3', type: 'Fire Engine', status: 'enroute', eta: 12, destination: '123 Main St' },
      { id: 'u3', name: 'Ambulance 2', type: 'Ambulance', status: 'standby', eta: null, destination: null },
      { id: 'u4', name: 'Rescue 2', type: 'Rescue Unit', status: 'responding', eta: 18, destination: 'Highway 101' },
    ]

    const routeList = [
      {
        id: 'r1',
        unitId: 'u1',
        origin: 'Station 1',
        destination: 'General Hospital',
        distance: 4.2,
        normalEta: 8,
        currentEta: 12,
        trafficDelay: 4,
        status: 'active',
        congestion: 'heavy',
        alternativeRoutes: [
          { name: 'Primary Route', time: 12, distance: 4.2 },
          { name: 'Avoid Highway', time: 10, distance: 5.1 },
          { name: 'Back Roads', time: 14, distance: 6.3 },
        ]
      },
      {
        id: 'r2',
        unitId: 'u2',
        origin: 'Station 3',
        destination: '123 Main St',
        distance: 6.8,
        normalEta: 10,
        currentEta: 12,
        trafficDelay: 2,
        status: 'active',
        congestion: 'moderate',
        alternativeRoutes: [
          { name: 'Primary Route', time: 12, distance: 6.8 },
          { name: 'Oak Ave Bypass', time: 11, distance: 7.2 },
        ]
      },
      {
        id: 'r3',
        unitId: 'u4',
        origin: 'Station 2',
        destination: 'Highway 101',
        distance: 12.5,
        normalEta: 15,
        currentEta: 22,
        trafficDelay: 7,
        status: 'active',
        congestion: 'heavy',
        alternativeRoutes: [
          { name: 'Highway', time: 22, distance: 12.5 },
          { name: 'Surface Streets', time: 19, distance: 14.1 },
        ]
      }
    ]

    const trafficList = [
      { id: 't1', name: 'Downtown Area', status: 'heavy', speed: 15, averageSpeed: 35 },
      { id: 't2', name: 'Highway 101 North', status: 'moderate', speed: 45, averageSpeed: 65 },
      { id: 't3', name: 'Industrial District', status: 'light', speed: 35, averageSpeed: 40 },
      { id: 't4', name: 'Bridge Street', status: 'closed', speed: 0, averageSpeed: 30, reason: 'Accident' },
      { id: 't5', name: 'Westside Boulevard', status: 'moderate', speed: 25, averageSpeed: 35 },
    ]

    const incidentList = [
      { id: 'i1', type: 'accident', location: 'Bridge & 5th', impact: 'road-closed', etaClear: '45 min' },
      { id: 'i2', type: 'congestion', location: 'Highway 101 at Exit 23', impact: 'slow-traffic', etaClear: '90 min' },
      { id: 'i3', type: 'construction', location: 'Oak Avenue between 3rd & 7th', impact: 'lane-reduction', etaClear: '3 hours' },
    ]

    setUnits(unitList)
    setRoutes(routeList)
    setTrafficZones(trafficList)
    setActiveIncidents(incidentList)
  }

  const getCongestionColor = (status) => {
    return {
      'light': 'bg-green-600',
      'moderate': 'bg-yellow-600',
      'heavy': 'bg-orange-600',
      'severe': 'bg-red-600',
      'closed': 'bg-red-800'
    }[status] || 'bg-gray-600'
  }

  const getUnitById = (id) => units().find(u => u.id === id)

  const startSimulation = () => {
    setSimulating(true)
    const interval = setInterval(() => {
      setRoutes(prev => prev.map(route => {
        if (route.currentEta > 0) {
          return { ...route, currentEta: Math.max(0, route.currentEta - Math.random()) }
        }
        return route
      }))
    }, 1000)
    
    onCleanup(() => {
      clearInterval(interval)
      setSimulating(false)
    })
  }

  const rerouteUnit = (routeId, alternativeIndex) => {
    setRoutes(prev => prev.map(route => {
      if (route.id === routeId) {
        const alt = route.alternativeRoutes[alternativeIndex]
        return {
          ...route,
          currentEta: alt.time,
          distance: alt.distance,
          selectedAlternative: alternativeIndex
        }
      }
      return route
    }))
  }

  onMount(() => {
    generateMockData()
  })

  return (
    <div class="p-6 h-full flex flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">🚦 ETA Traffic Aware Routing</h2>
        <div class="flex items-center gap-3">
          <button
            onClick={startSimulation}
            disabled={simulating()}
            class={`px-3 py-1 rounded text-sm ${simulating() ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-500'}`}
          >
            {simulating() ? '⏳ Simulating...' : '▶️ Run Simulation'}
          </button>
        </div>
      </div>

      <div class="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('active')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'active' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Active Routes
        </button>
        <button
          onClick={() => setActiveTab('traffic')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'traffic' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Traffic Conditions
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'incidents' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Road Incidents
        </button>
      </div>

      {activeTab() === 'active' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-4">
            <For each={routes()}>
              {route => {
                const unit = getUnitById(route.unitId)
                return (
                  <div class="bg-gray-800 rounded-lg p-4" onClick={() => setSelectedRoute(route.id === selectedRoute() ? null : route.id)}>
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center gap-3">
                        <span class="font-medium">{unit?.name}</span>
                        <span class={`px-2 py-0.5 rounded text-xs ${getCongestionColor(route.congestion)}`}>
                          {route.congestion.toUpperCase()}
                        </span>
                      </div>
                      <div class="text-2xl font-bold">{Math.round(route.currentEta)} min</div>
                    </div>
                    
                    <div class="grid grid-cols-4 gap-2 text-sm mb-3">
                      <div>
                        <div class="text-gray-400 text-xs">Origin</div>
                        <div>{route.origin}</div>
                      </div>
                      <div>
                        <div class="text-gray-400 text-xs">Destination</div>
                        <div>{route.destination}</div>
                      </div>
                      <div>
                        <div class="text-gray-400 text-xs">Distance</div>
                        <div>{route.distance} km</div>
                      </div>
                      <div>
                        <div class="text-gray-400 text-xs">Delay</div>
                        <div class="text-orange-400">+{route.trafficDelay} min</div>
                      </div>
                    </div>

                    {selectedRoute() === route.id && (
                      <div class="border-t border-gray-700 pt-3 mt-3">
                        <div class="text-sm font-medium mb-2">Alternative Routes</div>
                        <div class="space-y-2">
                          <For each={route.alternativeRoutes}>
                            {(alt, idx) => (
                              <div class={`flex justify-between items-center p-2 rounded ${route.selectedAlternative === idx() ? 'bg-blue-900 border border-blue-500' : 'bg-gray-700'}`}>
                                <span>{alt.name}</span>
                                <div class="flex items-center gap-3">
                                  <span>{alt.time} min</span>
                                  <span class="text-gray-400">{alt.distance} km</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); rerouteUnit(route.id, idx()) }}
                                    class="px-2 py-0.5 bg-blue-600 rounded text-xs hover:bg-blue-500"
                                  >
                                    Reroute
                                  </button>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'traffic' && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-2 gap-3">
            <For each={trafficZones()}>
              {zone => (
                <div class="bg-gray-800 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium">{zone.name}</span>
                    <span class={`px-2 py-0.5 rounded text-xs ${getCongestionColor(zone.status)}`}>
                      {zone.status.toUpperCase()}
                    </span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-400">Current Speed:</span>
                    <span>{zone.speed} km/h</span>
                  </div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-gray-400">Average Speed:</span>
                    <span>{zone.averageSpeed} km/h</span>
                  </div>
                  <div class="h-2 bg-gray-700 rounded overflow-hidden">
                    <div 
                      class={`h-full ${getCongestionColor(zone.status)}`} 
                      style={{ width: `${Math.min((zone.speed / zone.averageSpeed) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'incidents' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-3">
            <For each={activeIncidents()}>
              {incident => (
                <div class="bg-gray-800 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xl">
                        {incident.type === 'accident' && '🚗'}
                        {incident.type === 'congestion' && '🚦'}
                        {incident.type === 'construction' && '🚧'}
                      </span>
                      <span class="font-medium">{incident.type.toUpperCase()}</span>
                    </div>
                    <span class="text-sm text-yellow-400">Clear in {incident.etaClear}</span>
                  </div>
                  <div class="text-sm mb-1">{incident.location}</div>
                  <div class="text-sm text-gray-400">Impact: {incident.impact.replace('-', ' ')}</div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrafficAwareRouting