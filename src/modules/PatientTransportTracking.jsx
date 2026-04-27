/**
 * TPT Emergency System - Patient Transport Tracking
 * @module src/modules/PatientTransportTracking.jsx
 * Patient transport monitoring, tracking and handoff management
 */

import { createSignal, onMount, onCleanup, For } from 'solid-js'

export function PatientTransportTracking() {
  const [activeTab, setActiveTab] = createSignal('active')
  const [transports, setTransports] = createSignal([])
  const [selectedTransport, setSelectedTransport] = createSignal(null)
  const [hospitals, setHospitals] = createSignal([])
  const [patientLog, setPatientLog] = createSignal([])

  const generateMockData = () => {
    const transportList = [
      {
        id: 't1',
        patientId: 'P1001',
        patientName: 'Robert Johnson',
        age: 62,
        priority: 'emergency',
        complaint: 'Chest Pain',
        unit: 'Ambulance 1',
        crew: ['John Smith', 'Emily Davis'],
        origin: '123 Main St',
        destination: 'General Hospital',
        status: 'enroute',
        eta: 8,
        distance: 5.2,
        vitals: { bp: '158/92', hr: 112, spo2: 94, temp: 37.2 },
        ecg: true,
        oxygen: 4,
        iv: true,
        medications: ['Aspirin', 'Nitroglycerin'],
        notifications: true,
        createdAt: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: 't2',
        patientId: 'P1002',
        patientName: 'Mary Williams',
        age: 45,
        priority: 'urgent',
        complaint: 'Fall Injury',
        unit: 'Ambulance 2',
        crew: ['Michael Brown', 'Lisa Anderson'],
        origin: '456 Oak Ave',
        destination: 'Memorial Hospital',
        status: 'at-scene',
        eta: 22,
        distance: 12.8,
        vitals: { bp: '132/84', hr: 96, spo2: 98, temp: 36.8 },
        ecg: false,
        oxygen: 0,
        iv: false,
        medications: [],
        notifications: true,
        createdAt: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 't3',
        patientId: 'P1003',
        patientName: 'James Wilson',
        age: 38,
        priority: 'normal',
        complaint: 'Fractured Arm',
        unit: 'Ambulance 3',
        crew: ['Robert Taylor', 'Jennifer Martinez'],
        origin: '789 Pine Rd',
        destination: 'General Hospital',
        status: 'transporting',
        eta: 15,
        distance: 8.5,
        vitals: { bp: '126/80', hr: 88, spo2: 97, temp: 37.0 },
        ecg: false,
        oxygen: 2,
        iv: true,
        medications: ['Morphine'],
        notifications: false,
        createdAt: new Date(Date.now() - 900000).toISOString()
      }
    ]

    const hospitalList = [
      { id: 'h1', name: 'General Hospital', status: 'open', capacity: 85, erWait: 12, trauma: true, cardiac: true, stroke: true },
      { id: 'h2', name: 'Memorial Hospital', status: 'open', capacity: 62, erWait: 25, trauma: true, cardiac: false, stroke: true },
      { id: 'h3', name: 'St. Mary Medical Center', status: 'diverting', capacity: 95, erWait: 45, trauma: false, cardiac: true, stroke: false },
      { id: 'h4', name: 'University Medical Center', status: 'open', capacity: 71, erWait: 18, trauma: true, cardiac: true, stroke: true },
    ]

    const logEntries = [
      { time: '08:45:12', transport: 't1', event: 'Dispatched', user: 'Dispatcher SJ' },
      { time: '08:48:32', transport: 't1', event: 'On Scene', user: 'Ambulance 1' },
      { time: '08:52:05', transport: 't1', event: 'Patient Contact', user: 'Paramedic JS' },
      { time: '08:55:18', transport: 't1', event: 'IV Started', user: 'Paramedic ED' },
      { time: '08:57:42', transport: 't1', event: 'Medication Administered: Aspirin', user: 'Paramedic JS' },
      { time: '09:01:30', transport: 't1', event: 'Transporting', user: 'Ambulance 1' },
      { time: '09:02:15', transport: 't1', event: 'ETA Updated: 8 min', user: 'System' },
    ]

    setTransports(transportList)
    setHospitals(hospitalList)
    setPatientLog(logEntries)
  }

  const getPriorityColor = (priority) => {
    return {
      'routine': 'bg-gray-600',
      'normal': 'bg-blue-600',
      'urgent': 'bg-yellow-600',
      'emergency': 'bg-red-600'
    }[priority] || 'bg-gray-600'
  }

  const getStatusColor = (status) => {
    return {
      'dispatched': 'bg-blue-600',
      'at-scene': 'bg-yellow-600',
      'transporting': 'bg-orange-600',
      'enroute': 'bg-orange-500',
      'arrived': 'bg-green-600',
      'completed': 'bg-gray-600'
    }[status] || 'bg-gray-600'
  }

  const getHospitalStatusColor = (status) => {
    return {
      'open': 'bg-green-600',
      'diverting': 'bg-yellow-600',
      'full': 'bg-red-600',
      'closed': 'bg-gray-600'
    }[status] || 'bg-gray-600'
  }

  const updateETAs = () => {
    setTransports(prev => prev.map(transport => {
      if (transport.eta > 0) {
        return { ...transport, eta: Math.max(0, transport.eta - Math.random() * 0.5) }
      }
      return transport
    }))
  }

  onMount(() => {
    generateMockData()
    const interval = setInterval(updateETAs, 30000)
    onCleanup(() => clearInterval(interval))
  })

  return (
    <div class="p-6 h-full flex flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">🚑 Patient Transport Tracking</h2>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 bg-red-600 rounded text-sm">Active: {transports().length}</span>
        </div>
      </div>

      <div class="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('active')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'active' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Active Transports
        </button>
        <button
          onClick={() => setActiveTab('hospitals')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'hospitals' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Hospital Status
        </button>
        <button
          onClick={() => setActiveTab('log')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'log' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Event Log
        </button>
      </div>

      {activeTab() === 'active' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-4">
            <For each={transports()}>
              {transport => (
                <div class={`bg-gray-800 rounded-lg p-4 ${selectedTransport() === transport.id ? 'border border-blue-500' : ''}`} onClick={() => setSelectedTransport(transport.id === selectedTransport() ? null : transport.id)}>
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <span class={`px-2 py-0.5 rounded text-xs ${getPriorityColor(transport.priority)}`}>
                        {transport.priority.toUpperCase()}
                      </span>
                      <span class={`px-2 py-0.5 rounded text-xs ${getStatusColor(transport.status)}`}>
                        {transport.status.replace('-', ' ').toUpperCase()}
                      </span>
                      <span class="font-medium">{transport.patientName}</span>
                      <span class="text-sm text-gray-400">{transport.patientId}</span>
                    </div>
                    <div class="flex items-center gap-4">
                      <div>
                        <div class="text-xs text-gray-400">ETA</div>
                        <div class="font-mono font-bold text-xl">{Math.round(transport.eta)} min</div>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <div class="text-gray-400 text-xs">Patient</div>
                      <div>{transport.patientName}, {transport.age}yo</div>
                      <div class="text-gray-500">{transport.complaint}</div>
                    </div>
                    <div>
                      <div class="text-gray-400 text-xs">Unit</div>
                      <div>{transport.unit}</div>
                      <div class="text-gray-500">{transport.crew.join(', ')}</div>
                    </div>
                    <div>
                      <div class="text-gray-400 text-xs">Route</div>
                      <div>From: {transport.origin}</div>
                      <div class="text-gray-500">To: {transport.destination}</div>
                    </div>
                    <div>
                      <div class="text-gray-400 text-xs">Distance</div>
                      <div>{transport.distance} km</div>
                    </div>
                  </div>

                  {selectedTransport() === transport.id && (
                    <div class="border-t border-gray-700 pt-3 mt-2">
                      <div class="text-sm font-medium mb-2">Patient Vitals & Treatment</div>
                      <div class="grid grid-cols-5 gap-2 mb-3">
                        <div class="bg-gray-700 rounded p-2 text-center">
                          <div class="text-xs text-gray-400">BP</div>
                          <div class="font-bold">{transport.vitals.bp}</div>
                        </div>
                        <div class="bg-gray-700 rounded p-2 text-center">
                          <div class="text-xs text-gray-400">HR</div>
                          <div class="font-bold">{transport.vitals.hr}</div>
                        </div>
                        <div class="bg-gray-700 rounded p-2 text-center">
                          <div class="text-xs text-gray-400">SpO2</div>
                          <div class="font-bold">{transport.vitals.spo2}%</div>
                        </div>
                        <div class="bg-gray-700 rounded p-2 text-center">
                          <div class="text-xs text-gray-400">Temp</div>
                          <div class="font-bold">{transport.vitals.temp}°C</div>
                        </div>
                        <div class="bg-gray-700 rounded p-2 text-center">
                          <div class="text-xs text-gray-400">O2</div>
                          <div class="font-bold">{transport.oxygen} L/min</div>
                        </div>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        {transport.ecg && <span class="px-2 py-0.5 bg-blue-700 rounded text-xs">ECG Monitoring</span>}
                        {transport.iv && <span class="px-2 py-0.5 bg-green-700 rounded text-xs">IV Access</span>}
                        {transport.medications.map(med => (
                          <span class="px-2 py-0.5 bg-purple-700 rounded text-xs">{med}</span>
                        ))}
                        {transport.notifications && <span class="px-2 py-0.5 bg-yellow-700 rounded text-xs">Hospital Notified</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'hospitals' && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-2 gap-3">
            <For each={hospitals()}>
              {hospital => (
                <div class="bg-gray-800 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <span class="font-medium">{hospital.name}</span>
                    <span class={`px-2 py-0.5 rounded text-xs ${getHospitalStatusColor(hospital.status)}`}>
                      {hospital.status.toUpperCase()}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div>
                      <div class="text-gray-400 text-xs">ED Wait</div>
                      <div>{hospital.erWait} min</div>
                    </div>
                    <div>
                      <div class="text-gray-400 text-xs">Capacity</div>
                      <div>{hospital.capacity}%</div>
                    </div>
                  </div>
                  <div class="flex gap-1">
                    {hospital.trauma && <span class="px-1 py-0.5 bg-red-900 rounded text-xs">Trauma</span>}
                    {hospital.cardiac && <span class="px-1 py-0.5 bg-red-800 rounded text-xs">Cardiac</span>}
                    {hospital.stroke && <span class="px-1 py-0.5 bg-blue-900 rounded text-xs">Stroke</span>}
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'log' && (
        <div class="flex-1 overflow-auto font-mono text-sm">
          <div class="space-y-1">
            <For each={patientLog}>
              {entry => (
                <div class="flex gap-4 bg-gray-800 rounded p-2">
                  <span class="text-gray-400">{entry.time}</span>
                  <span class="text-blue-400">{entry.transport.toUpperCase()}</span>
                  <span>{entry.event}</span>
                  <span class="text-gray-500 ml-auto">{entry.user}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientTransportTracking