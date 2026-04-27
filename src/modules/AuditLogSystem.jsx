import { createSignal, createEffect, onMount, For } from 'solid-js'
import { useDispatch } from './CommonDispatchLayer'

export function AuditLogProvider(props) {
  const [events, setEvents] = createSignal([])
  const dispatch = useDispatch()

  const logEvent = (type, description, metadata = {}) => {
    const event = {
      id: crypto.randomUUID(),
      type,
      description,
      timestamp: new Date().toISOString(),
      userId: dispatch?.currentUser?.id || 'system',
      userName: dispatch?.currentUser?.name || 'System',
      metadata,
      read: false
    }

    setEvents(prev => [event, ...prev].slice(0, 10000))
    
    // Persist to offline storage
    const stored = localStorage.getItem('audit_log')
    const logs = stored ? JSON.parse(stored) : []
    logs.unshift(event)
    localStorage.setItem('audit_log', JSON.stringify(logs.slice(0, 10000)))
  }

  const getEvents = (filter = {}) => {
    let result = events()
    
    if (filter.type) result = result.filter(e => e.type === filter.type)
    if (filter.userId) result = result.filter(e => e.userId === filter.userId)
    if (filter.since) result = result.filter(e => new Date(e.timestamp) >= new Date(filter.since))
    if (filter.incidentId) result = result.filter(e => e.metadata.incidentId === filter.incidentId)
    
    return result
  }

  onMount(() => {
    const stored = localStorage.getItem('audit_log')
    if (stored) {
      setEvents(JSON.parse(stored))
    }

    // Export log function to global context
    window.auditLog = logEvent
  })

  return (
    <props.children 
      auditLog={{
        logEvent,
        getEvents,
        events
      }}
    />
  )
}

export function AuditLogViewer() {
  const [filter, setFilter] = createSignal({})
  const dispatch = useDispatch()

  const filteredEvents = () => {
    let ev = dispatch?.auditLog?.events() || []
    
    if (filter().type) ev = ev.filter(e => e.type === filter().type)
    
    return ev
  }

  const eventColors = {
    incident: 'bg-red-100 text-red-800',
    unit: 'bg-blue-100 text-blue-800',
    resource: 'bg-green-100 text-green-800',
    communication: 'bg-yellow-100 text-yellow-800',
    user: 'bg-purple-100 text-purple-800',
    system: 'bg-gray-100 text-gray-800'
  }

  const eventIcons = {
    incident: '🚨',
    unit: '🚓',
    resource: '📦',
    communication: '📻',
    user: '👤',
    system: '⚙️'
  }

  return (
    <div class="p-6 h-full flex flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">System Audit Log</h2>
        
        <div class="flex gap-2">
          <select 
            class="bg-gray-700 px-3 py-1 rounded text-sm"
            onInput={(e) => setFilter(f => ({ ...f, type: e.target.value }))}
          >
            <option value="">All Events</option>
            <option value="incident">Incidents</option>
            <option value="unit">Unit Status</option>
            <option value="resource">Resources</option>
            <option value="communication">Communications</option>
            <option value="user">User Actions</option>
            <option value="system">System Events</option>
          </select>

          <button 
            class="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
            onClick={() => {
              const csv = [
                'Timestamp,Type,User,Description',
                ...filteredEvents().map(e => 
                  `"${e.timestamp}","${e.type}","${e.userName}","${e.description}"`
                )
              ].join('\n')
              
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`
              a.click()
            }}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto bg-gray-800 rounded-lg">
        <div class="divide-y divide-gray-700">
          <For each={filteredEvents().slice(0, 200)}>
            {event => (
              <div class="p-3 hover:bg-gray-700/50 transition">
                <div class="flex items-start gap-3">
                  <div class="text-lg">{eventIcons[event.type] || '📋'}</div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <div class="font-medium">{event.description}</div>
                      <span class={`px-2 py-0.5 rounded text-xs ${eventColors[event.type]}`}>
                        {event.type}
                      </span>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                      {new Date(event.timestamp).toLocaleString()} • {event.userName}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  )
}

export default AuditLogViewer