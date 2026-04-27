/**
 * TPT Emergency System - Resource Maintenance Logging
 * @module src/modules/ResourceMaintenanceLogging.jsx
 * Equipment maintenance tracking, service logs and asset management
 */

import { createSignal, onMount, For } from 'solid-js'

export function ResourceMaintenanceLogging() {
  const [activeTab, setActiveTab] = createSignal('overview')
  const [assets, setAssets] = createSignal([])
  const [maintenanceLogs, setMaintenanceLogs] = createSignal([])
  const [serviceSchedule, setServiceSchedule] = createSignal([])
  const [selectedAsset, setSelectedAsset] = createSignal(null)

  const generateMockData = () => {
    const assetList = [
      {
        id: 'asset-001',
        name: 'Ambulance 1',
        type: 'vehicle',
        status: 'operational',
        mileage: 124587,
        lastService: '2026-04-10',
        nextService: '2026-05-10',
        hours: 8742,
        manufacturer: 'Mercedes-Benz',
        model: 'Sprinter 319',
        year: 2022,
        inspections: ['Brakes: Passed', 'Tires: 75%', 'Fluids: OK'],
        issues: []
      },
      {
        id: 'asset-002',
        name: 'Engine 3',
        type: 'vehicle',
        status: 'operational',
        mileage: 98234,
        lastService: '2026-04-15',
        nextService: '2026-05-20',
        hours: 6234,
        manufacturer: 'Pierce',
        model: 'Velocity Pumper',
        year: 2021,
        inspections: ['Pump: Tested', 'Ladder: Certified', 'Systems: Normal'],
        issues: ['Minor hydraulic leak']
      },
      {
        id: 'asset-003',
        name: 'Defibrillator AED-1',
        type: 'equipment',
        status: 'operational',
        lastService: '2026-03-20',
        nextService: '2026-06-20',
        manufacturer: 'Physio-Control',
        model: 'LIFEPAK 15',
        serial: 'AED-78234',
        inspections: ['Battery: 92%', 'Pads: Expires 2026-11', 'Self-test: Passed'],
        issues: []
      },
      {
        id: 'asset-004',
        name: 'Rescue 2',
        type: 'vehicle',
        status: 'service',
        mileage: 156892,
        lastService: '2026-04-01',
        nextService: '2026-04-27',
        hours: 11256,
        manufacturer: 'Ford',
        model: 'F-550',
        year: 2020,
        inspections: [],
        issues: ['Transmission service required', 'Brake replacement']
      },
      {
        id: 'asset-005',
        name: 'Breathing Apparatus Set 7',
        type: 'equipment',
        status: 'inspection',
        lastService: '2026-02-14',
        nextService: '2026-05-14',
        manufacturer: 'MSA',
        model: 'G1 SCBA',
        serial: 'SCBA-45218',
        inspections: ['Cylinder: Hydro test due'],
        issues: ['Facepiece seal worn']
      },
      {
        id: 'asset-006',
        name: 'Jaws of Life Set',
        type: 'equipment',
        status: 'operational',
        lastService: '2026-04-05',
        nextService: '2026-07-05',
        manufacturer: 'Hurst',
        model: 'eDraulic',
        serial: 'JOL-9872',
        inspections: ['Hydraulic pressure: OK', 'Battery: Full'],
        issues: []
      }
    ]

    const logList = [
      { id: 'log-1', assetId: 'asset-002', date: '2026-04-22', type: 'repair', description: 'Replaced left rear brake pads', technician: 'M. Johnson', hours: 3.5, cost: 485.00 },
      { id: 'log-2', assetId: 'asset-001', date: '2026-04-20', type: 'inspection', description: 'Completed 5000km scheduled service', technician: 'J. Williams', hours: 2.0, cost: 320.00 },
      { id: 'log-3', assetId: 'asset-004', date: '2026-04-18', type: 'repair', description: 'Transmission flush and filter replacement', technician: 'R. Davis', hours: 6.5, cost: 1250.00 },
      { id: 'log-4', assetId: 'asset-003', date: '2026-04-15', type: 'calibration', description: 'Annual defibrillator calibration and testing', technician: 'Biomed Svc', hours: 1.5, cost: 175.00 },
      { id: 'log-5', assetId: 'asset-005', date: '2026-04-12', type: 'inspection', description: 'Hydrostatic cylinder testing failed - replacement ordered', technician: 'Safety Officer', hours: 1.0, cost: 0.00 },
    ]

    const scheduleList = [
      { id: 'sched-1', assetId: 'asset-001', type: 'service', dueDate: '2026-05-10', description: '5000km Scheduled Maintenance', priority: 'normal' },
      { id: 'sched-2', assetId: 'asset-004', type: 'repair', dueDate: '2026-04-27', description: 'Brake system overhaul', priority: 'high' },
      { id: 'sched-3', assetId: 'asset-005', type: 'replacement', dueDate: '2026-05-14', description: 'Replace SCBA cylinder', priority: 'urgent' },
      { id: 'sched-4', assetId: 'asset-002', type: 'inspection', dueDate: '2026-05-20', description: 'Annual pump performance test', priority: 'normal' },
    ]

    setAssets(assetList)
    setMaintenanceLogs(logList)
    setServiceSchedule(scheduleList)
  }

  const getStatusColor = (status) => {
    return {
      'operational': 'bg-green-600',
      'inspection': 'bg-yellow-600',
      'service': 'bg-orange-600',
      'outofservice': 'bg-red-600',
      'retired': 'bg-gray-600'
    }[status] || 'bg-gray-600'
  }

  const getPriorityColor = (priority) => {
    return {
      'low': 'bg-gray-600',
      'normal': 'bg-blue-600',
      'high': 'bg-orange-600',
      'urgent': 'bg-red-600'
    }[priority] || 'bg-gray-600'
  }

  const getLogTypeColor = (type) => {
    return {
      'inspection': 'bg-blue-600',
      'repair': 'bg-orange-600',
      'calibration': 'bg-green-600',
      'replacement': 'bg-purple-600',
      'service': 'bg-yellow-600'
    }[type] || 'bg-gray-600'
  }

  const getAssetById = (id) => assets().find(a => a.id === id)

  const daysUntilService = (dueDate) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
    return diff
  }

  onMount(() => {
    generateMockData()
  })

  return (
    <div class="p-6 h-full flex flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">🔧 Resource Maintenance Logging</h2>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 bg-green-600 rounded text-sm">Operational: {assets().filter(a => a.status === 'operational').length}</span>
          <span class="px-3 py-1 bg-orange-600 rounded text-sm">Service: {assets().filter(a => a.status === 'service' || a.status === 'inspection').length}</span>
        </div>
      </div>

      <div class="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('overview')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'overview' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Asset Overview
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'logs' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Maintenance Logs
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'schedule' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Service Schedule
        </button>
      </div>

      {activeTab() === 'overview' && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-2 gap-3">
            <For each={assets()}>
              {asset => (
                <div class={`bg-gray-800 rounded-lg p-4 ${selectedAsset() === asset.id ? 'border border-blue-500' : ''}`} onClick={() => setSelectedAsset(asset.id === selectedAsset() ? null : asset.id)}>
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xl">{asset.type === 'vehicle' ? '🚒' : '📦'}</span>
                      <span class="font-medium">{asset.name}</span>
                      <span class={`px-2 py-0.5 rounded text-xs ${getStatusColor(asset.status)}`}>
                        {asset.status.toUpperCase().replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2 text-sm mb-2">
                    <div>
                      <div class="text-gray-400 text-xs">Type</div>
                      <div class="capitalize">{asset.type}</div>
                    </div>
                    <div>
                      <div class="text-gray-400 text-xs">Last Service</div>
                      <div>{asset.lastService}</div>
                    </div>
                    <div>
                      <div class="text-gray-400 text-xs">Next Service</div>
                      <div class={daysUntilService(asset.nextService) < 7 ? 'text-red-400' : ''}>{asset.nextService}</div>
                    </div>
                  </div>

                  {selectedAsset() === asset.id && (
                    <div class="border-t border-gray-700 pt-3 mt-2">
                      <div class="text-sm text-gray-400 mb-2">{asset.manufacturer} {asset.model} ({asset.year})</div>
                      {asset.mileage && <div class="text-sm">Mileage: {asset.mileage.toLocaleString()} km</div>}
                      {asset.hours && <div class="text-sm">Engine Hours: {asset.hours}</div>}
                      <div class="mt-2">
                        <div class="text-xs font-medium mb-1">Inspections:</div>
                        <div class="space-y-1">
                          <For each={asset.inspections}>
                            {inspection => <div class="text-xs text-green-400">✓ {inspection}</div>}
                          </For>
                        </div>
                      </div>
                      {asset.issues.length > 0 && (
                        <div class="mt-2">
                          <div class="text-xs font-medium mb-1">Outstanding Issues:</div>
                          <div class="space-y-1">
                            <For each={asset.issues}>
                              {issue => <div class="text-xs text-orange-400">⚠️ {issue}</div>}
                            </For>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'logs' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-2">
            <For each={maintenanceLogs}>
              {log => {
                const asset = getAssetById(log.assetId)
                return (
                  <div class="bg-gray-800 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-3">
                        <span class={`px-2 py-0.5 rounded text-xs ${getLogTypeColor(log.type)}`}>
                          {log.type.toUpperCase()}
                        </span>
                        <span class="font-medium">{asset?.name || log.assetId}</span>
                        <span class="text-sm text-gray-400">{log.date}</span>
                      </div>
                      <span class="font-mono">${log.cost.toFixed(2)}</span>
                    </div>
                    <div class="text-sm mb-1">{log.description}</div>
                    <div class="flex justify-between text-xs text-gray-500">
                      <span>Technician: {log.technician}</span>
                      <span>Labour: {log.hours} hours</span>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'schedule' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-2">
            <For each={serviceSchedule}>
              {item => {
                const asset = getAssetById(item.assetId)
                const days = daysUntilService(item.dueDate)
                return (
                  <div class={`bg-gray-800 rounded-lg p-4 ${days < 7 ? 'border-l-4 border-red-500' : ''}`}>
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-3">
                        <span class={`px-2 py-0.5 rounded text-xs ${getPriorityColor(item.priority)}`}>
                          {item.priority.toUpperCase()}
                        </span>
                        <span class="font-medium">{asset?.name || item.assetId}</span>
                        <span class="text-sm capitalize">{item.type}</span>
                      </div>
                      <div class="text-right">
                        <div class={`font-mono ${days < 7 ? 'text-red-400' : ''}`}>{item.dueDate}</div>
                        <div class="text-xs text-gray-400">{days} days</div>
                      </div>
                    </div>
                    <div class="text-sm">{item.description}</div>
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

export default ResourceMaintenanceLogging