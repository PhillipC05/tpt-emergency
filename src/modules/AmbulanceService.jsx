/**
 * TPT Emergency System - Ambulance Service Module
 * @module src/modules/AmbulanceService.jsx
 */

import { createEffect, createMemo, For } from 'solid-js'
import { useDispatch } from './CommonDispatchLayer'

export function AmbulanceServiceModule() {
  const dispatch = useDispatch()
  
  const ambulanceUnits = createMemo(() => dispatch.units.filter(u => u.type === 'ambulance'))
  const activeCalls = createMemo(() => dispatch.incidents.filter(i => i.type === 'ambulance'))
  const unitsDeployed = createMemo(() => ambulanceUnits().filter(u => u.status === dispatch.UNIT_STATUS.DISPATCHED || u.status === dispatch.UNIT_STATUS.ON_SCENE).length)
  const unitsAvailable = createMemo(() => ambulanceUnits().filter(u => u.status === dispatch.UNIT_STATUS.AVAILABLE).length)
  const unitsOnScene = createMemo(() => ambulanceUnits().filter(u => u.status === dispatch.UNIT_STATUS.ON_SCENE).length)
  const unitsTransporting = createMemo(() => ambulanceUnits().filter(u => u.status === 'transporting').length)

  createEffect(() => {
    console.log('✅ Ambulance Service Module loaded with shared dispatch system')
  })

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'bg-green-600'
      case 'dispatched': return 'bg-amber-600'
      case 'on_scene': return 'bg-red-600'
      case 'transporting': return 'bg-purple-600'
      case 'returning': return 'bg-blue-600'
      case 'out_of_service': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'available': return 'Available'
      case 'dispatched': return 'Dispatched'
      case 'on_scene': return 'On Scene'
      case 'transporting': return 'Transporting'
      case 'returning': return 'Returning'
      case 'out_of_service': return 'Out Of Service'
      default: return status
    }
  }

  return (
    <div class="p-6 h-full overflow-auto">
      <h2 class="text-2xl font-bold mb-4">🚑 Ambulance Service</h2>
      
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div class="bg-red-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold">{activeCalls().length}</div>
          <div class="text-sm text-red-300">Active Calls</div>
        </div>
        <div class="bg-red-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold">{unitsAvailable()}</div>
          <div class="text-sm text-red-300">Available</div>
        </div>
        <div class="bg-red-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold">{unitsDeployed()}</div>
          <div class="text-sm text-red-300">Dispatched</div>
        </div>
        <div class="bg-red-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold">{unitsOnScene()}</div>
          <div class="text-sm text-red-300">On Scene</div>
        </div>
        <div class="bg-red-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold">{unitsTransporting()}</div>
          <div class="text-sm text-red-300">Transporting</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div class="lg:col-span-2 bg-gray-800 rounded-lg p-5">
          <h3 class="font-semibold mb-4">Ambulance Units</h3>
          <div class="space-y-2">
            <For each={ambulanceUnits()}>
              {unit => (
                <div class="flex items-center justify-between p-3 bg-gray-700/50 rounded hover:bg-gray-700/70 transition">
                  <div class="flex items-center gap-3">
                    <div class={`w-3 h-3 rounded-full ${getStatusColor(unit.status)}`}></div>
                    <div>
                      <div class="font-medium">{unit.callSign} - {unit.name}</div>
                      <div class="text-xs text-gray-400">{unit.station}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class={`px-2 py-1 rounded text-xs ${getStatusColor(unit.status)}`}>
                      {getStatusText(unit.status)}
                    </span>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="bg-gray-800 rounded-lg p-5">
          <h3 class="font-semibold mb-4">Active Medical Calls</h3>
          <div class="space-y-3">
            <For each={activeCalls()}>
              {incident => (
                <div class="p-3 bg-red-900/30 rounded border border-red-800/50">
                  <div class="font-medium">Incident #{incident.id.toString().slice(0, 8)}</div>
                  <div class="text-xs text-gray-400 mt-1">
                    {new Date(incident.timestamp).toLocaleString()}
                  </div>
                  <div class="flex items-center gap-2 mt-2">
                    <span class="text-xs text-gray-400">Units assigned:</span>
                    <span class="text-sm">{incident.assignedUnits?.length || 0}</span>
                  </div>
                </div>
              )}
            </For>
            {activeCalls().length === 0 && (
              <div class="text-center text-gray-500 py-8">
                No active medical incidents
              </div>
            )}
          </div>
        </div>

      </div>

      <div class="grid grid-cols-2 gap-6 mt-6">
        <div class="bg-gray-800 rounded-lg p-5">
          <h3 class="font-semibold mb-4">Capabilities</h3>
          <ul class="space-y-2 text-gray-400 text-sm">
            <li>✅ Patient Triage System</li>
            <li>✅ Hospital Diversion Status</li>
            <li>✅ Vital Signs Monitoring</li>
            <li>✅ ETA Calculation</li>
            <li>✅ Medical Resource Tracking</li>
            <li>✅ Emergency Medical Dispatch Protocol</li>
            <li>✅ Ambulance Status Board</li>
            <li>✅ Patient Transport Logging</li>
          </ul>
        </div>

        <div class="bg-gray-800 rounded-lg p-5">
          <h3 class="font-semibold mb-4">Recent Dispatch Log</h3>
          <div class="space-y-2 max-h-48 overflow-auto">
            <For each={dispatch.dispatchLog.slice(-8).reverse()}>
              {entry => (
                <div class="text-sm py-1 border-b border-gray-700">
                  <div class="text-gray-300">{entry.message}</div>
                  <div class="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</div>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>

    </div>
  )
}

export default AmbulanceServiceModule