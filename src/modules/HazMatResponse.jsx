import { createSignal, For } from 'solid-js'
import { useDispatch } from './CommonDispatchLayer'

const hazardClasses = {
  1: { name: 'Explosives', color: 'bg-orange-700', icon: '💥' },
  2: { name: 'Gases', color: 'bg-green-700', icon: '💨' },
  3: { name: 'Flammable Liquids', color: 'bg-red-700', icon: '🔥' },
  4: { name: 'Flammable Solids', color: 'bg-red-600', icon: '🧨' },
  5: { name: 'Oxidizing', color: 'bg-yellow-600', icon: '⚗️' },
  6: { name: 'Toxic', color: 'bg-purple-700', icon: '☠️' },
  7: { name: 'Radioactive', color: 'bg-yellow-700', icon: '☢️' },
  8: { name: 'Corrosive', color: 'bg-gray-900', icon: '🧪' },
  9: { name: 'Miscellaneous', color: 'bg-gray-700', icon: '⚠️' }
}

const protectionLevels = [
  { level: 'A', color: 'bg-red-700', description: 'Fully Encapsulating Suit', required: 'Extreme / unknown atmosphere, IDLH concentrations' },
  { level: 'B', color: 'bg-orange-600', description: 'Vapor Protective Suit + SCBA', required: 'High concentration vapors, unknown atmosphere' },
  { level: 'C', color: 'bg-yellow-600', description: 'Air Purifying Respirator', required: 'Known atmosphere, above PEL but not IDLH' },
  { level: 'D', color: 'bg-green-700', description: 'Standard Work Uniform', required: 'Minimal hazard, no splash or inhalation risk' }
]

const commonMaterials = [
  { id: 1, un: 'UN1203', name: 'Gasoline', class: 3, flashpoint: -43, boiling: 95 },
  { id: 2, un: 'UN1072', name: 'Oxygen', class: 2, flashpoint: null, boiling: -183 },
  { id: 3, un: 'UN1044', name: 'Propane', class: 2, flashpoint: -104, boiling: -42 },
  { id: 4, un: 'UN1789', name: 'Hydrochloric Acid', class: 8, flashpoint: null, boiling: 108 },
  { id: 5, un: 'UN1824', name: 'Sodium Hydroxide', class: 8, flashpoint: null, boiling: 1388 },
  { id: 6, un: 'UN2814', name: 'Infectious Substance', class: 6, flashpoint: null, boiling: null },
  { id: 7, un: 'UN2910', name: 'Radioactive Material', class: 7, flashpoint: null, boiling: null },
  { id: 8, un: 'UN1993', name: 'Diesel Fuel', class: 3, flashpoint: 38, boiling: 360 },
  { id: 9, un: 'UN1189', name: 'Ethanol', class: 3, flashpoint: 12, boiling: 78 },
  { id: 10, un: 'UN1001', name: 'Acetylene', class: 2, flashpoint: -18, boiling: -84 }
]

const responseSteps = {
  'Initial Response': [
    'Approach from upwind / uphill',
    'Identify placard / UN number from safe distance',
    'Establish hot, warm, and cold zones',
    'Notify HazMat team and incident command',
    'Evacuate public from immediate area'
  ],
  'Scene Assessment': [
    'Identify material using ERG or SDS',
    'Determine leak / spill quantity',
    'Check wind speed and direction',
    'Identify ignition sources',
    'Assess exposure risk to responders and public'
  ],
  'Containment': [
    'Select appropriate PPE level (A/B/C/D)',
    'Deploy absorbent / containment booms',
    'Stop source if safe to do so',
    'Prevent entry to drains / waterways',
    'Document all actions taken'
  ],
  'Decontamination': [
    'Establish decon corridor at warm/cold zone boundary',
    'Remove PPE in correct sequence',
    'Shower responders with water / neutraliser',
    'Bag and tag all contaminated equipment',
    'Medical monitoring for exposed personnel'
  ]
}

const calculateZones = (material, windSpeed = 10) => {
  const base = material.class === 7 ? 1000 : material.class === 6 ? 500 : material.class === 8 ? 300 : 200
  return { hot: base, warm: base * 3, cold: base * 5, evacuation: Math.round(base * windSpeed / 5) }
}

