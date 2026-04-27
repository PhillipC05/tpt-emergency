/**
 * TPT Emergency System - Call Center Dispatch Console
 * @module src/modules/CallCenterConsole.jsx
 * Real-time dispatch console for emergency call handling
 */

import { createSignal, createEffect, For } from 'solid-js'
import { useDispatch } from './CommonDispatchLayer'
import { useResourceTracking } from './ResourceTracking'

export function CallCenterConsole() {
  const dispatch = useDispatch()
  const resources = useResourceTracking()
  
  const [activeCall, setActiveCall] = createSignal(null)
  const [callQueue, setCallQueue] = createSignal([])
  const [selectedIncident, setSelectedIncident] = createSignal(null)
  const [showUnitPanel, setShowUnitPanel] = createSignal(false)
  const [filterStatus, setFilterStatus] = createSignal('all')

  // Simulate incoming call queue
  createEffect(() => {
    setCallQueue([
      { 
        id: 1, 
        callerNumber: '555-0123', 
        location: '123 Main Street', 
        type: 'medical', 
        priority: 3,
        status: 'waiting',
        timestamp: new Date().toISOString(),
        description: 'Male, 45, chest pain'
      },
      { 
        id: 2, 
        callerNumber: '555-0456', 
        location: '45 Oak Avenue', 
        type: 'fire', 
        priority: 2,
        status: 'active',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        description: 'Smoke reported in kitchen'
      },
      { 
        id: 3, 
        callerNumber: '555-0789', 
        location: '789 Pine Road', 
        type: 'traffic', 
        priority: 1,
        status: 'waiting',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        description: 'Vehicle accident, 2 cars'
      }
    ])
  })

  const priorityColors = (priority) => {
    const colors = ['bg-green-600', 'bg-yellow-600', 'bg-orange-600', 'bg-red-600', 'bg-red-800']
    return colors[priority - 1] || 'bg-gray-600'
  }

  const priorityLabels = ['Low', 'Medium', 'High', 'Critical', 'Emergency']

  const typeIcons = {
    medical: '🚑',
    fire: '🔥',
    police: '🚔',
    traffic: '🚗',
    disaster: '🌪️'
  }

  return (
    <div class="h-full flex flex-col bg-gray-900">
      {/* Console Header */}
      <div class="p-4 bg-gray-800 border-b border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold">📞 Call Center Dispatch Console</h2>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-green-600 rounded text-sm">Online</span>
            <span class="text-sm text-gray-400">{callQueue().length} calls waiting</span>
          </div>
        </div>
      </div>

      {/* Main Console Layout */}
      <div class="flex-1 flex">
        {/* Left Panel - Call Queue */}
        <div class="w-80 border-r border-gray-700 flex flex-col">
          <div class="p-3 bg-gray-800/50 border-b border-gray-700">
            <div class="flex gap-2">
              <button 
                onClick={() => setFilterStatus('all')}
                class={`px-3 py-1 rounded text-sm ${filterStatus() === 'all' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterStatus('waiting')}
                class={`px-3 py-1 rounded text-sm ${filterStatus() === 'waiting' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                Waiting
              </button>
              <button 
                onClick={() => setFilterStatus('active')}
                class={`px-3 py-1 rounded text-sm ${filterStatus() === 'active' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                Active
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-2 space-y-2">
            <For each={callQueue().filter(c => filterStatus() === 'all' || c.status === filterStatus())}>
              {call => (
                <div 
                  onClick={() => setActiveCall(call)}
                  class={`p-3 rounded-lg border cursor-pointer transition ${
                    activeCall()?.id === call.id 
                      ? 'bg-blue-900/30 border-blue-500' 
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-lg">{typeIcons[call.type] || '📋'}</span>
                    <span class={`px-2 py-0.5 rounded text-xs ${priorityColors(call.priority)}`}>
                      {priorityLabels[call.priority - 1]}
                    </span>
                    <span class="text-xs text-gray-400">{call.callerNumber}</span>
                  </div>
                  <div class="text-sm font-medium">{call.location}</div>
                  <div class="text-xs text-gray-400 mt-1">{call.description}</div>
                  <div class="text-xs text-gray-500 mt-2">
                    {new Date(call.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Center Panel - Active Call / Dispatch */}
        <div class="flex-1 flex flex-col">
          {activeCall() ? (
            <>
              {/* Active Call Header */}
              <div class="p-4 bg-gray-800/50 border-b border-gray-700">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="flex items-center gap-3">
                      <span class="text-2xl">{typeIcons[activeCall().type]}</span>
                      <div>
                        <div class="font-bold text-lg">Active Call #{activeCall().id}</div>
                        <div class="text-sm text-gray-400">Caller: {activeCall().callerNumber}</div>
                      </div>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button class="px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition">
                      Create Incident
                    </button>
                    <button class="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition">
                      Transfer
                    </button>
                    <button class="px-4 py-2 bg-red-600 rounded hover:bg-red-500 transition">
                      End Call
                    </button>
                  </div>
                </div>
              </div>

              {/* Call Details */}
              <div class="flex-1 p-4 overflow-y-auto">
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div class="p-4 bg-gray-800 rounded-lg">
                    <div class="text-sm text-gray-400 mb-1">Location</div>
                    <div class="font-medium">{activeCall().location}</div>
                  </div>
                  <div class="p-4 bg-gray-800 rounded-lg">
                    <div class="text-sm text-gray-400 mb-1">Incident Type</div>
                    <div class="font-medium capitalize">{activeCall().type}</div>
                  </div>
                  <div class="p-4 bg-gray-800 rounded-lg">
                    <div class="text-sm text-gray-400 mb-1">Priority</div>
                    <div class={`font-medium ${priorityColors(activeCall().priority)} px-2 py-1 rounded inline-block`}>
                      {priorityLabels[activeCall().priority - 1]}
                    </div>
                  </div>
                  <div class="p-4 bg-gray-800 rounded-lg">
                    <div class="text-sm text-gray-400 mb-1">Call Duration</div>
                    <div class="font-medium">03:42</div>
                  </div>
                </div>

                <div class="p-4 bg-gray-800 rounded-lg mb-4">
                  <div class="text-sm text-gray-400 mb-2">Call Description</div>
                  <div>{activeCall().description}</div>
                </div>

                {/* Unit Dispatch Section */}
                <div class="p-4 bg-gray-800 rounded-lg">
                  <div class="flex items-center justify-between mb-3">
                    <div class="font-medium">Available Units</div>
                    <button 
                      onClick={() => setShowUnitPanel(!showUnitPanel())}
                      class="text-sm text-blue-400 hover:text-blue-300"
                    >
                      {showUnitPanel() ? 'Hide' : 'Show All Units'}
                    </button>
                  </div>
                  
                  <div class="space-y-2">
                    <For each={dispatch.getAvailableUnits().slice(0, 5)}>
                      {unit => (
                        <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div>
                            <div class="font-medium">{unit.callSign} - {unit.name}</div>
                            <div class="text-xs text-gray-400">{unit.station || unit.district}</div>
                          </div>
                          <button 
                            onClick={() => dispatch.dispatchUnit(unit.id, activeCall().id)}
                            class="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-500 transition"
                          >
                            Dispatch
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>

              {/* Call Timeline */}
              <div class="p-4 bg-gray-800/50 border-t border-gray-700">
                <div class="text-sm font-medium mb-2">Call Timeline</div>
                <div class="flex gap-4 text-xs text-gray-400">
                  <div class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full bg-green-500"></div>
                    Call received 13:42:15
                  </div>
                  <div class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Location verified 13:42:42
                  </div>
                  <div class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                    Details recorded
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div class="flex-1 flex items-center justify-center text-gray-500">
              <div class="text-center">
                <div class="text-5xl mb-4">📞</div>
                <div class="text-lg">Select a call from the queue</div>
                <div class="text-sm text-gray-600 mt-2">Click on any call to view details and dispatch units</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Active Incidents */}
        <div class="w-72 border-l border-gray-700 flex flex-col">
          <div class="p-3 bg-gray-800/50 border-b border-gray-700 font-medium">
            Active Incidents
          </div>
          <div class="flex-1 overflow-y-auto p-2 space-y-2">
            <For each={dispatch.incidents.slice(0, 8)}>
              {incident => (
                <div 
                  onClick={() => setSelectedIncident(incident)}
                  class={`p-2 rounded-lg cursor-pointer transition ${
                    selectedIncident()?.id === incident.id
                      ? 'bg-blue-900/30 border border-blue-500'
                      : 'bg-gray-800 border border-transparent hover:bg-gray-750'
                  }`}
                >
                  <div class="flex items-center gap-2">
                    <span>{typeIcons[incident.type]}</span>
                    <span class="text-sm font-medium">#{incident.id.toString().slice(0, 6)}</span>
                  </div>
                  <div class="text-xs text-gray-400 mt-1">
                    {incident.assignedUnits?.length || 0} units assigned
                  </div>
                </div>
              )}
            </For>
          </div>

          {/* Dispatch Log */}
          <div class="border-t border-gray-700 p-3 bg-gray-800/50">
            <div class="text-sm font-medium mb-2">Recent Activity</div>
            <div class="space-y-1 text-xs">
              <For each={dispatch.dispatchLog.slice(-5)}>
                {entry => (
                  <div class="text-gray-400">
                    <span class="text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    <div>{entry.message}</div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CallCenterConsole