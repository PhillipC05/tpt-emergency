import { createSignal, createEffect, onMount, onCleanup } from 'solid-js'
import { BeaconMonitoring } from './BeaconMonitoring.jsx'

export function CommunicationsIntegration() {
  const [connectionStatus, setConnectionStatus] = createSignal({
    internet: false,
    localNetwork: false,
    cellular4g: false,
    cellular3g: false,
    bluetooth: false,
    radio: false,
    activeTransport: 'none',
    bandwidth: 0,
    latency: 0
  })

  const [gpsStatus, setGpsStatus] = createSignal({
    enabled: false,
    fix: false,
    satellites: 0,
    accuracy: 0,
    lastUpdate: null,
    latitude: null,
    longitude: null,
    speed: 0,
    heading: 0
  })

  const [radioStatus, setRadioStatus] = createSignal({
    connected: false,
    channel: 1,
    signal: 0,
    busy: false,
    transmitting: false,
    receiving: false
  })

  const [voipStatus, setVoipStatus] = createSignal({
    registered: false,
    calls: 0,
    activeCall: null,
    codec: 'OPUS',
    jitter: 0
  })

  const transports = [
    { id: 'internet', name: 'Cloud Server', icon: '☁️', priority: 1 },
    { id: 'cellular4g', name: '4G LTE', icon: '📶', priority: 2 },
    { id: 'cellular3g', name: '3G', icon: '📡', priority: 3 },
    { id: 'localNetwork', name: 'Local Network', icon: '🖧', priority: 4 },
    { id: 'radio', name: 'Digital Radio', icon: '📻', priority: 5 },
    { id: 'bluetooth', name: 'Bluetooth Mesh', icon: '🔵', priority: 6 }
  ]

  const checkConnectionStatus = async () => {
    const status = { ...connectionStatus() }
    
    // Check internet connectivity
    try {
      const start = Date.now()
      const res = await fetch('/api/health', { 
        method: 'HEAD', 
        cache: 'no-store',
        signal: AbortSignal.timeout(2000)
      })
      status.internet = res.ok
      status.latency = Date.now() - start
    } catch {
      status.internet = false
    }

    // Detect network type
    if ('connection' in navigator) {
      const conn = navigator.connection
      status.bandwidth = conn.downlink * 1024
      
      if (conn.effectiveType === '4g') {
        status.cellular4g = true
        status.cellular3g = false
      } else if (conn.effectiveType === '3g' || conn.effectiveType === '2g') {
        status.cellular4g = false
        status.cellular3g = true
      }
    }

    // Check local network peers
    status.localNetwork = window.socket?.connected || false

    // Select best active transport
    const available = transports.filter(t => status[t.id])
    available.sort((a, b) => a.priority - b.priority)
    status.activeTransport = available[0]?.id || 'offline'

    setConnectionStatus(status)
  }

  const initGPS = () => {
    if (!('geolocation' in navigator)) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGpsStatus({
          enabled: true,
          fix: true,
          satellites: position.coords.satellites || 0,
          accuracy: Math.round(position.coords.accuracy),
          lastUpdate: new Date(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: Math.round(position.coords.speed || 0),
          heading: Math.round(position.coords.heading || 0)
        })

        // Broadcast position if connected
        if (window.socket) {
          window.socket.emit('position:update', {
            unitId: window.unitId || 'browser',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: Date.now()
          })
        }
      },
      (error) => {
        setGpsStatus(s => ({ ...s, fix: false, error: error.message }))
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000
      }
    )

    onCleanup(() => navigator.geolocation.clearWatch(watchId))
  }

  const sendRadioPTT = (active) => {
    setRadioStatus(s => ({ ...s, transmitting: active }))
    
    if (window.bluetoothRadio) {
      window.bluetoothRadio.setPTT(active)
    }
  }

  const changeRadioChannel = (channel) => {
    setRadioStatus(s => ({ ...s, channel }))
  }

  const initVoIP = () => {
    // SIP / VoIP integration endpoint
    setVoipStatus(s => ({ ...s, registered: true }))
  }

  onMount(() => {
    checkConnectionStatus()
    initGPS()
    initVoIP()

    const interval = setInterval(checkConnectionStatus, 3000)
    onCleanup(() => clearInterval(interval))

    // Listen for network changes
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', checkConnectionStatus)
    }

    window.addEventListener('online', checkConnectionStatus)
    window.addEventListener('offline', checkConnectionStatus)
  })

  return (
    <div class="p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">Communications Integration</h2>
        <div class={`px-3 py-1 rounded text-sm font-bold ${
          connectionStatus().activeTransport !== 'offline' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {connectionStatus().activeTransport?.toUpperCase() || 'OFFLINE'}
        </div>
      </div>

      {/* Connection Status Grid */}
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        {transports.map(transport => (
          <div 
            class={`p-3 rounded border ${
              connectionStatus()[transport.id] 
                ? 'border-green-500 bg-green-900/20' 
                : 'border-gray-700 bg-gray-900/50 opacity-50'
            }`}
          >
            <div class="flex items-center gap-2">
              <span class="text-xl">{transport.icon}</span>
              <div>
                <div class="font-bold">{transport.name}</div>
                <div class="text-xs text-gray-400">
                  {connectionStatus()[transport.id] ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* GPS Status Card */}
      <div class={`p-4 rounded border ${
        gpsStatus().fix ? 'border-green-600 bg-green-900/10' : 'border-gray-700 bg-gray-900/30'
      }`}>
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold flex items-center gap-2">
            🛰️ GPS Receiver
          </h3>
          <span class={`px-2 py-0.5 rounded text-xs font-bold ${
            gpsStatus().fix ? 'bg-green-600' : 'bg-gray-700'
          }`}>
            {gpsStatus().fix ? 'FIX OK' : 'NO FIX'}
          </span>
        </div>
        
        <div class="grid grid-cols-4 gap-2 text-sm">
          <div class="text-center">
            <div class="text-gray-400 text-xs">Satellites</div>
            <div class="font-bold text-lg">{gpsStatus().satellites}</div>
          </div>
          <div class="text-center">
            <div class="text-gray-400 text-xs">Accuracy</div>
            <div class="font-bold text-lg">{gpsStatus().accuracy}m</div>
          </div>
          <div class="text-center">
            <div class="text-gray-400 text-xs">Speed</div>
            <div class="font-bold text-lg">{gpsStatus().speed} km/h</div>
          </div>
          <div class="text-center">
            <div class="text-gray-400 text-xs">Heading</div>
            <div class="font-bold text-lg">{gpsStatus().heading}°</div>
          </div>
        </div>

        {gpsStatus().lastUpdate && (
          <div class="text-xs text-gray-500 mt-2 text-right">
            Last update: {gpsStatus().lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Radio Control Panel */}
      <div class={`p-4 rounded border ${
        radioStatus().connected ? 'border-blue-600 bg-blue-900/10' : 'border-gray-700 bg-gray-900/30'
      }`}>
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold flex items-center gap-2">📻 Radio Control</h3>
          <span class={`px-2 py-0.5 rounded text-xs font-bold ${
            radioStatus().transmitting ? 'bg-red-600 animate-pulse' : 'bg-gray-700'
          }`}>
            {radioStatus().transmitting ? 'TRANSMITTING' : 'IDLE'}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-400 block mb-1">Channel</label>
            <select 
              value={radioStatus().channel}
              onInput={(e) => changeRadioChannel(parseInt(e.target.value))}
              class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
            >
              {Array.from({ length: 16 }, (_, i) => i + 1).map(ch => (
                <option value={ch}>Channel {ch}</option>
              ))}
            </select>
          </div>

          <div>
            <label class="text-xs text-gray-400 block mb-1">Signal Strength</label>
            <div class="flex items-center gap-1 h-9">
              {[1,2,3,4,5].map(bar => (
                <div class={`w-3 rounded ${
                  bar <= radioStatus().signal ? 'bg-green-500' : 'bg-gray-700'
                }`} style={{ height: `${bar * 4 + 8}px` }} />
              ))}
            </div>
          </div>
        </div>

        <button
          onMouseDown={() => sendRadioPTT(true)}
          onMouseUp={() => sendRadioPTT(false)}
          onMouseLeave={() => sendRadioPTT(false)}
          onTouchStart={() => sendRadioPTT(true)}
          onTouchEnd={() => sendRadioPTT(false)}
          class={`w-full mt-3 py-4 rounded font-bold text-xl select-none ${
            radioStatus().transmitting 
              ? 'bg-red-600 animate-pulse' 
              : 'bg-orange-600 hover:bg-orange-500'
          }`}
        >
          🎤 PUSH TO TALK
        </button>
      </div>

      {/* VoIP Status */}
      <div class={`p-4 rounded border ${
        voipStatus().registered ? 'border-purple-600 bg-purple-900/10' : 'border-gray-700 bg-gray-900/30'
      }`}>
        <div class="flex items-center justify-between">
          <h3 class="font-bold flex items-center gap-2">📞 VoIP Integration</h3>
          <span class={`px-2 py-0.5 rounded text-xs font-bold ${
            voipStatus().registered ? 'bg-purple-600' : 'bg-gray-700'
          }`}>
            {voipStatus().registered ? 'REGISTERED' : 'OFFLINE'}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2 mt-2 text-sm text-center">
          <div>
            <div class="text-gray-400 text-xs">Active Calls</div>
            <div class="font-bold">{voipStatus().calls}</div>
          </div>
          <div>
            <div class="text-gray-400 text-xs">Codec</div>
            <div class="font-bold">{voipStatus().codec}</div>
          </div>
          <div>
            <div class="text-gray-400 text-xs">Jitter</div>
            <div class="font-bold">{voipStatus().jitter}ms</div>
          </div>
        </div>
      </div>

      {/* Connection Metrics */}
      <div class="grid grid-cols-2 gap-3">
        <div class="p-3 rounded bg-gray-900 border border-gray-700">
          <div class="text-xs text-gray-400">Network Latency</div>
          <div class="font-bold text-xl">{connectionStatus().latency} ms</div>
        </div>
        <div class="p-3 rounded bg-gray-900 border border-gray-700">
          <div class="text-xs text-gray-400">Available Bandwidth</div>
          <div class="font-bold text-xl">{Math.round(connectionStatus().bandwidth)} kbps</div>
        </div>
      </div>

      <BeaconMonitoring />
    </div>
  )
}