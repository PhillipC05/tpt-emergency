/**
 * TPT Emergency System - Geofence Alerting
 * @module src/modules/GeofenceAlerting.jsx
 * Geographic boundary monitoring, zone alerts and location triggers
 */

import { createSignal, onMount, onCleanup, For } from 'solid-js'

export function GeofenceAlerting() {
  const [activeTab, setActiveTab] = createSignal('zones')
  const [geofences, setGeofences] = createSignal([])
  const [alerts, setAlerts] = createSignal([])
  const [units, setUnits] = createSignal([])
  const [selectedZone, setSelectedZone] = createSignal(null)

  const generateMockData = () => {
    const zoneList = [
      {
        id: 'zone-001',
        name: 'Hospital Emergency Entrance',
        type: 'exclusion',
        status: 'active',
        coordinates: { lat: -36.8485, lon: 174.7633 },
        radius: 50,
        units: ['Ambulance 1', 'Ambulance 2'],
        alerts: 12,
        lastAlert: '10 min ago'
      },
      {
        id: 'zone-002',
        name: 'Incident Perimeter - Main St Fire',
        type: 'perimeter',
        status: 'active',
        coordinates: { lat: -36.8520, lon: 174.7680 },
        radius: 200,
        units: ['Engine 3', 'Rescue 2', 'HazMat 1'],
        alerts: 3,
        lastAlert: '45 min ago'
      },
      {
        id: 'zone-003',
        name: 'Hazardous Material Zone',
        type: 'hazard',
        status: 'active',
        coordinates: { lat: -36.8550, lon: 174.7590 },
        radius: 100,
        units: [],
        alerts: 7,
        lastAlert: '2 hours ago'
      },
      {
        id: 'zone-004',
        name: 'Staging Area',
        type: 'assembly',
        status: 'active',
        coordinates: { lat: -36.8500, lon: 174.7650 },
        radius: 75,
        units: ['All Units'],
        alerts: 0,
        lastAlert: 'Never'
      },
      {
        id: 'zone-005',
        name: 'Evacuation Zone North',
        type: 'evacuation',
        status: 'active',
        coordinates: { lat: -36.8580, lon: 174.7700 },
        radius: 500,
        units: ['Police Unit 2'],
        alerts: 2,
        lastAlert: '1 hour ago'
      },
      {
        id: 'zone-006',
        name: 'Helipad Landing Zone',
        type: 'restricted',
        status: 'inactive',
        coordinates: { lat: -36.8450, lon: 174.7550 },
        radius: 30,
        units: [],
        alerts: 0,
        lastAlert: 'Never'
      }
    ]

    const alertList = [
      { id: 'alert-001', zoneId: 'zone-001', unit: 'Ambulance 1', type: 'entry', timestamp: new Date(Date.now() - 600000).toISOString(), acknowledged: true, acknowledgedBy: 'Dispatcher SJ' },
      { id: 'alert-002', zoneId: 'zone-003', unit: 'Engine 3', type: 'entry', timestamp: new Date(Date.now() - 3600000).toISOString(), acknowledged: true, acknowledgedBy: 'Incident Commander' },
      { id: 'alert-003', zoneId: 'zone-002', unit: 'Rescue 2', type: 'exit', timestamp: new Date(Date.now() - 7200000).toISOString(), acknowledged: false, acknowledgedBy: null },
      { id: 'alert-004', zoneId: 'zone-005', unit: 'Police Unit 2', type: 'entry', timestamp: new Date(Date.now() - 1800000).toISOString(), acknowledged: true, acknowledgedBy: 'Dispatcher SJ' },
      { id: 'alert-005', zoneId: 'zone-001', unit: 'Ambulance 2', type: 'exit', timestamp: new Date(Date.now() - 1200000).toISOString(), acknowledged: false, acknowledgedBy: null },
    ]

    const unitList = [
      { id: 'u1', name: 'Ambulance 1', status: 'responding', insideZone: 'zone-001' },
      { id: 'u2', name: 'Engine 3', status: 'on-scene', insideZone: 'zone-002' },
      { id: 'u3', name: 'Rescue 2', status: 'enroute', insideZone: null },
      { id: 'u4', name: 'Ambulance 2', status: 'transporting', insideZone: null },
      { id: 'u5', name: 'Police Unit 2', status: 'on-scene', insideZone: 'zone-005' },
      { id: 'u6', name: 'HazMat 1', status: 'standby', insideZone: 'zone-003' },
    ]

    setGeofences(zoneList)
    setAlerts(alertList)
    setUnits(unitList)
  }

  const getZoneTypeColor = (type) => {
    return {
      'exclusion': 'bg-red-600',
      'perimeter': 'bg-yellow-600',
      'hazard': 'bg-orange-600',
      'assembly': 'bg-green-600',
      'evacuation': 'bg-purple-600',
      'restricted': 'bg-blue-600'
    }[type] || 'bg-gray-600'
  }

  const getAlertTypeColor = (type) => {
    return type === 'entry' ? 'bg-green-600' : 'bg-red-600'
  }

  const getZoneById = (id) => geofences().find(z => z.id === id)

  const toggleZoneStatus = (zoneId) => {
    setGeofences(prev => prev.map(zone => {
      if (zone.id === zoneId) {
        return { ...zone, status: zone.status === 'active' ? 'inactive' : 'active' }
      }
      return zone
    }))
  }

  const acknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === alertId) {
        return { ...alert, acknowledged: true, acknowledgedBy: 'Current User' }
      }
      return alert
    }))
  }

  onMount(() => {
    generateMockData()
    const interval = setInterval(() => {
      setAlerts(prev => {
        if (Math.random() > 0.7) {
          const randomZone = geofences()[Math.floor(Math.random() * geofences().length)]
          const randomUnit = units()[Math.floor(Math.random() * units().length)]
          return [{
            id: `alert-${Date.now()}`,
            zoneId: randomZone.id,
            unit: randomUnit.name,
            type: Math.random() > 0.5 ? 'entry' : 'exit',
            timestamp: new Date().toISOString(),
            acknowledged: false,
            acknowledgedBy: null
          }, ...prev].slice(0, 50)
        }
        return prev
      })
    }, 30000)
    onCleanup(() => clearInterval(interval))
  })

  return (
    <div class="p-6 h-full flex flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">🗺️ Geofence Alerting</h2>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 bg-green-600 rounded text-sm">Active Zones: {geofences().filter(z => z.status === 'active').length}</span>
          <span class="px-3 py-1 bg-red-600 rounded text-sm">Pending Alerts: {alerts().filter(a => !a.acknowledged).length}</span>
        </div>
      </div>

      <div class="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('zones')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'zones' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Geofence Zones
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'alerts' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Alert History
        </button>
        <button
          onClick={() => setActiveTab('units')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'units' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Unit Locations
        </button>
      </div>

      {activeTab() === 'zones' && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-2 gap-3">
            <For each={geofences()}>
              {zone => (
                <div class={`bg-gray-800 rounded-lg p-4 ${selectedZone() === zone.id ? 'border border-blue-500' : ''}`} onClick={() => setSelectedZone(zone.id === selectedZone() ? null : zone.id)}>
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class={`px-2 py-0.5 rounded text-xs ${getZoneTypeColor(zone.type)}`}>
                        {zone.type.toUpperCase()}
                      </span>
                      <span class="font-medium">{zone.name}</span>
                      <span class={`px-2 py-0.5 rounded text-xs ${zone.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}`}>
                        {zone.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2 text-sm mb-2">
                    <div>
                      <div class="text-gray-400 text-xs">Radius</div>
                      <div>{zone.radius}m</div>
                    </div>
                    <div>
                      <div class="text-gray-400 text-xs">Total Alerts</div>
                      <div>{zone.alerts}</div>
                    </div>
                    <div>
                      <div class="text-gray-400 text-xs">Last Alert</div>
                      <div>{zone.lastAlert}</div>
                    </div>
                  </div>

                  {selectedZone() === zone.id && (
                    <div class="border-t border-gray-700 pt-3 mt-2">
                      <div class="text-xs font-medium mb-2">Assigned Units:</div>
                      <div class="flex flex-wrap gap-1 mb-3">
                        {zone.units.length > 0 ? zone.units.map(unit => (
                          <span class="px-2 py-0.5 bg-gray-700 rounded text-xs">{unit}</span>
                        )) : <span class="text-gray-500 text-xs">No units assigned</span>}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleZoneStatus(zone.id) }}
                        class={`w-full py-1 rounded text-xs ${zone.status === 'active' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
                      >
                        {zone.status === 'active' ? 'Deactivate Zone' : 'Activate Zone'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'alerts' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-2">
            <For each={alerts().slice(0, 15)}>
              {alert => {
                const zone = getZoneById(alert.zoneId)
                return (
                  <div class={`bg-gray-800 rounded-lg p-3 ${!alert.acknowledged ? 'border-l-4 border-red-500' : ''}`}>
                    <div class="flex items-center justify-between mb-1">
                      <div class="flex items-center gap-2">
                        <span class={`px-2 py-0.5 rounded text-xs ${getAlertTypeColor(alert.type)}`}>
                          {alert.type.toUpperCase()}
                        </span>
                        <span class="font-medium">{alert.unit}</span>
                        <span class="text-sm">{zone?.name || alert.zoneId}</span>
                      </div>
                      <span class="text-xs text-gray-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      {alert.acknowledged ? (
                        <span class="text-xs text-green-400">✓ Acknowledged by {alert.acknowledgedBy}</span>
                      ) : (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          class="px-2 py-0.5 bg-blue-600 rounded text-xs hover:bg-blue-500"
                        >
                          Acknowledge Alert
                        </button>
                      )}
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'units' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-2">
            <For each={units()}>
              {unit => {
                const currentZone = unit.insideZone ? getZoneById(unit.insideZone) : null
                return (
                  <div class="bg-gray-800 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <span class={`w-2 h-2 rounded-full ${unit.status === 'on-scene' ? 'bg-green-500 animate-pulse' : unit.status === 'responding' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                        <span class="font-medium">{unit.name}</span>
                      </div>
                      <span class="text-sm capitalize">{unit.status.replace('-', ' ')}</span>
                    </div>
                    <div class="text-sm">
                      {currentZone ? (
                        <span>Inside: <span class="text-green-400">{currentZone.name}</span></span>
                      ) : (
                        <span class="text-gray-400">No active zone</span>
                      )}
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      )}
    </div>
  )
}

export default GeofenceAlerting