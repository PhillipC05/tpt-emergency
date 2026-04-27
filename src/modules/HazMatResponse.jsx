import { createSignal, createEffect, onMount, For } from 'solid-js'
import { useDispatch } from './CommonDispatchLayer'

export function HazMatResponse() {
  const dispatch = useDispatch()
  const [activeHazards, setActiveHazards] = createSignal([])
  const [selectedMaterial, setSelectedMaterial] = createSignal(null)

  const hazardClasses = {
    1: { name: 'Explosives', color: 'bg-orange-700', icon: '💥' },
    2: { name: 'Gases', color: 'bg-green-700', icon: '💨' },
    3: { name: 'Flammable Liquids', color: 'bg-red-700', icon: '🔥' },
    4: { name: 'Flammable Solids', color: 'bg-red-600', icon: '🧨' },
    5: { name: 'Oxidizing', color: 'bg-yellow-600', icon: '⚗️' },
    6: { name: 'Toxic', color: 'bg-purple-700', icon: '☠️' },
    7: { name: 'Radioactive', color: 'bg-yellow-700', icon: '☢️' },
    8: { name: 'Corrosive', color: 'bg-black', icon: '🧪' },
    9: { name: 'Miscellaneous', color: 'bg-gray-700', icon: '⚠️' }
  }

  const protectionLevels = [
    { level: 'A', description: 'Fully Encapsulating Suit', required: 'Extreme hazard' },
    { level: 'B', description: 'Vapor Protective Suit', required: 'Unknown atmosphere' },
    { level: 'C', description: 'Air Purifying Respirator', required: 'Known atmosphere' },
    { level: 'D', description: 'Standard Work Uniform', required: 'Minimal hazard' }
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

  const calculateZones = (material, windSpeed, windDirection) => {
    const baseDistance = material.class === 7 ? 1000 : 
                         material.class === 6 ? 500 : 
                         material.class === 8 ? 300 : 200
    
    return {
      hot: baseDistance,
      warm: baseDistance * 3,
      cold: baseDistance * 5,
      evacuation: baseDistance * windSpeed / 5
    }
  }

  return (
    <div class="p-6 h-full flex flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">☢️ Hazardous Materials Response</h2>
      </div>

      <div class="grid grid-cols-9 gap-2 mb-4">
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

      <div class="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
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
                      <div class="font-medium">{material.un}</div>
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
                <div class="text-sm opacity-80">Class {selectedMaterial().class} - {hazardClasses[selectedMaterial().class].name}</div>
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
                <div class="text-sm text-gray-400 mb-1">Recommended Protection Level</div>
                <div class="bg-red-900 p-2 rounded font-bold">
                  Level {selectedMaterial().class <= 3 ? 'B' : selectedMaterial().class <= 6 ? 'C' : 'A'}
                </div>
              </div>
            </div>
          ) : (
            <div class="text-gray-500 text-center py-8">Select a material</div>
          )}
        </div>

        <div class="bg-gray-800 rounded-lg p-4 overflow-auto">
          <h3 class="font-semibold mb-3">Exclusion Zones</h3>
          
          {selectedMaterial() ? (
            <div class="space-y-3">
              <div class="bg-red-900 p-2 rounded">
                <div class="font-bold">Hot Zone (Restricted)</div>
                <div class="text-sm">{calculateZones(selectedMaterial(), 10, 0).hot}m radius</div>
              </div>
              <div class="bg-yellow-900 p-2 rounded">
                <div class="font-bold">Warm Zone (Contamination Reduction)</div>
                <div class="text-sm">{calculateZones(selectedMaterial(), 10, 0).warm}m radius</div>
              </div>
              <div class="bg-green-900 p-2 rounded">
                <div class="font-bold">Cold Zone (Support)</div>
                <div class="text-sm">{calculateZones(selectedMaterial(), 10, 0).cold}m radius</div>
              </div>

              <button class="w-full mt-4 px-3 py-2 bg-blue-600 rounded hover:bg-blue-500">
                🗺️ Draw Zones on Map
              </button>
            </div>
          ) : (
            <div class="text-gray-500 text-center py-8">Select a material</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HazMatResponse