import { createSignal, createEffect, onMount, For } from 'solid-js'
import { Map } from './components/Map'
import { BluetoothManager } from './components/BluetoothManager'
import { ModuleLoader } from './modules/ModuleLoader'
import { IncidentCreator } from './components/IncidentCreator'
import { IncidentDetail } from './components/IncidentDetail'
import { PanicButton } from './components/PanicButton'
import { AlarmReceiver } from './components/AlarmReceiver'
import { NetworkHealth } from './components/NetworkHealth'
import { GlobalUndo } from './components/GlobalUndo'
import { VehicleMode } from './components/VehicleMode'
import { initNightMode } from './lib/night-mode'
import { OfflineDB } from './lib/offline-db'
import { DispatchProvider } from './modules/CommonDispatchLayer'
import { ResourceProvider } from './modules/ResourceTracking'
import { TriageProvider } from './modules/TriageManagement'
import { UserProvider } from './modules/UserRoleSystem'
import { AuditLogProvider } from './modules/AuditLogSystem'
import BeaconProvider from './modules/BeaconMonitoring'

const db = new OfflineDB()

export default function App() {
  const [activeModule, setActiveModule] = createSignal('dashboard')
  const [online, setOnline] = createSignal(navigator.onLine)
  const [modules, setModules] = createSignal([])
  const [incidents, setIncidents] = createSignal([])
  const [sidebarOpen, setSidebarOpen] = createSignal(true)
  const [showIncidentCreator, setShowIncidentCreator] = createSignal(false)
  const [selectedIncident, setSelectedIncident] = createSignal(null)

  onMount(async () => {
    window.addEventListener('online', () => setOnline(true))
    window.addEventListener('offline', () => setOnline(false))
    
    initNightMode()

    // Load enabled modules
    const res = await fetch('/api/modules')
    setModules(await res.json())

    // Load incidents
    const incidentsRes = await fetch('/api/incidents')
    setIncidents(await incidentsRes.json())

    // Connect to realtime
    const io = (await import('socket.io-client')).io
    const socket = io()

    socket.on('incident:update', (incident) => {
      setIncidents(prev => {
        const existing = prev.find(i => i.id === incident.id)
        if (existing) {
          return prev.map(i => i.id === incident.id ? incident : i)
        }
        return [incident, ...prev]
      })
    })
  })

  const moduleColors = {
    fire: 'bg-orange-600',
    ambulance: 'bg-red-600',
    police: 'bg-blue-700',
    disaster: 'bg-yellow-600',
    auditlog: 'bg-gray-600',
    personnel: 'bg-teal-600',
    hazmat: 'bg-amber-700',
    medical: 'bg-rose-700',
    mutualaid: 'bg-indigo-600',
    weather: 'bg-sky-600'
  }

  const moduleIcons = {
    fire: '🔥',
    ambulance: '🚑',
    police: '🚔',
    disaster: '🌪️',
    auditlog: '📜',
    personnel: '👥',
    hazmat: '☢️',
    medical: '🩺',
    mutualaid: '🤝',
    weather: '🌤️'
  }

  return (
    <BeaconProvider>
    <DispatchProvider>
      <UserProvider>
        <AuditLogProvider>
          <ResourceProvider>
            <TriageProvider>
    <div class="h-screen w-screen flex bg-gray-900 text-white">
      {/* Sidebar */}
      <div class={`${sidebarOpen() ? 'w-64' : 'w-16'} flex flex-col bg-gray-800 border-r border-gray-700 transition-all duration-300`}>
        {/* Logo */}
        <div class="p-4 border-b border-gray-700 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-xl font-bold">
            E
          </div>
          {sidebarOpen() && (
            <div>
              <div class="font-bold text-lg">TPT Emergency</div>
              <div class="text-xs text-gray-400">v1.0.0</div>
            </div>
          )}
        </div>

        {/* Network Status */}
        <div class={`p-3 ${online() ? 'bg-green-900/30' : 'bg-red-900/30'} border-b border-gray-700`}>
          <div class="flex items-center gap-2">
            <div class={`w-2 h-2 rounded-full ${online() ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
            {sidebarOpen() && (
              <span class="text-sm">{online() ? 'Online' : 'Offline Mode'}</span>
            )}
          </div>
        </div>

        {/* Modules */}
        <div class="flex-1 p-2 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveModule('dashboard')}
            class={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeModule() === 'dashboard' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
          >
            <span>📊</span>
            {sidebarOpen() && <span>Dashboard</span>}
          </button>

          <button
            onClick={() => setActiveModule('map')}
            class={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeModule() === 'map' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
          >
            <span>🗺️</span>
            {sidebarOpen() && <span>Live Map</span>}
          </button>

           <button
             onClick={() => setActiveModule('bluetooth')}
             class={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeModule() === 'bluetooth' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
           >
             <span>📡</span>
             {sidebarOpen() && <span>Bluetooth</span>}
           </button>

           <button
             onClick={() => setActiveModule('communications')}
             class={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeModule() === 'communications' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
           >
             <span>📻</span>
             {sidebarOpen() && <span>Communications</span>}
           </button>

          <div class="my-3 border-t border-gray-700"></div>

          <For each={modules().filter(m => m.enabled)}>
            {module => (
              <button
                onClick={() => setActiveModule(module.id)}
                class={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeModule() === module.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
              >
                <span>{moduleIcons[module.id] || '📋'}</span>
                {sidebarOpen() && <span>{module.name}</span>}
              </button>
            )}
          </For>
        </div>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen())}
          class="p-4 border-t border-gray-700 text-gray-400 hover:text-white"
        >
          {sidebarOpen() ? '◀' : '▶'}
        </button>
      </div>

      {/* Main Content */}
      <div class="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div class="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between">
          <div class="font-semibold">
            {activeModule() === 'dashboard' && 'Dashboard'}
            {activeModule() === 'map' && 'Live Map'}
            {activeModule() === 'bluetooth' && 'Bluetooth Manager'}
            {modules().find(m => m.id === activeModule())?.name || ''}
          </div>
          
          <div class="flex items-center gap-3">
            <div class="text-sm text-gray-400">
              {new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}
            </div>
             <button 
               onClick={() => setShowIncidentCreator(true)}
               class="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-500 transition"
             >
               + New Incident
             </button>
          </div>
        </div>

         {/* Incident Creator Modal */}
         {showIncidentCreator() && (
           <div class="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
             <IncidentCreator 
               onClose={() => setShowIncidentCreator(false)}
               onCreated={(incident) => {
                 setIncidents(prev => [incident, ...prev])
                 setShowIncidentCreator(false)
               }}
             />
           </div>
         )}

         {/* Incident Detail Modal */}
         {selectedIncident() && (
           <div class="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
             <IncidentDetail
               incident={selectedIncident()}
               onClose={() => setSelectedIncident(null)}
               onUpdate={(updated) => {
                 setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i))
               }}
             />
           </div>
         )}

         {/* Content Area */}
         <div class="flex-1 overflow-auto">
          {activeModule() === 'dashboard' && (
            <div class="p-6">
              <h1 class="text-2xl font-bold mb-6">Emergency System Dashboard</h1>
              
              <div class="grid grid-cols-4 gap-4 mb-6">
                <For each={modules().filter(m => m.enabled)}>
                  {module => (
                    <div class={`p-4 rounded-lg ${moduleColors[module.id]} text-white`}>
                      <div class="text-3xl font-bold">{incidents().filter(i => i.type === module.id).length}</div>
                      <div class="text-sm opacity-90">Active {module.name}</div>
                    </div>
                  )}
                </For>
              </div>

              <div class="bg-gray-800 rounded-lg overflow-hidden">
                <div class="p-4 border-b border-gray-700 font-semibold">
                  Recent Incidents
                </div>
                <div class="divide-y divide-gray-700">
                  <For each={incidents().slice(0, 10)}>
                    {incident => (
                      <div 
                        class="p-4 flex items-center justify-between hover:bg-gray-700/30 cursor-pointer"
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <div class="flex items-center gap-3">
                          <span class="text-xl">{moduleIcons[incident.type] || '📋'}</span>
                          <div>
                            <div class="font-medium">Incident #{incident.id.slice(0, 8)}</div>
                            <div class="text-sm text-gray-400">{new Date(incident.created_at).toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}</div>
                          </div>
                        </div>
                        <div class={`px-2 py-1 rounded text-xs ${incident.status === 'active' ? 'bg-red-600' : incident.status === 'resolved' ? 'bg-green-600' : incident.status === 'cancelled' ? 'bg-gray-600' : 'bg-blue-600'}`}>
                          {incident.status}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          )}

           {activeModule() === 'map' && <Map />}
           {activeModule() === 'bluetooth' && <BluetoothManager />}
           {activeModule() === 'communications' && <ModuleLoader moduleId="communications" />}
          
          {modules().find(m => m.id === activeModule()) && (
            <ModuleLoader moduleId={activeModule()} />
          )}
        </div>
      </div>
      <PanicButton />
      <AlarmReceiver />
      <NetworkHealth />
      <GlobalUndo />
      <VehicleMode />
    </div>
            </TriageProvider>
          </ResourceProvider>
        </AuditLogProvider>
      </UserProvider>
    </DispatchProvider>
    </BeaconProvider>
  )
}
