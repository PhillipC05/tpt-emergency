import { createSignal, createEffect, onMount, For, Show } from 'solid-js'
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
import { DataManagement } from './components/DataManagement'
import { AssetManager } from './components/AssetManager'
import { initNightMode, toggleNightMode, isNightMode } from './lib/night-mode'
import { OfflineDB } from './lib/offline-db'
import { DispatchProvider } from './modules/CommonDispatchLayer'
import { ResourceProvider } from './modules/ResourceTracking'
import { TriageProvider } from './modules/TriageManagement'
import { UserProvider, useUser } from './modules/UserRoleSystem'
import { AuditLogProvider } from './modules/AuditLogSystem'
import BeaconProvider from './modules/BeaconMonitoring'
import SARProvider from './modules/SearchAndRescue'
import ReportingProvider from './modules/IncidentReporting'

function UserProfile() {
  const user = useUser()
  const [showLogin, setShowLogin] = createSignal(false)
  const [username, setUsername] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [error, setError] = createSignal('')
  const [showMenu, setShowMenu] = createSignal(false)

  const roleColors = {
    ADMINISTRATOR: 'bg-red-700',
    DISPATCHER: 'bg-blue-700',
    FIELD_COMMANDER: 'bg-orange-700',
    FIRST_RESPONDER: 'bg-green-700',
    OBSERVER: 'bg-gray-600'
  }

  const handleLogin = async () => {
    setError('')
    const result = await user.authenticate(username(), password())
    if (result.success) {
      setShowLogin(false)
      setUsername('')
      setPassword('')
    } else {
      setError('Invalid credentials. Try: admin, dispatch, commander, responder')
    }
  }

  return (
    <div class="relative">
      <Show when={user.currentUser.authenticated} fallback={
        <button
          onClick={() => setShowLogin(true)}
          class="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
        >
          <span>👤</span>
          <span class="text-gray-300">Sign In</span>
        </button>
      }>
        <button
          onClick={() => setShowMenu(!showMenu())}
          class="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded transition"
        >
          <div class={`w-6 h-6 rounded-full ${roleColors[user.currentUser.role] || 'bg-gray-600'} flex items-center justify-center text-xs font-bold`}>
            {user.currentUser.displayName?.[0]?.toUpperCase() || '?'}
          </div>
          <div class="text-left hidden sm:block">
            <div class="text-sm font-medium leading-none">{user.currentUser.displayName}</div>
            <div class="text-xs text-gray-400 mt-0.5">{user.SYSTEM_ROLES[user.currentUser.role]?.name}</div>
          </div>
          <span class="text-gray-400 text-xs">▾</span>
        </button>

        <Show when={showMenu()}>
          <div class="absolute right-0 top-full mt-1 w-52 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
            <div class="p-3 border-b border-gray-700">
              <div class="font-medium">{user.currentUser.displayName}</div>
              <div class={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${roleColors[user.currentUser.role] || 'bg-gray-600'}`}>
                {user.SYSTEM_ROLES[user.currentUser.role]?.name}
              </div>
            </div>
            <div class="p-2">
              <button
                onClick={() => { user.logout(); setShowMenu(false) }}
                class="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </Show>
      </Show>

      <Show when={showLogin()}>
        <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowLogin(false)}>
          <div class="bg-gray-800 rounded-lg p-6 w-80 border border-gray-700" onClick={e => e.stopPropagation()}>
            <h3 class="text-lg font-bold mb-4">Sign In</h3>
            <div class="space-y-3">
              <input
                type="text"
                placeholder="Username"
                value={username()}
                onInput={e => setUsername(e.target.value)}
                class="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none text-sm"
              />
              <input
                type="password"
                placeholder="Password (any)"
                value={password()}
                onInput={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                class="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none text-sm"
              />
              <Show when={error()}>
                <div class="text-xs text-red-400">{error()}</div>
              </Show>
              <div class="text-xs text-gray-500">Demo users: admin · dispatch · commander · responder</div>
              <button
                onClick={handleLogin}
                class="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium transition"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

const db = new OfflineDB()

export default function App() {
  const [activeModule, setActiveModule] = createSignal('dashboard')

  // Debug active module changes
  createEffect(() => {
    console.log(`🔄 [APP] Active module changed to: ${activeModule()}`)
    const foundModule = modules().find(m => m.id === activeModule())
    console.log(`📋 [APP] Found matching module:`, foundModule)
  })
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
     const initialIncidents = await incidentsRes.json()
     setIncidents(initialIncidents)

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

      // Start background processes
      setInterval(async () => {
        const autoBackup = await db.settings.get('auto_backup')
        if(autoBackup?.value !== false) {
          await db.createAutoBackup()
        }

        // Auto archive incidents
        const archiveDays = await db.settings.get('auto_archive_days')
        const days = archiveDays?.value || 7
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000)
        
        const closedIncidents = await db.incidents
          .where('status').anyOf('resolved', 'cancelled')
          .and(i => i.updated_at < cutoffTime && !i.archived_at)
          .toArray()

        for(const incident of closedIncidents) {
          await db.incidents.update(incident.id, { archived_at: Date.now() })
        }

      }, 3600000) // Run every hour

    })

   // Sync App incidents to Dispatch system so modules receive live updates
   createEffect(() => {
     // Import the dispatch context to sync incidents
     const { setIncidents } = window.dispatch || {}
     if (setIncidents) {
       console.log(`🔄 [APP] Syncing ${incidents().length} incidents to Dispatch Provider`, incidents())
       // @ts-ignore
       setIncidents(incidents())
       console.log(`✅ [APP] Sync completed successfully`)
     } else {
       console.warn(`⚠️ [APP] Dispatch Provider not ready yet, waiting for init...`)
     }
   })

  const moduleColors = {
    fire: 'bg-orange-600',
    ambulance: 'bg-red-600',
    police: 'bg-blue-700',
    disaster: 'bg-yellow-600',
    sar: 'bg-emerald-600',
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
    sar: '🔍',
    auditlog: '📜',
    personnel: '👥',
    hazmat: '☢️',
    medical: '🩺',
    mutualaid: '🤝',
    weather: '🌤️'
  }

  return (
    <BeaconProvider>
    <SARProvider>
    <ReportingProvider>
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

           <button
             onClick={() => setActiveModule('assets')}
             class={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeModule() === 'assets' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
           >
             <span>🛸</span>
             {sidebarOpen() && <span>Asset Manager</span>}
           </button>

          <div class="my-3 border-t border-gray-700"></div>

          <For each={modules().filter(m => m.enabled)}>
            {module => (
              <button
                onClick={() => {
                  console.log(`👆 [SIDEBAR] User clicked module: ${module.id} ${module.name}`)
                  setActiveModule(module.id)
                }}
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
                onClick={toggleNightMode}
                class={`px-2 py-1 rounded text-sm transition ${isNightMode() ? 'bg-red-700 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                title="Toggle Night Mode"
              >
                {isNightMode() ? '🔴' : '🌙'}
              </button>
              <DataManagement />
              <button
                onClick={() => setShowIncidentCreator(true)}
                class="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-500 transition"
              >
                + New Incident
              </button>
              <UserProfile />
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
           {activeModule() === 'assets' && <AssetManager />}
           {!['dashboard', 'map', 'bluetooth', 'assets'].includes(activeModule()) && (
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
    </ReportingProvider>
    </SARProvider>
    </BeaconProvider>
  )
}
