// src/components/ResponsePlans.jsx
import { createSignal, createEffect, For } from 'solid-js'

export function ResponsePlans() {
  const [plans, setPlans] = createSignal([])
  const [showEditor, setShowEditor] = createSignal(false)
  const [editingPlan, setEditingPlan] = createSignal(null)

  const loadPlans = async () => {
    const res = await fetch('/api/response-plans')
    setPlans(await res.json())
  }

  createEffect(() => {
    loadPlans()
  })

  const savePlan = async (plan) => {
    await fetch('/api/response-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan)
    })
    setShowEditor(false)
    loadPlans()
  }

  const applyPlan = async (incidentId, planId) => {
    await fetch(`/api/incidents/${incidentId}/apply-plan/${planId}`, {
      method: 'POST'
    })
  }

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Response Plans</h1>
        <button
          onClick={() => {
            setEditingPlan({
              name: '',
              description: '',
              incident_type: 'fire',
              priority: 'medium',
              triggers: [],
              dispatch_rules: [],
              unit_assignments: [],
              checklist: [],
              enabled: true
            })
            setShowEditor(true)
          }}
          class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
        >
          + New Response Plan
        </button>
      </div>

      <div class="grid gap-4">
        <For each={plans()}>
          {plan => (
            <div class="bg-gray-800 rounded-lg p-4">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-semibold text-lg">{plan.name}</h3>
                  <p class="text-sm text-gray-400">{plan.description}</p>
                  <div class="mt-2 flex gap-2">
                    <span class="px-2 py-1 bg-gray-700 rounded text-xs">{plan.incident_type}</span>
                    <span class="px-2 py-1 bg-gray-700 rounded text-xs">{plan.priority} priority</span>
                    <span class="px-2 py-1 bg-gray-700 rounded text-xs">{plan.dispatch_rules.length} dispatch rules</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingPlan(plan)
                      setShowEditor(true)
                    }}
                    class="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>

      {showEditor() && (
        <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div class="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold">{editingPlan().id ? 'Edit Response Plan' : 'New Response Plan'}</h2>
              <button onClick={() => setShowEditor(false)} class="text-gray-400 hover:text-white">✕</button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm text-gray-400 mb-1">Plan Name</label>
                <input 
                  type="text"
                  value={editingPlan().name}
                  onInput={e => setEditingPlan({...editingPlan(), name: e.target.value})}
                  class="w-full bg-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label class="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={editingPlan().description}
                  onInput={e => setEditingPlan({...editingPlan(), description: e.target.value})}
                  class="w-full bg-gray-700 rounded px-3 py-2 h-20"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Incident Type</label>
                  <select
                    value={editingPlan().incident_type}
                    onChange={e => setEditingPlan({...editingPlan(), incident_type: e.target.value})}
                    class="w-full bg-gray-700 rounded px-3 py-2"
                  >
                    <option value="fire">Fire Department</option>
                    <option value="ambulance">Ambulance Service</option>
                    <option value="police">Police</option>
                    <option value="disaster">Disaster Response</option>
                    <option value="hazmat">HazMat</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Priority</label>
                  <select
                    value={editingPlan().priority}
                    onChange={e => setEditingPlan({...editingPlan(), priority: e.target.value})}
                    class="w-full bg-gray-700 rounded px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowEditor(false)} class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
                  Cancel
                </button>
                <button onClick={() => savePlan(editingPlan())} class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">
                  Save Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}