/**
 * TPT Emergency System - Mutual Aid Coordinator
 * @module src/modules/MutualAidCoordinator.jsx
 * Inter-agency resource sharing and mutual aid request management
 */

import { createSignal, createEffect, onMount, For } from 'solid-js'
import { useDispatch } from './CommonDispatchLayer'

export function MutualAidCoordinator() {
  const dispatch = useDispatch()
  const [requests, setRequests] = createSignal([])
  const [agencies, setAgencies] = createSignal([])
  const [activeRequest, setActiveRequest] = createSignal(null)
  const [showRequestForm, setShowRequestForm] = createSignal(false)
  const [filterStatus, setFilterStatus] = createSignal('all')

  const agencyDatabase = [
    { id: 'agency-1', name: 'Metro Fire Department', type: 'fire', jurisdiction: 'Metro City', distance: 0, availableEngines: 4, availableLadders: 2, availablePersonnel: 32 },
    { id: 'agency-2', name: 'County Sheriff Office', type: 'police', jurisdiction: 'County', distance: 12, availableUnits: 8, availablePersonnel: 24 },
    { id: 'agency-3', name: 'Regional Ambulance Service', type: 'ambulance', jurisdiction: 'Region', distance: 8, availableAmbulances: 6, availablePersonnel: 18 },
    { id: 'agency-4', name: 'North District Fire', type: 'fire', jurisdiction: 'North District', distance: 15, availableEngines: 2, availableLadders: 1, availablePersonnel: 16 },
    { id: 'agency-5', name: 'State Emergency Management', type: 'disaster', jurisdiction: 'State', distance: 45, availableTeams: 3, availablePersonnel: 24 },
    { id: 'agency-6', name: 'Coastal Rescue Team', type: 'ambulance', jurisdiction: 'Coastal Zone', distance: 22, availableBoats: 2, availablePersonnel: 12 }
  ]

  const resourceTypes = {
    fire: [
      { key: 'engines', label: 'Fire Engines', icon: '🚒' },
      { key: 'ladders', label: 'Ladder Trucks', icon: '🚒' },
      { key: 'tankers', label: 'Water Tankers', icon: '🚛' },
      { key: 'personnel', label: 'Personnel', icon: '👨‍🚒' }
    ],
    police: [
      { key: 'patrols', label: 'Patrol Units', icon: '🚔' },
      { key: 'swat', label: 'SWAT Teams', icon: '🛡️' },
      { key: 'k9', label: 'K-9 Units', icon: '🐕' },
      { key: 'personnel', label: 'Officers', icon: '👮' }
    ],
    ambulance: [
      { key: 'ambulances', label: 'Ambulances', icon: '🚑' },
      { key: 'medics', label: 'Paramedics', icon: '🩺' },
      { key: 'helicopters', label: 'MedEvac Helicopters', icon: '🚁' },
      { key: 'personnel', label: 'Personnel', icon: '👩‍⚕️' }
    ],
    disaster: [
      { key: 'teams', label: 'Response Teams', icon: '🌪️' },
      { key: 'vehicles', label: 'Specialized Vehicles', icon: '🚜' },
      { key: 'shelter', label: 'Shelter Units', icon: '⛺' },
      { key: 'personnel', label: 'Personnel', icon: '👷' }
    ]
  }

  const statusColors = {
    pending: 'bg-yellow-600',
    approved: 'bg-green-600',
    enroute: 'bg-blue-600',
    onscene: 'bg-teal-600',
    released: 'bg-gray-600',
    declined: 'bg-red-600'
  }

  const statusLabels = {
    pending: 'Pending',
    approved: 'Approved',
    enroute: 'En Route',
    onscene: 'On Scene',
    released: 'Released',
    declined: 'Declined'
  }

  const createRequest = (requestData) => {
    const request = {
      id: crypto.randomUUID(),
      ...requestData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: []
    }
    setRequests(prev => [request, ...prev])
    window.auditLog?.('incident', `Mutual aid request created: ${request.title}`, { requestId: request.id })
    persist()
  }

  const updateRequestStatus = (requestId, status, notes = '') => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status,
          updatedAt: new Date().toISOString(),
          responses: [...r.responses, { status, notes, timestamp: new Date().toISOString() }]
        }
      }
      return r
    }))
    window.auditLog?.('incident', `Mutual aid request ${requestId.slice(0, 8)} status: ${status}`, { requestId, status })
    persist()
  }

  const respondToRequest = (requestId, agencyId, response) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          responses: [...r.responses, {
            agencyId,
            ...response,
            timestamp: new Date().toISOString()
          }],
          status: response.available ? 'approved' : r.status
        }
      }
      return r
    }))
    window.auditLog?.('incident', `Mutual aid response from ${agencyId}`, { requestId: requestId, agencyId })
    persist()
  }

  const persist = () => {
    localStorage.setItem('mutualaid_requests', JSON.stringify(requests()))
  }

  onMount(() => {
    const stored = localStorage.getItem('mutualaid_requests')
    if (stored) setRequests(JSON.parse(stored))
    setAgencies(agencyDatabase)
  })

  const filteredRequests = () => {
    if (filterStatus() === 'all') return requests()
    return requests().filter(r => r.status === filterStatus())
  }

  const getAgencyById = (id) => agencies().find(a => a.id === id)

  const getAvailableResources = (agency) => {
    const type = resourceTypes[agency.type] || resourceTypes.fire
    return type.map(r => ({
      ...r,
      available: agency[`available${r.key.charAt(0).toUpperCase() + r.key.slice(1)}`] || agency.availablePersonnel || 0
    }))
  }

  return (
    <div class="p-6 h-full flex flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">🤝 Mutual Aid Coordinator</h2>
        <div class="flex gap-2">
          <select
            class="bg-gray-700 px-3 py-1 rounded text-sm"
            value={filterStatus()}
            onInput={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="enroute">En Route</option>
            <option value="onscene">On Scene</option>
            <option value="released">Released</option>
          </select>
          <button
            class="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-500"
            onClick={() => setShowRequestForm(true)}
          >
            + New Request
          </button>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-3 mb-4">
        {['pending', 'approved', 'enroute', 'onscene'].map(status => {
          const count = () => requests().filter(r => r.status === status).length
          return (
            <div class={`p-3 rounded-lg ${statusColors[status]}`}>
              <div class="text-2xl font-bold">{count()}</div>
              <div class="text-sm opacity-90">{statusLabels[status]}</div>
            </div>
          )
        })}
      </div>

      <div class="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        <div class="col-span-7 bg-gray-800 rounded-lg p-4 overflow-auto">
          <h3 class="font-semibold mb-3">Mutual Aid Requests</h3>
          <div class="space-y-2">
            <For each={filteredRequests()}>
              {request => (
                <div
                  class={`p-3 rounded cursor-pointer transition ${activeRequest()?.id === request.id ? 'bg-gray-700 ring-2 ring-blue-500' : 'bg-gray-900 hover:bg-gray-700'}`}
                  onClick={() => setActiveRequest(request)}
                >
                  <div class="flex items-center justify-between mb-1">
                    <div class="font-medium">{request.title}</div>
                    <span class={`px-2 py-0.5 rounded text-xs ${statusColors[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                  </div>
                  <div class="text-sm text-gray-400">
                    {request.type?.toUpperCase()} • {request.jurisdiction} • {new Date(request.createdAt).toLocaleString()}
                  </div>
                  <div class="text-sm mt-1">
                    Requested: {request.resources?.map(r => `${r.quantity} ${r.label}`).join(', ') || 'General assistance'}
                  </div>
                  {request.responses.length > 0 && (
                    <div class="mt-2 flex gap-1">
                      <For each={request.responses}>
                        {resp => (
                          <span class="text-xs px-2 py-0.5 bg-gray-700 rounded">
                            {resp.agencyId ? getAgencyById(resp.agencyId)?.name?.slice(0, 15) || 'Unknown' : 'Update'}: {resp.status}
                          </span>
                        )}
                      </For>
                    </div>
                  )}
                </div>
              )}
            </For>
            {filteredRequests().length === 0 && (
              <div class="text-gray-500 text-center py-8">No mutual aid requests</div>
            )}
          </div>
        </div>

        <div class="col-span-5 bg-gray-800 rounded-lg p-4 overflow-auto">
          {activeRequest() ? (
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="font-semibold">Request Details</h3>
                <div class="flex gap-1">
                  {activeRequest().status !== 'released' && activeRequest().status !== 'declined' && (
                    <>
                      {activeRequest().status === 'pending' && (
                        <button
                          class="px-2 py-1 bg-green-600 rounded text-xs hover:bg-green-500"
                          onClick={() => updateRequestStatus(activeRequest().id, 'approved')}
                        >
                          Approve
                        </button>
                      )}
                      {activeRequest().status === 'approved' && (
                        <button
                          class="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-500"
                          onClick={() => updateRequestStatus(activeRequest().id, 'enroute')}
                        >
                          Mark En Route
                        </button>
                      )}
                      {activeRequest().status === 'enroute' && (
                        <button
                          class="px-2 py-1 bg-teal-600 rounded text-xs hover:bg-teal-500"
                          onClick={() => updateRequestStatus(activeRequest().id, 'onscene')}
                        >
                          Mark On Scene
                        </button>
                      )}
                      <button
                        class="px-2 py-1 bg-gray-600 rounded text-xs hover:bg-gray-500"
                        onClick={() => updateRequestStatus(activeRequest().id, 'released')}
                      >
                        Release
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div class="bg-gray-900 p-3 rounded">
                <div class="text-sm text-gray-400">Incident</div>
                <div class="font-medium">{activeRequest().title}</div>
                <div class="text-sm text-gray-400 mt-1">{activeRequest().description}</div>
              </div>

              <div>
                <div class="text-sm text-gray-400 mb-2">Requested Resources</div>
                <div class="space-y-1">
                  <For each={activeRequest().resources || []}>
                    {resource => (
                      <div class="flex items-center justify-between bg-gray-900 p-2 rounded">
                        <span>{resource.icon} {resource.label}</span>
                        <span class="font-bold">{resource.quantity}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div>
                <div class="text-sm text-gray-400 mb-2">Response Timeline</div>
                <div class="space-y-1">
                  <For each={activeRequest().responses}>
                    {resp => (
                      <div class="flex items-center gap-2 text-sm">
                        <span class="text-gray-500">{new Date(resp.timestamp).toLocaleTimeString()}</span>
                        <span class={`px-2 py-0.5 rounded text-xs ${statusColors[resp.status] || 'bg-gray-600'}`}>
                          {resp.status}
                        </span>
                        {resp.notes && <span class="text-gray-400">{resp.notes}</span>}
                      </div>
                    )}
                  </For>
                  {activeRequest().responses.length === 0 && (
                    <div class="text-gray-500 text-sm">No responses yet</div>
                  )}
                </div>
              </div>

              <div>
                <div class="text-sm text-gray-400 mb-2">Available Partner Agencies</div>
                <div class="space-y-1">
                  <For each={agencies().filter(a => a.type === activeRequest().type)}>
                    {agency => (
                      <div class="flex items-center justify-between bg-gray-900 p-2 rounded">
                        <div>
                          <div class="text-sm font-medium">{agency.name}</div>
                          <div class="text-xs text-gray-400">{agency.distance}km • {agency.availablePersonnel} personnel available</div>
                        </div>
                        <button
                          class="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-500"
                          onClick={() => respondToRequest(activeRequest().id, agency.id, { available: true, resources: getAvailableResources(agency) })}
                        >
                          Request
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          ) : (
            <div class="text-gray-500 text-center py-8">
              <div class="text-4xl mb-2">🤝</div>
              <div>Select a request to view details</div>
            </div>
          )}
        </div>
      </div>

      {showRequestForm() && (
        <div class="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <MutualAidRequestForm
            agencies={agencies()}
            resourceTypes={resourceTypes}
            onSubmit={(data) => {
              createRequest(data)
              setShowRequestForm(false)
            }}
            onClose={() => setShowRequestForm(false)}
          />
        </div>
      )}
    </div>
  )
}

function MutualAidRequestForm(props) {
  const [formData, setFormData] = createSignal({
    title: '',
    description: '',
    type: 'fire',
    jurisdiction: '',
    resources: []
  })
  const [selectedResources, setSelectedResources] = createSignal([])

  const addResource = (key, label, icon) => {
    setSelectedResources(prev => [...prev, { key, label, icon, quantity: 1 }])
  }

  const updateResourceQuantity = (index, quantity) => {
    setSelectedResources(prev => prev.map((r, i) => i === index ? { ...r, quantity: parseInt(quantity) || 0 } : r))
  }

  const removeResource = (index) => {
    setSelectedResources(prev => prev.filter((_, i) => i !== index))
  }

  const submit = (e) => {
    e.preventDefault()
    props.onSubmit({
      ...formData(),
      resources: selectedResources()
    })
  }

  const currentResources = () => props.resourceTypes[formData().type] || []

  return (
    <div class="bg-gray-800 rounded-lg p-6 w-[600px] max-h-[90vh] overflow-auto">
      <h3 class="text-lg font-bold mb-4">Create Mutual Aid Request</h3>

      <form onSubmit={submit} class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Request Title</label>
          <input
            type="text"
            value={formData().title}
            onInput={(e) => setFormData(d => ({ ...d, title: e.target.value }))}
            class="w-full bg-gray-700 rounded px-3 py-2"
            placeholder="e.g., Structure Fire - Additional Engines Needed"
            required
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Resource Type</label>
            <select
              value={formData().type}
              onInput={(e) => {
                setFormData(d => ({ ...d, type: e.target.value }))
                setSelectedResources([])
              }}
              class="w-full bg-gray-700 rounded px-3 py-2"
            >
              <option value="fire">Fire Department</option>
              <option value="police">Police</option>
              <option value="ambulance">Ambulance / EMS</option>
              <option value="disaster">Disaster Response</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Jurisdiction</label>
            <input
              type="text"
              value={formData().jurisdiction}
              onInput={(e) => setFormData(d => ({ ...d, jurisdiction: e.target.value }))}
              class="w-full bg-gray-700 rounded px-3 py-2"
              placeholder="Your jurisdiction"
              required
            />
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            value={formData().description}
            onInput={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
            class="w-full bg-gray-700 rounded px-3 py-2 h-20 resize-none"
            placeholder="Describe the incident and resources needed..."
          />
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-2">Add Resources</label>
          <div class="flex flex-wrap gap-2 mb-3">
            <For each={currentResources()}>
              {resource => (
                <button
                  type="button"
                  onClick={() => addResource(resource.key, resource.label, resource.icon)}
                  class="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
                >
                  + {resource.icon} {resource.label}
                </button>
              )}
            </For>
          </div>

          <div class="space-y-2">
            <For each={selectedResources()}>
              {(resource, index) => (
                <div class="flex items-center gap-2 bg-gray-900 p-2 rounded">
                  <span class="text-lg">{resource.icon}</span>
                  <span class="flex-1">{resource.label}</span>
                  <input
                    type="number"
                    min="1"
                    value={resource.quantity}
                    onInput={(e) => updateResourceQuantity(index(), e.target.value)}
                    class="w-20 bg-gray-700 rounded px-2 py-1 text-center"
                  />
                  <button
                    type="button"
                    onClick={() => removeResource(index())}
                    class="px-2 py-1 bg-red-600 rounded text-xs hover:bg-red-500"
                  >
                    Remove
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={props.onClose}
            class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 font-medium"
          >
            Send Request
          </button>
        </div>
      </form>
    </div>
  )
}

export default MutualAidCoordinator
