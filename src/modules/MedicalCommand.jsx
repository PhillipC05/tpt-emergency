import { createSignal, createEffect, onMount, For } from 'solid-js'
import { useDispatch } from './CommonDispatchLayer'

export function MedicalCommand() {
  const dispatch = useDispatch()
  const [activeMCI, setActiveMCI] = createSignal(null)
  const [patients, setPatients] = createSignal([])
  const [hospitals, setHospitals] = createSignal([])

  const triageColors = {
    immediate: { color: 'bg-red-600', label: 'IMMEDIATE', icon: '🔴' },
    delayed: { color: 'bg-yellow-500', label: 'DELAYED', icon: '🟡' },
    minor: { color: 'bg-green-600', label: 'MINOR', icon: '🟢' },
    expectant: { color: 'bg-gray-600', label: 'EXPECTANT', icon: '⚫' },
    deceased: { color: 'bg-black', label: 'DECEASED', icon: '⬛' },
    transported: { color: 'bg-blue-600', label: 'TRANSPORTED', icon: '🚑' }
  }

  const hospitalDatabase = [
    { id: 1, name: 'General Hospital', er_beds: 12, available_beds: 5, trauma_level: 1, distance: 3.2, travel_time: 8 },
    { id: 2, name: 'Medical Center', er_beds: 18, available_beds: 9, trauma_level: 2, distance: 5.7, travel_time: 12 },
    { id: 3, name: 'University Hospital', er_beds: 24, available_beds: 7, trauma_level: 1, distance: 7.1, travel_time: 15 },
    { id: 4, name: 'Community Hospital', er_beds: 8, available_beds: 3, trauma_level: 3, distance: 2.4, travel_time: 6 },
    { id: 5, name: 'Children\'s Hospital', er_beds: 15, available_beds: 11, trauma_level: 2, distance: 9.3, travel_time: 18 }
  ]

  const addPatient = (triage, description = '') => {
    const patient = {
      id: crypto.randomUUID(),
      triageTag: triage,
      description,
      incidentId: activeMCI()?.id,
      timestamp: new Date().toISOString(),
      location: null,
      assignedAmbulance: null,
      destinationHospital: null,
      transportTime: null,
      status: 'waiting'
    }

    setPatients(prev => [...prev, patient])
    window.auditLog?.('incident', `Patient registered: ${triage} priority`, { triage })
  }

  const assignHospital = (patientId, hospitalId) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId 
        ? { ...p, destinationHospital: hospitalId, status: 'assigned' }
        : p
    ))
  }

  const markTransported = (patientId) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId 
        ? { ...p, status: 'transported', transportTime: new Date().toISOString() }
        : p
    ))
    window.auditLog?.('incident', 'Patient transported')
  }

  const triageCounts = () => {
    const counts = { immediate: 0, delayed: 0, minor: 0, expectant: 0, deceased: 0, transported: 0 }
    patients().forEach(p => {
      counts[p.status === 'transported' ? 'transported' : p.triageTag]++
    })
    return counts
  }

  return (
    <div class="p-6 h-full flex flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">🩺 Medical Command & MCI</h2>
        
        <button 
          class="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-500"
          onClick={() => {
            setActiveMCI({
              id: crypto.randomUUID(),
              name: `MCI ${new Date().toLocaleString()}`,
              startedAt: new Date().toISOString()
            })
            window.auditLog?.('system', 'Mass Casualty Incident declared')
          }}
        >
          🚨 Declare MCI
        </button>
      </div>

      {activeMCI() && (
        <div class="mb-4 bg-red-900/50 border border-red-600 rounded-lg p-3">
          <div class="flex items-center justify-between">
            <div class="font-bold">⚠️ ACTIVE MASS CASUALTY INCIDENT</div>
            <button 
              class="px-3 py-1 bg-gray-700 rounded text-xs"
              onClick={() => {
                setActiveMCI(null)
                window.auditLog?.('system', 'MCI stood down')
              }}
            >
              Stand Down
            </button>
          </div>
        </div>
      )}

      <div class="grid grid-cols-6 gap-2 mb-4">
        <For each={Object.entries(triageColors)}>
          {([tag, info]) => (
            <div class={`p-3 rounded ${info.color}`}>
              <div class="text-xl">{info.icon}</div>
              <div class="text-2xl font-bold">{triageCounts()[tag]}</div>
              <div class="text-xs">{info.label}</div>
            </div>
          )}
        </For>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-4">
        <button 
          class="p-3 bg-red-600 rounded font-bold hover:bg-red-500"
          onClick={() => addPatient('immediate')}
        >
          🔴 Add IMMEDIATE Patient
        </button>
        <button 
          class="p-3 bg-yellow-500 rounded font-bold hover:bg-yellow-400 text-black"
          onClick={() => addPatient('delayed')}
        >
          🟡 Add DELAYED Patient
        </button>
        <button 
          class="p-3 bg-green-600 rounded font-bold hover:bg-green-500"
          onClick={() => addPatient('minor')}
        >
          🟢 Add MINOR Patient
        </button>
      </div>

      <div class="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        <div class="col-span-7 bg-gray-800 rounded-lg p-4 overflow-auto">
          <h3 class="font-semibold mb-3">Patient Tracking</h3>
          
          <div class="space-y-2">
            <For each={patients().slice(0, 30)}>
              {patient => (
                <div class="p-2 bg-gray-700 rounded flex items-center gap-3">
                  <span class="text-lg">{triageColors[patient.triageTag].icon}</span>
                  <div class="flex-1">
                    <div class="font-medium">Patient #{patient.id.slice(0, 8)}</div>
                    <div class="text-xs text-gray-400">{new Date(patient.timestamp).toLocaleTimeString()}</div>
                  </div>
                  
                  <span class={`px-2 py-0.5 rounded text-xs ${triageColors[patient.status === 'transported' ? 'transported' : patient.triageTag].color}`}>
                    {patient.status === 'transported' ? 'TRANSPORTED' : triageColors[patient.triageTag].label}
                  </span>

                  {patient.status !== 'transported' && (
                    <button 
                      class="px-2 py-0.5 bg-blue-600 rounded text-xs hover:bg-blue-500"
                      onClick={() => markTransported(patient.id)}
                    >
                      🚑 Transport
                    </button>
                  )}
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="col-span-5 bg-gray-800 rounded-lg p-4 overflow-auto">
          <h3 class="font-semibold mb-3">Hospital Capacity</h3>
          
          <div class="space-y-2">
            <For each={hospitalDatabase}>
              {hospital => (
                <div class="p-2 bg-gray-700 rounded">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium">{hospital.name}</div>
                      <div class="text-xs text-gray-400">Trauma Level {hospital.trauma_level} • {hospital.distance}km ({hospital.travel_time}min)</div>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-green-400">{hospital.available_beds} available</div>
                      <div class="text-xs text-gray-400">/ {hospital.er_beds} beds</div>
                    </div>
                  </div>
                  <div class="mt-1 h-2 bg-gray-600 rounded overflow-hidden">
                    <div 
                      class={`h-full ${(hospital.er_beds - hospital.available_beds) / hospital.er_beds > 0.7 ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${((hospital.er_beds - hospital.available_beds) / hospital.er_beds) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MedicalCommand