export function HazMatResponse() {
  const dispatch = useDispatch()
  const [activeTab, setActiveTab] = createSignal('overview')
  const [selectedMaterial, setSelectedMaterial] = createSignal(null)

  const activeCalls = () => dispatch.incidents.filter(i => i.type === 'hazmat')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '☢️' },
    { id: 'materials', label: 'Materials DB', icon: '🧪' },
    { id: 'active', label: 'Active Incidents', icon: '🚨' },
    { id: 'procedures', label: 'Response Procedures', icon: '📋' },
    { id: 'ppe', label: 'PPE Levels', icon: '🦺' }
  ]

  return (
    <div class="p-6 h-full flex flex-col overflow-hidden">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">☢️ Hazardous Materials Response</h2>
        <div class="text-sm text-gray-400">{activeCalls().length} active HazMat incident{activeCalls().length !== 1 ? 's' : ''}</div>
      </div>

      {/* Tabs */}
      <div class="flex gap-1 mb-4 border-b border-gray-700">
        <For each={tabs}>
          {tab => (
            <button
              onClick={() => setActiveTab(tab.id)}
              class={`px-4 py-2 text-sm font-medium rounded-t transition ${
                activeTab() === tab.id
                  ? 'bg-gray-700 text-white border-b-2 border-yellow-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          )}
        </For>
      </div>

      {/* Overview Tab */}
      {activeTab() === 'overview' && (
        <div class="flex-1 overflow-auto space-y-4">
          <div class="grid grid-cols-9 gap-2">
            <For each={Object.entries(hazardClasses)}>
              {([classId, info]) => (
                <div class={`p-2 rounded text-center ${info.color}`}>
                  <div class="text-xl">{info.icon}</div>
                  <div class="text-xs font-bold">Class {classId}</div>
                  <div class="text-xs opacity-80">{info.name}</div>
                </div>
              )}
            </For>
          </div>

          <div class="grid grid-cols-4 gap-4">
            <div class="bg-gray-800 p-4 rounded-lg">
              <div class="text-3xl font-bold text-yellow-400">{activeCalls().length}</div>
              <div class="text-sm text-gray-400">Active Incidents</div>
            </div>
            <div class="bg-gray-800 p-4 rounded-lg">
              <div class="text-3xl font-bold">{commonMaterials.length}</div>
              <div class="text-sm text-gray-400">Materials in DB</div>
            </div>
            <div class="bg-gray-800 p-4 rounded-lg">
              <div class="text-3xl font-bold">4</div>
              <div class="text-sm text-gray-400">PPE Levels</div>
            </div>
            <div class="bg-gray-800 p-4 rounded-lg">
              <div class="text-3xl font-bold">9</div>
              <div class="text-sm text-gray-400">Hazard Classes</div>
            </div>
          </div>

          <div class="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <div class="font-semibold text-yellow-400 mb-2">⚠️ Quick Reference</div>
            <div class="text-sm text-gray-300 grid grid-cols-2 gap-2">
              <div>• Always approach from upwind / uphill</div>
              <div>• Identify UN number before engaging</div>
              <div>• Establish exclusion zones immediately</div>
              <div>• NEVER eat, drink or smoke in hot zone</div>
            </div>
          </div>
        </div>
      )}

      {/* Materials Database Tab */}
      {activeTab() === 'materials' && (
        <div class="flex-1 overflow-hidden grid grid-cols-3 gap-4">
          <div class="bg-gray-800 rounded-lg p-4 overflow-auto">
            <h3 class="font-semibold mb-3">Common Materials</h3>
            <div class="space-y-2">
              <For each={commonMaterials}>
                {material => (
                  <button
                    class={`w-full p-2 rounded text-left hover:bg-gray-700 transition ${selectedMaterial()?.id === material.id ? 'bg-gray-700 ring-2 ring-yellow-500' : ''}`}
                    onClick={() => setSelectedMaterial(material)}
                  >
                    <div class="flex items-center gap-2">
                      <span>{hazardClasses[material.class].icon}</span>
                      <div>
                        <div class="font-medium text-sm">{material.un}</div>
                        <div class="text-xs text-gray-400">{material.name}</div>
                      </div>
                    </div>
                  </button>
                )}
              </For>
            </div>
          </div>

          <div class="bg-gray-800 rounded-lg p-4 overflow-auto">
            <h3 class="font-semibold mb-3">Material Information</h3>
            {selectedMaterial() ? (
              <div class="space-y-3">
                <div class={`p-3 rounded ${hazardClasses[selectedMaterial().class].color}`}>
                  <div class="text-2xl font-bold">{selectedMaterial().un}</div>
                  <div class="text-lg">{selectedMaterial().name}</div>
                  <div class="text-sm opacity-80">Class {selectedMaterial().class} — {hazardClasses[selectedMaterial().class].name}</div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div class="bg-gray-700 p-2 rounded">
                    <div class="text-xs text-gray-400">Flash Point</div>
                    <div class="font-bold">{selectedMaterial().flashpoint !== null ? `${selectedMaterial().flashpoint}°C` : 'N/A'}</div>
                  </div>
                  <div class="bg-gray-700 p-2 rounded">
                    <div class="text-xs text-gray-400">Boiling Point</div>
                    <div class="font-bold">{selectedMaterial().boiling !== null ? `${selectedMaterial().boiling}°C` : 'N/A'}</div>
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-400 mb-1">Recommended PPE</div>
                  <div class="bg-red-900/50 p-2 rounded font-bold">
                    Level {selectedMaterial().class <= 3 ? 'B' : selectedMaterial().class <= 6 ? 'C' : 'A'}
                  </div>
                </div>
              </div>
            ) : (
              <div class="text-gray-500 text-center py-8">Select a material from the list</div>
            )}
          </div>

          <div class="bg-gray-800 rounded-lg p-4 overflow-auto">
            <h3 class="font-semibold mb-3">Exclusion Zones</h3>
            {selectedMaterial() ? (
              <div class="space-y-3">
                <div class="bg-red-900/60 border border-red-700 p-3 rounded">
                  <div class="font-bold text-red-300">🔴 Hot Zone (Restricted)</div>
                  <div class="text-sm">{calculateZones(selectedMaterial()).hot}m radius</div>
                  <div class="text-xs text-gray-400">Full PPE required. Entry by HazMat team only.</div>
                </div>
                <div class="bg-yellow-900/60 border border-yellow-700 p-3 rounded">
                  <div class="font-bold text-yellow-300">🟡 Warm Zone (Decon)</div>
                  <div class="text-sm">{calculateZones(selectedMaterial()).warm}m radius</div>
                  <div class="text-xs text-gray-400">Decontamination corridor. PPE required.</div>
                </div>
                <div class="bg-green-900/60 border border-green-700 p-3 rounded">
                  <div class="font-bold text-green-300">🟢 Cold Zone (Support)</div>
                  <div class="text-sm">{calculateZones(selectedMaterial()).cold}m radius</div>
                  <div class="text-xs text-gray-400">Command post and support operations.</div>
                </div>
                <button class="w-full px-3 py-2 bg-blue-600 rounded hover:bg-blue-500 text-sm">
                  🗺️ Draw Zones on Map
                </button>
              </div>
            ) : (
              <div class="text-gray-500 text-center py-8">Select a material to calculate zones</div>
            )}
          </div>
        </div>
      )}

      {/* Active Incidents Tab */}
      {activeTab() === 'active' && (
        <div class="flex-1 overflow-auto space-y-3">
          {activeCalls().length === 0 ? (
            <div class="flex flex-col items-center justify-center h-48 text-gray-500">
              <div class="text-4xl mb-3">✅</div>
              <div class="text-lg font-medium">No active HazMat incidents</div>
            </div>
          ) : (
            <For each={activeCalls()}>
              {incident => (
                <div class="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
                  <div class="flex items-center justify-between mb-2">
                    <div class="font-bold">Incident #{incident.id.toString().slice(0, 8)}</div>
                    <span class="px-2 py-1 bg-yellow-700 rounded text-xs">{incident.status}</span>
                  </div>
                  <div class="text-sm text-gray-400">
                    {new Date(incident.timestamp || incident.created_at).toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}
                  </div>
                  <div class="mt-2 text-sm">Units assigned: {incident.assignedUnits?.length || 0}</div>
                </div>
              )}
            </For>
          )}
        </div>
      )}

      {/* Response Procedures Tab */}
      {activeTab() === 'procedures' && (
        <div class="flex-1 overflow-auto grid grid-cols-2 gap-4">
          <For each={Object.entries(responseSteps)}>
            {([phase, steps]) => (
              <div class="bg-gray-800 rounded-lg p-4">
                <h3 class="font-semibold mb-3 text-yellow-400">{phase}</h3>
                <ol class="space-y-2">
                  <For each={steps}>
                    {(step, i) => (
                      <li class="flex items-start gap-2 text-sm">
                        <span class="w-5 h-5 rounded-full bg-yellow-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i() + 1}</span>
                        <span class="text-gray-300">{step}</span>
                      </li>
                    )}
                  </For>
                </ol>
              </div>
            )}
          </For>
        </div>
      )}

      {/* PPE Levels Tab */}
      {activeTab() === 'ppe' && (
        <div class="flex-1 overflow-auto space-y-4">
          <For each={protectionLevels}>
            {lvl => (
              <div class={`${lvl.color} rounded-lg p-5`}>
                <div class="flex items-center gap-3 mb-2">
                  <div class="text-3xl font-black">Level {lvl.level}</div>
                  <div class="text-lg font-semibold">{lvl.description}</div>
                </div>
                <div class="text-sm opacity-90">
                  <span class="font-medium">When required: </span>{lvl.required}
                </div>
              </div>
            )}
          </For>

          <div class="bg-gray-800 rounded-lg p-4">
            <h3 class="font-semibold mb-3">Donning Order (Put On)</h3>
            <div class="text-sm text-gray-300 space-y-1">
              <div>1. Inner gloves → 2. Suit → 3. SCBA → 4. Outer gloves → 5. Boots → 6. Buddy check</div>
            </div>
            <h3 class="font-semibold mb-3 mt-4">Doffing Order (Take Off — Decon Zone)</h3>
            <div class="text-sm text-gray-300 space-y-1">
              <div>1. Outer boots → 2. Outer gloves → 3. Suit → 4. SCBA → 5. Inner gloves → 6. Shower</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HazMatResponse
