import { createSignal, createEffect, onMount, For } from 'solid-js'
import { useDispatch } from './CommonDispatchLayer'

export function PersonnelProvider(props) {
  const [personnel, setPersonnel] = createSignal([])
  const [musteringEvents, setMusteringEvents] = createSignal([])
  const dispatch = useDispatch()

  const registerPerson = (person) => {
    const newPerson = {
      id: crypto.randomUUID(),
      name: person.name,
      callsign: person.callsign,
      role: person.role,
      agency: person.agency,
      radioId: person.radioId,
      beaconId: person.beaconId,
      status: 'available',
      location: null,
      lastCheckIn: null,
      assignedUnit: null,
      createdAt: new Date().toISOString(),
      ...person
    }

    setPersonnel(prev => [...prev, newPerson])
    window.auditLog?.('user', `Personnel registered: ${person.name}`, { personId: newPerson.id })
    persist()
  }

  const updateStatus = (personId, status, location = null) => {
    setPersonnel(prev => prev.map(p => 
      p.id === personId 
        ? { ...p, status, lastCheckIn: new Date().toISOString(), location }
        : p
    ))
    persist()
  }

  const startMuster = (incidentId, description) => {
    const muster = {
      id: crypto.randomUUID(),
      incidentId,
      description,
      status: 'active',
      createdAt: new Date().toISOString(),
      responses: {}
    }

    setMusteringEvents(prev => [muster, ...prev])
    window.auditLog?.('system', `Muster initiated: ${description}`, { incidentId })
    
    return muster
  }

  const respondToMuster = (musterId, personId, status, location = null) => {
    setMusteringEvents(prev => prev.map(m => {
      if (m.id === musterId) {
        return {
          ...m,
          responses: {
            ...m.responses,
            [personId]: {
              status,
              location,
              timestamp: new Date().toISOString()
            }
          }
        }
      }
      return m
    }))

    updateStatus(personId, status === 'accounted' ? 'on-scene' : status, location)
  }

  const persist = () => {
    localStorage.setItem('personnel', JSON.stringify(personnel()))
  }

  onMount(() => {
    const stored = localStorage.getItem('personnel')
    if (stored) setPersonnel(JSON.parse(stored))
  })

  return (
    <props.children 
      personnel={{
        personnel,
        musteringEvents,
        registerPerson,
        updateStatus,
        startMuster,
        respondToMuster
      }}
    />
  )
}

export function PersonnelAccountabilityViewer() {
  const dispatch = useDispatch()
  const [showRegister, setShowRegister] = createSignal(false)
  const [newPerson, setNewPerson] = createSignal({ name: '', callsign: '', role: '', agency: '' })

  const statusColors = {
    available: 'bg-green-600',
    'on-scene': 'bg-blue-600',
    assigned: 'bg-yellow-600',
    resting: 'bg-gray-600',
    unaccounted: 'bg-red-600',
    injured: 'bg-orange-600'
  }

  const statusLabels = {
    available: 'Available',
    'on-scene': 'On Scene',
    assigned: 'Assigned',
    resting: 'Resting',
    unaccounted: '⚠️ Unaccounted',
    injured: '🩹 Injured'
  }

  return (
    <div class="p-6 h-full flex flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">Personnel Accountability</h2>
        
        <div class="flex gap-2">
          <button 
            class="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-500"
            onClick={() => {
              const muster = dispatch?.personnel?.startMuster(null, 'General Roll Call')
              window.auditLog?.('system', 'Manual muster initiated')
            }}
          >
            📢 Initiate Muster
          </button>
          
          <button 
            class="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
            onClick={() => setShowRegister(true)}
          >
            + Add Personnel
          </button>
        </div>
      </div>

      <div class="grid grid-cols-6 gap-3 mb-4">
        <For each={Object.entries(statusLabels)}>
          {([status, label]) => {
            const count = () => dispatch?.personnel?.personnel().filter(p => p.status === status).length || 0
            return (
              <div class={`p-3 rounded-lg ${statusColors[status]}`}>
                <div class="text-2xl font-bold">{count()}</div>
                <div class="text-sm opacity-90">{label}</div>
              </div>
            )
          }}
        </For>
      </div>

      <div class="flex-1 overflow-auto bg-gray-800 rounded-lg">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="text-left p-3 text-sm text-gray-400">Callsign</th>
              <th class="text-left p-3 text-sm text-gray-400">Name</th>
              <th class="text-left p-3 text-sm text-gray-400">Role</th>
              <th class="text-left p-3 text-sm text-gray-400">Agency</th>
              <th class="text-left p-3 text-sm text-gray-400">Status</th>
              <th class="text-left p-3 text-sm text-gray-400">Last Check-in</th>
              <th class="text-right p-3 text-sm text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            <For each={dispatch?.personnel?.personnel() || []}>
              {person => (
                <tr class="hover:bg-gray-700/50">
                  <td class="p-3 font-medium">{person.callsign}</td>
                  <td class="p-3">{person.name}</td>
                  <td class="p-3">{person.role}</td>
                  <td class="p-3">{person.agency}</td>
                  <td class="p-3">
                    <span class={`px-2 py-0.5 rounded text-xs ${statusColors[person.status]}`}>
                      {statusLabels[person.status]}
                    </span>
                  </td>
                  <td class="p-3 text-sm text-gray-400">
                    {person.lastCheckIn ? new Date(person.lastCheckIn).toLocaleString() : 'Never'}
                  </td>
                  <td class="p-3 text-right">
                    <div class="flex justify-end gap-1">
                      <button 
                        class="px-2 py-0.5 bg-gray-700 rounded text-xs hover:bg-gray-600"
                        onClick={() => dispatch?.personnel?.updateStatus(person.id, 'available')}
                      >
                        Check In
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>

      {showRegister() && (
        <div class="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div class="bg-gray-800 rounded-lg p-6 w-96">
            <h3 class="text-lg font-bold mb-4">Register Personnel</h3>
            
            <div class="space-y-3">
              <input 
                placeholder="Full Name"
                class="w-full p-2 bg-gray-700 rounded"
                value={newPerson().name}
                onInput={(e) => setNewPerson(p => ({ ...p, name: e.target.value }))}
              />
              <input 
                placeholder="Callsign"
                class="w-full p-2 bg-gray-700 rounded"
                value={newPerson().callsign}
                onInput={(e) => setNewPerson(p => ({ ...p, callsign: e.target.value }))}
              />
              <input 
                placeholder="Role / Rank"
                class="w-full p-2 bg-gray-700 rounded"
                value={newPerson().role}
                onInput={(e) => setNewPerson(p => ({ ...p, role: e.target.value }))}
              />
              <input 
                placeholder="Agency / Department"
                class="w-full p-2 bg-gray-700 rounded"
                value={newPerson().agency}
                onInput={(e) => setNewPerson(p => ({ ...p, agency: e.target.value }))}
              />
            </div>

            <div class="flex justify-end gap-2 mt-4">
              <button 
                class="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
                onClick={() => setShowRegister(false)}
              >
                Cancel
              </button>
              <button 
                class="px-3 py-1 bg-green-600 rounded hover:bg-green-500"
                onClick={() => {
                  dispatch?.personnel?.registerPerson(newPerson())
                  setNewPerson({ name: '', callsign: '', role: '', agency: '' })
                  setShowRegister(false)
                }}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonnelAccountabilityViewer