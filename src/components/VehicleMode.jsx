/**
 * src/components/VehicleMode.jsx
 * Large touch friendly vehicle mode interface
 * Designed for in-vehicle operation with minimal visual load
 * Large buttons, high contrast, minimal distractions
 */

import { createSignal, createEffect, onMount } from 'solid-js'

export function VehicleMode() {
  const [vehicleMode, setVehicleMode] = createSignal(false)
  const [currentIncident, setCurrentIncident] = createSignal(null)
  const [unitStatus, setUnitStatus] = createSignal('available')
  const [eta, setEta] = createSignal('00:00')

  const toggleVehicleMode = () => {
    setVehicleMode(!vehicleMode())
    if (!vehicleMode()) {
      document.body.classList.add('vehicle-mode')
    } else {
      document.body.classList.remove('vehicle-mode')
    }
  }

  const statusColors = {
    available: 'bg-green-600',
    enroute: 'bg-blue-600',
    onscene: 'bg-yellow-600',
    transporting: 'bg-red-600',
    standby: 'bg-gray-600'
  }

  return (
    <div>
      {/* Vehicle Mode Toggle Button */}
      <button
        onClick={toggleVehicleMode}
        class="fixed bottom-4 right-24 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center text-2xl shadow-lg transition"
        title="Vehicle Mode"
      >
        🚗
      </button>

      {/* Vehicle Mode Full Screen Interface */}
      {vehicleMode() && (
        <div class="fixed inset-0 z-[100] bg-gray-900 text-white flex flex-col">
          {/* Header Bar */}
          <div class="h-20 bg-gray-800 flex items-center px-6 justify-between border-b-4 border-gray-700">
            <div class="text-4xl font-bold">🚑 TPT EMERGENCY</div>
            <div class="text-3xl font-mono">{new Date().toLocaleTimeString()}</div>
            <button
              onClick={toggleVehicleMode}
              class="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-3xl flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Main Content Area - Giant Buttons */}
          <div class="flex-1 p-8 grid grid-cols-2 gap-8">
            {/* Left Column - Status */}
            <div class="flex flex-col gap-6">
              <div class={`h-32 ${statusColors[unitStatus]} rounded-2xl flex items-center justify-center text-4xl font-bold`}>
                STATUS: {unitStatus().toUpperCase()}
              </div>

              <button
                onClick={() => setUnitStatus('enroute')}
                class="h-40 bg-blue-700 hover:bg-blue-600 rounded-2xl flex flex-col items-center justify-center text-4xl font-bold transition active:scale-95"
              >
                🚀 ENROUTE
              </button>

              <button
                onClick={() => setUnitStatus('onscene')}
                class="h-40 bg-yellow-700 hover:bg-yellow-600 rounded-2xl flex flex-col items-center justify-center text-4xl font-bold transition active:scale-95"
              >
                📍 ON SCENE
              </button>

              <button
                onClick={() => setUnitStatus('available')}
                class="h-40 bg-green-700 hover:bg-green-600 rounded-2xl flex flex-col items-center justify-center text-4xl font-bold transition active:scale-95"
              >
                ✅ AVAILABLE
              </button>
            </div>

            {/* Right Column - Actions */}
            <div class="flex flex-col gap-6">
              <div class="h-32 bg-gray-800 rounded-2xl flex items-center justify-center px-8">
                <div class="text-center">
                  <div class="text-xl text-gray-400">ESTIMATED TIME OF ARRIVAL</div>
                  <div class="text-6xl font-mono font-bold">{eta()}</div>
                </div>
              </div>

              <button
                class="h-40 bg-orange-700 hover:bg-orange-600 rounded-2xl flex flex-col items-center justify-center text-4xl font-bold transition active:scale-95"
              >
                📻 RADIO
              </button>

              <button
                class="h-40 bg-purple-700 hover:bg-purple-600 rounded-2xl flex flex-col items-center justify-center text-4xl font-bold transition active:scale-95"
              >
                📍 NAVIGATE
              </button>

              <button
                class="h-40 bg-red-700 hover:bg-red-600 rounded-2xl flex flex-col items-center justify-center text-4xl font-bold transition active:scale-95"
              >
                ⚠️ PANIC ALERT
              </button>
            </div>
          </div>

          {/* Bottom Status Bar */}
          <div class="h-16 bg-gray-800 flex items-center justify-center border-t-4 border-gray-700">
            <div class="text-2xl text-gray-400">
              Touch anywhere to wake • No auto timeout • System active
            </div>
          </div>
        </div>
      )}
    </div>
  )
}