/**
 * TPT Emergency System - Incident Detail & Closing Workflow
 * @module src/components/IncidentDetail.jsx
 * Full incident lifecycle management with close/resolve/reopen workflow
 */

import { createSignal, createEffect, For, Show } from 'solid-js'
import { IncidentTimer } from './IncidentTimer'
import { PrintSystem } from './PrintSystem'

export function IncidentDetail(props) {
  const [incident, setIncident] = createSignal(props.incident)
  const [activeTab, setActiveTab] = createSignal('overview')
  const [closeForm, setCloseForm] = createSignal({
    resolution: '',
    outcome: 'resolved',
    injuries: 0,
    fatalities: 0,
    propertyDamage: '',
    lessonsLearned: '',
    followUpRequired: false,
    followUpDetails: ''
  })
  const [statusNote, setStatusNote] = createSignal('')
  const [timeline, setTimeline] = createSignal([])
  const [editing, setEditing] = createSignal(false)
  const [editForm, setEditForm] = createSignal({ ...props.incident })

  const statusColors = {
    active: 'bg-red-600',
    pending: 'bg-yellow-600',
    responding: 'bg-blue-600',
    onscene: 'bg-teal-600',
    contained: 'bg-orange-600',
    resolved: 'bg-green-600',
    closed: 'bg-gray-600',
    cancelled: 'bg-gray-600'
  }

  const statusFlow = {
    active: ['responding', 'pending', 'cancelled'],
    pending: ['active', 'responding', 'cancelled'],
    responding: ['onscene', 'active', 'cancelled'],
    onscene: ['contained', 'active', 'cancelled'],
    contained: ['resolved', 'active'],
    resolved: ['closed', 'active'],
    closed: ['active'],
    cancelled: ['active']
  }

  const validTransitions = () => statusFlow[incident().status] || []

  createEffect(() => {
    setIncident(props.incident)
    setEditForm({ ...props.incident })
    loadTimeline()
  })

  const loadTimeline = () => {
    const stored = localStorage.getItem(`incident_timeline_${props.incident.id}`)
    if (stored) {
      setTimeline(JSON.parse(stored))
    } else {
      setTimeline([{
        id: crypto.randomUUID(),
        timestamp: props.incident.created_at,
        type: 'created',
        description: 'Incident created',
        user: 'System'
      }])
    }
  }

  const addTimelineEvent = (type, description, metadata = {}) => {
    const event = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      description,
      user: 'Current User',
      ...metadata
    }
    const updated = [event, ...timeline()]
    setTimeline(updated)
    localStorage.setItem(`incident_timeline_${incident().id}`, JSON.stringify(updated))
    return event
  }

  const transitionStatus = async (newStatus) => {
    if (!validTransitions().includes(newStatus)) return

    const updatedIncident = {
      ...incident(),
      status: newStatus,
      updated_at: Date.now()
    }

    // Update on server
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedIncident)
      })

      if (res.ok) {
        const result = await res.json()
        setIncident({ ...incident(), ...updatedIncident })
        addTimelineEvent('status_change', `Status changed to ${newStatus}${statusNote() ? ': ' + statusNote() : ''}`, { fromStatus: incident().status, toStatus: newStatus })
        window.auditLog?.('incident', `Incident ${incident().id.slice(0, 8)} status: ${newStatus}`, { incidentId: incident().id })
        setStatusNote('')
        props.onUpdate?.(updatedIncident)
      }
    } catch (error) {
      // Offline - queue for sync
      setIncident(updatedIncident)
      addTimelineEvent('status_change', `Status changed to ${newStatus} (offline)`, { fromStatus: incident().status, toStatus: newStatus })
      window.auditLog?.('incident', `Incident ${incident().id.slice(0, 8)} status: ${newStatus} (offline)`, { incidentId: incident().id })
      props.onUpdate?.(updatedIncident)
    }
  }

  const closeIncident = async () => {
    const closeData = {
      ...closeForm(),
      closedAt: new Date().toISOString(),
      closedBy: 'Current User'
    }

    const updatedIncident = {
      ...incident(),
      status: closeForm().outcome,
      updated_at: Date.now(),
      data: {
        ...(incident().data || {}),
        closeReport: closeData
      }
    }

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedIncident)
      })

      if (res.ok) {
        setIncident(updatedIncident)
        addTimelineEvent('closed', `Incident ${closeForm().outcome}. ${closeForm().resolution}`, { closeData })
        window.auditLog?.('incident', `Incident ${incident().id.slice(0, 8)} ${closeForm().outcome}`, { incidentId: incident().id, outcome: closeForm().outcome })
        props.onUpdate?.(updatedIncident)
        props.onClose?.()
      }
    } catch (error) {
      setIncident(updatedIncident)
      addTimelineEvent('closed', `Incident ${closeForm().outcome} (offline)`, { closeData })
      window.auditLog?.('incident', `Incident ${incident().id.slice(0, 8)} ${closeForm().outcome} (offline)`, { incidentId: incident().id })
      props.onUpdate?.(updatedIncident)
    }
  }

  const saveEdit = async () => {
    const updated = {
      ...incident(),
      ...editForm(),
      updated_at: Date.now()
    }

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })

      if (res.ok) {
        setIncident(updated)
        addTimelineEvent('updated', 'Incident details updated')
        window.auditLog?.('incident', `Incident ${incident().id.slice(0, 8)} updated`, { incidentId: incident().id })
        setEditing(false)
        props.onUpdate?.(updated)
      }
    } catch (error) {
      setIncident(updated)
      addTimelineEvent('updated', 'Incident details updated (offline)')
      props.onUpdate?.(updated)
      setEditing(false)
    }
  }

  const reopenIncident = async () => {
    const updated = {
      ...incident(),
      status: 'active',
      updated_at: Date.now()
    }

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })

      if (res.ok) {
        setIncident(updated)
        addTimelineEvent('reopened', 'Incident reopened')
        window.auditLog?.('incident', `Incident ${incident().id.slice(0, 8)} reopened`, { incidentId: incident().id })
        props.onUpdate?.(updated)
      }
    } catch (error) {
      setIncident(updated)
      addTimelineEvent('reopened', 'Incident reopened (offline)')
      props.onUpdate?.(updated)
    }
  }

  const isClosed = () => ['resolved', 'closed', 'cancelled'].includes(incident().status)

  const getPriorityColor = (priority) => {
    return {
      low: 'bg-green-600',
      medium: 'bg-yellow-600',
      high: 'bg-orange-600',
      critical: 'bg-red-600'
    }[priority] || 'bg-gray-600'
  }

  const moduleIcons = {
    fire: '🔥',
    ambulance: '🚑',
    police: '🚔',
    disaster: '🌪️',
    hazmat: '☢️',
    medical: '🩺'
  }

  return (
    <div class="bg-gray-800 rounded-lg w-[800px] max-h-[90vh] overflow-auto flex flex-col">
      {/* Header */}
      <div class="p-4 border-b border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <span class="text-2xl">{moduleIcons[incident().type] || '📋'}</span>
            <div>
              <div class="font-bold text-lg">Incident #{incident().id.slice(0, 8)}</div>
              <div class="text-sm text-gray-400">
                Created: {new Date(incident().created_at).toLocaleString()}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class={`px-3 py-1 rounded text-sm font-bold ${statusColors[incident().status]}`}>
              {incident().status.toUpperCase()}
            </span>
            <Show when={incident().priority}>
              <span class={`px-2 py-1 rounded text-xs ${getPriorityColor(incident().priority)}`}>
                {incident().priority?.toUpperCase()}
              </span>
            </Show>
            <button onClick={props.onClose} class="text-gray-400 hover:text-white ml-2 text-xl">&times;</button>
          </div>
        </div>

        {/* Quick Actions */}
        <div class="flex flex-wrap gap-2 mt-3">
          <Show when={!isClosed()}>
            <For each={validTransitions()}>
              {status => (
                <button
                  onClick={() => transitionStatus(status)}
                  class={`px-3 py-1 rounded text-xs font-medium hover:opacity-80 transition ${statusColors[status]}`}
                >
                  Set {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )}
            </For>
            <button
              onClick={() => setActiveTab('close')}
              class="px-3 py-1 bg-gray-600 rounded text-xs font-medium hover:bg-gray-500"
            >
              Close / Resolve
            </button>
          </Show>
          <Show when={isClosed()}>
            <button
              onClick={reopenIncident}
              class="px-3 py-1 bg-blue-600 rounded text-xs font-medium hover:bg-blue-500"
            >
              Reopen Incident
            </button>
          </Show>
          <button
            onClick={() => setEditing(!editing())}
            class="px-3 py-1 bg-gray-700 rounded text-xs font-medium hover:bg-gray-600"
          >
            {editing() ? 'Cancel Edit' : 'Edit Details'}
          </button>
        </div>

        <Show when={!isClosed() && validTransitions().length > 0}>
          <div class="mt-2 flex gap-2">
            <input
              type="text"
              value={statusNote()}
              onInput={(e) => setStatusNote(e.target.value)}
              placeholder="Add a note for status change..."
              class="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm"
            />
          </div>
        </Show>
      </div>

      {/* Tabs */}
      <div class="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          class={`px-4 py-2 text-sm font-medium transition ${activeTab() === 'overview' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          class={`px-4 py-2 text-sm font-medium transition ${activeTab() === 'timeline' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
          Timeline ({timeline().length})
        </button>
        <button
          onClick={() => setActiveTab('close')}
          class={`px-4 py-2 text-sm font-medium transition ${activeTab() === 'close' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
          Close Report
        </button>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-auto p-4">
        <Show when={activeTab() === 'overview'}>
          <Show when={!editing()} fallback={
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={editForm().description || ''}
                  onInput={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                  class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-20 resize-none"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Address</label>
                  <input
                    type="text"
                    value={editForm().address || ''}
                    onInput={(e) => setEditForm(f => ({ ...f, address: e.target.value }))}
                    class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Priority</label>
                  <select
                    value={editForm().priority || 'medium'}
                    onInput={(e) => setEditForm(f => ({ ...f, priority: e.target.value }))}
                    class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm().latitude || 0}
                    onInput={(e) => setEditForm(f => ({ ...f, latitude: parseFloat(e.target.value) }))}
                    class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm().longitude || 0}
                    onInput={(e) => setEditForm(f => ({ ...f, longitude: parseFloat(e.target.value) }))}
                    class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  />
                </div>
              </div>
              <div class="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(false)}
                  class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  class="px-4 py-2 bg-green-600 rounded hover:bg-green-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          }>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-900 rounded p-3">
                  <div class="text-sm text-gray-400">Type</div>
                  <div class="font-medium capitalize">{incident().type}</div>
                </div>
                <div class="bg-gray-900 rounded p-3">
                  <div class="text-sm text-gray-400">Priority</div>
                  <div class="font-medium capitalize">{incident().priority || 'Medium'}</div>
                </div>
                <div class="bg-gray-900 rounded p-3">
                  <div class="text-sm text-gray-400">Address</div>
                  <div class="font-medium">{incident().address || 'Not specified'}</div>
                </div>
                <div class="bg-gray-900 rounded p-3">
                  <div class="text-sm text-gray-400">Coordinates</div>
                  <div class="font-medium">
                    {incident().latitude?.toFixed(4) || 0}, {incident().longitude?.toFixed(4) || 0}
                  </div>
                </div>
              </div>

              <div class="bg-gray-900 rounded p-3">
                <div class="text-sm text-gray-400 mb-1">Description</div>
                <div class="text-sm">{incident().description || 'No description provided.'}</div>
              </div>

              <Show when={incident().data?.closeReport}>
                <div class="bg-gray-900 rounded p-3 border border-green-800">
                  <div class="text-sm text-green-400 font-medium mb-2">📋 Close Report</div>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span class="text-gray-400">Outcome:</span>{' '}
                      <span class="capitalize font-medium">{incident().data.closeReport.outcome}</span>
                    </div>
                    <div>
                      <span class="text-gray-400">Closed:</span>{' '}
                      {new Date(incident().data.closeReport.closedAt).toLocaleString()}
                    </div>
                    <div>
                      <span class="text-gray-400">Injuries:</span>{' '}
                      {incident().data.closeReport.injuries}
                    </div>
                    <div>
                      <span class="text-gray-400">Fatalities:</span>{' '}
                      {incident().data.closeReport.fatalities}
                    </div>
                  </div>
                  <div class="mt-2 text-sm">
                    <div class="text-gray-400">Resolution:</div>
                    <div>{incident().data.closeReport.resolution}</div>
                  </div>
                  <Show when={incident().data.closeReport.lessonsLearned}>
                    <div class="mt-2 text-sm">
                      <div class="text-gray-400">Lessons Learned:</div>
                      <div>{incident().data.closeReport.lessonsLearned}</div>
                    </div>
                  </Show>
                </div>
              </Show>
            </div>
          </Show>
        </Show>

        <Show when={activeTab() === 'timeline'}>
          <div class="space-y-3">
            <For each={timeline()}>
              {event => (
                <div class="flex gap-3">
                  <div class="flex flex-col items-center">
                    <div class={`w-3 h-3 rounded-full ${
                      event.type === 'created' ? 'bg-blue-500' :
                      event.type === 'status_change' ? 'bg-yellow-500' :
                      event.type === 'closed' ? 'bg-green-500' :
                      event.type === 'reopened' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`} />
                    <div class="w-0.5 flex-1 bg-gray-700 mt-1" />
                  </div>
                  <div class="flex-1 pb-4">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm font-medium">{event.description}</span>
                      <span class="text-xs text-gray-500">{event.user}</span>
                    </div>
                    <div class="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                    <Show when={event.notes}>
                      <div class="text-sm text-gray-400 mt-1">{event.notes}</div>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={activeTab() === 'close'}>
          <Show when={isClosed()}>
            <div class="bg-gray-900 rounded p-4 text-center">
              <div class="text-4xl mb-2">📋</div>
              <div class="font-medium">This incident is already {incident().status}</div>
              <div class="text-sm text-gray-400 mt-1">
                View the close report in the Overview tab, or reopen the incident to make changes.
              </div>
            </div>
          </Show>

          <Show when={!isClosed()}>
            <div class="space-y-4">
              <div class="bg-yellow-900/30 border border-yellow-700 rounded p-3">
                <div class="text-sm text-yellow-300">
                  ⚠️ Closing an incident will mark it as resolved and generate a final report. This action is logged in the audit trail.
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Outcome</label>
                  <select
                    value={closeForm().outcome}
                    onInput={(e) => setCloseForm(f => ({ ...f, outcome: e.target.value }))}
                    class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  >
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed (No Further Action)</option>
                    <option value="cancelled">Cancelled (False Alarm)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Property Damage</label>
                  <select
                    value={closeForm().propertyDamage}
                    onInput={(e) => setCloseForm(f => ({ ...f, propertyDamage: e.target.value }))}
                    class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  >
                    <option value="">Select level...</option>
                    <option value="none">None</option>
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="total">Total Loss</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Injuries</label>
                  <input
                    type="number"
                    min="0"
                    value={closeForm().injuries}
                    onInput={(e) => setCloseForm(f => ({ ...f, injuries: parseInt(e.target.value) || 0 }))}
                    class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Fatalities</label>
                  <input
                    type="number"
                    min="0"
                    value={closeForm().fatalities}
                    onInput={(e) => setCloseForm(f => ({ ...f, fatalities: parseInt(e.target.value) || 0 }))}
                    class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm text-gray-400 mb-1">Resolution Summary</label>
                <textarea
                  value={closeForm().resolution}
                  onInput={(e) => setCloseForm(f => ({ ...f, resolution: e.target.value }))}
                  class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-20 resize-none"
                  placeholder="Describe how the incident was resolved..."
                  required
                />
              </div>

              <div>
                <label class="block text-sm text-gray-400 mb-1">Lessons Learned</label>
                <textarea
                  value={closeForm().lessonsLearned}
                  onInput={(e) => setCloseForm(f => ({ ...f, lessonsLearned: e.target.value }))}
                  class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-20 resize-none"
                  placeholder="What went well? What could be improved?"
                />
              </div>

              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="followup"
                  checked={closeForm().followUpRequired}
                  onChange={(e) => setCloseForm(f => ({ ...f, followUpRequired: e.target.checked }))}
                  class="rounded bg-gray-900 border-gray-700"
                />
                <label for="followup" class="text-sm">Follow-up required</label>
              </div>

              <Show when={closeForm().followUpRequired}>
                <textarea
                  value={closeForm().followUpDetails}
                  onInput={(e) => setCloseForm(f => ({ ...f, followUpDetails: e.target.value }))}
                  class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 h-16 resize-none"
                  placeholder="Describe required follow-up actions..."
                />
              </Show>

              <div class="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={closeIncident}
                  disabled={!closeForm().resolution}
                  class="px-4 py-2 bg-green-600 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✅ Close Incident
                </button>
              </div>

              <IncidentTimer
                incidentId={incident().id}
                name="On Scene Timer"
              />

              <PrintSystem incident={incident()} />

            </div>
          </Show>
        </Show>
      </div>
    </div>
  )
}

export default IncidentDetail
