import { createSignal, createEffect, onMount } from 'solid-js'

export function BluetoothManager() {
  const [devices, setDevices] = createSignal([])
  const [scanning, setScanning] = createSignal(false)
  const [supported, setSupported] = createSignal(false)
  const [connectedDevice, setConnectedDevice] = createSignal(null)

  onMount(() => {
    setSupported('bluetooth' in navigator)
  })

  const startScan = async () => {
    if (!supported()) return
    
    setScanning(true)
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'battery_service',
          'generic_access',
          'device_information'
        ]
      })

      device.addEventListener('gattserverdisconnected', () => {
        setConnectedDevice(null)
      })

      const server = await device.gatt.connect()
      
      setConnectedDevice({
        id: device.id,
        name: device.name,
        connected: true
      })

      setDevices(prev => {
        const existing = prev.find(d => d.id === device.id)
        if (existing) {
          return prev.map(d => d.id === device.id ? { ...d, connected: true } : d)
        }
        return [...prev, {
          id: device.id,
          name: device.name || 'Unknown Device',
          connected: true,
          lastSeen: Date.now()
        }]
      })

    } catch (err) {
      console.log('Bluetooth scan cancelled or failed', err)
    } finally {
      setScanning(false)
    }
  }

  const disconnect = async () => {
    if (connectedDevice()) {
      const device = devices().find(d => d.id === connectedDevice().id)
      if (device?.gatt?.connected) {
        device.gatt.disconnect()
      }
      setConnectedDevice(null)
    }
  }

  return (
    <div class="p-6">
      <div class="max-w-4xl mx-auto">
        <div class="mb-6">
          <h2 class="text-xl font-bold mb-2">Bluetooth Manager</h2>
          <p class="text-gray-400">Connect and manage bluetooth devices, beacons and equipment directly from your browser.</p>
        </div>

        {!supported() && (
          <div class="p-6 bg-yellow-900/30 border border-yellow-700 rounded-lg mb-6">
            <div class="flex items-center gap-3">
              <span class="text-2xl">⚠️</span>
              <div>
                <div class="font-semibold">Web Bluetooth not supported in this browser</div>
                <div class="text-sm text-yellow-300">Use Chrome, Edge or Safari 15.4+ for bluetooth functionality.</div>
              </div>
            </div>
          </div>
        )}

        <div class="bg-gray-800 rounded-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <div class="font-semibold">Device Scan</div>
              <div class="text-sm text-gray-400">Scan for nearby bluetooth devices</div>
            </div>
            <button 
              onClick={startScan}
              disabled={scanning() || !supported()}
              class={`px-4 py-2 rounded-lg font-medium ${scanning() ? 'bg-gray-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-500'} transition`}
            >
              {scanning() ? 'Scanning...' : '🔍 Scan for Devices'}
            </button>
          </div>

          {connectedDevice() && (
            <div class="p-4 bg-green-900/30 border border-green-700 rounded-lg mb-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <div>
                    <div class="font-semibold">{connectedDevice().name}</div>
                    <div class="text-sm text-green-400">Connected</div>
                  </div>
                </div>
                <button onClick={disconnect} class="px-3 py-1 bg-red-600 rounded text-sm">
                  Disconnect
                </button>
              </div>
            </div>
          )}

          <div class="space-y-2">
            <div class="text-sm text-gray-400 mb-3">Paired Devices:</div>
            
            {devices().length === 0 ? (
              <div class="text-center py-8 text-gray-500">
                No bluetooth devices paired. Click scan to search for devices.
              </div>
            ) : (
              devices().map(device => (
                <div class="p-3 rounded-lg bg-gray-700/50 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class={`w-2 h-2 rounded-full ${device.connected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <div>
                      <div class="font-medium">{device.name}</div>
                      <div class="text-xs text-gray-400">ID: {device.id.slice(0, 12)}...</div>
                    </div>
                  </div>
                  <div class="text-sm text-gray-400">
                    {device.connected ? 'Connected' : 'Last seen: ' + new Date(device.lastSeen).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div class="bg-gray-800 rounded-lg p-6">
          <h3 class="font-semibold mb-4">Supported Bluetooth Features</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded-lg bg-gray-700/50">✅ Beacon Monitoring</div>
            <div class="p-3 rounded-lg bg-gray-700/50">✅ Equipment Status</div>
            <div class="p-3 rounded-lg bg-gray-700/50">✅ Personnel Tracking</div>
            <div class="p-3 rounded-lg bg-gray-700/50">✅ Peer-to-Peer Sync</div>
            <div class="p-3 rounded-lg bg-gray-700/50">✅ Medical Devices</div>
            <div class="p-3 rounded-lg bg-gray-700/50">✅ Radio Interface</div>
          </div>
        </div>
      </div>
    </div>
  )
}