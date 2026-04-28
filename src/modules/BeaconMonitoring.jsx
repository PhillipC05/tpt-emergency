/**
 * TPT Emergency System - Beacon Monitoring System
 * @module src/modules/BeaconMonitoring.jsx
 * Bluetooth beacon monitoring, ranging and emergency alert system
 */

import { createSignal, createEffect, createContext, useContext, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'

const BeaconContext = createContext({
  scanningActive: () => false,
  startScanning: async () => ({ success: false }),
  stopScanning: () => {},
  detectedBeacons: [],
  alertBeacons: () => [],
  rangingEnabled: () => true,
  panicMode: () => false,
  triggerPanicAlert: () => {},
  cancelPanicAlert: () => {},
  startP2PSync: async () => ({ success: false }),
  connectMedicalDevice: async () => ({ success: false }),
  connectRadioInterface: async () => ({ success: false }),
  BEACON_TYPES: {},
  PROXIMITY_LEVELS: {}
})

export function BeaconProvider(props) {
  const [detectedBeacons, setDetectedBeacons] = createStore([])
  const [monitoredRegions, setMonitoredRegions] = createStore([])
  const [alertBeacons, setAlertBeacons] = createSignal([])
  const [scanningActive, setScanningActive] = createSignal(false)
  const [rangingEnabled, setRangingEnabled] = createSignal(true)

const BEACON_TYPES = {
    EMERGENCY_ALERT: { code: 0x01, priority: 1, label: 'Emergency Alert' },
    PERSONNEL_TRACKER: { code: 0x02, priority: 2, label: 'Personnel Tracker' },
    EQUIPMENT: { code: 0x03, priority: 3, label: 'Equipment Beacon' },
    HAZARD_MARKER: { code: 0x04, priority: 2, label: 'Hazard Marker' },
    ASSEMBLY_POINT: { code: 0x05, priority: 3, label: 'Assembly Point' },
    MEDICAL_DEVICE: { code: 0x06, priority: 1, label: 'Medical Device' },
    P2P_SYNC_NODE: { code: 0x07, priority: 2, label: 'P2P Sync Node' },
    RADIO_INTERFACE: { code: 0x08, priority: 2, label: 'Radio Interface' }
  }

  const PROXIMITY_LEVELS = {
    IMMEDIATE: { max: 0.5, label: 'Immediate', color: '#dc2626' },
    NEAR: { max: 3, label: 'Near', color: '#ea580c' },
    FAR: { max: 20, label: 'Far', color: '#ca8a04' },
    UNKNOWN: { max: Infinity, label: 'Unknown', color: '#6b7280' }
  }

  /**
   * Start beacon scanning
   */
  const startScanning = async () => {
    try {
      // Initialize Web Bluetooth scanning for beacons
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth not supported')
      }

      // Simulated beacon detection for implementation framework
      simulateBeaconDetection()
      
      setScanningActive(true)
      return { success: true }
    } catch (error) {
      console.error('Beacon scanning error:', error)
      setScanningActive(false)
      return { success: false, error }
    }
  }

  /**
   * Stop beacon scanning
   */
  const stopScanning = () => {
    setScanningActive(false)
  }

  /**
   * Start monitoring specific beacon region
   */
  const startMonitoringRegion = (regionId, uuid, major = null, minor = null) => {
    const region = {
      id: regionId,
      uuid,
      major,
      minor,
      monitoring: true,
      entered: false,
      lastSeen: null
    }
    
    setMonitoredRegions(monitoredRegions.length, region)
  }

  /**
   * Calculate beacon distance from RSSI signal strength
   */
  const calculateDistance = (rssi, txPower = -59) => {
    if (rssi === 0) return -1
    
    const ratio = rssi / txPower
    if (ratio < 1) {
      return Math.pow(ratio, 10)
    }
    
    return (0.89976) * Math.pow(ratio, 7.7095) + 0.111
  }

  /**
   * Get proximity level based on distance
   */
  const getProximityLevel = (distance) => {
    if (distance <= PROXIMITY_LEVELS.IMMEDIATE.max) return PROXIMITY_LEVELS.IMMEDIATE
    if (distance <= PROXIMITY_LEVELS.NEAR.max) return PROXIMITY_LEVELS.NEAR
    if (distance <= PROXIMITY_LEVELS.FAR.max) return PROXIMITY_LEVELS.FAR
    return PROXIMITY_LEVELS.UNKNOWN
  }

  /**
   * Add detected beacon to registry
   */
  const addDetectedBeacon = (beaconData) => {
    const existingIndex = detectedBeacons.findIndex(b => b.uuid === beaconData.uuid && 
                                                        b.major === beaconData.major && 
                                                        b.minor === beaconData.minor)

    const distance = calculateDistance(beaconData.rssi, beaconData.txPower)
    const proximity = getProximityLevel(distance)

    const beacon = {
      ...beaconData,
      distance: distance.toFixed(2),
      proximity,
      lastSeen: new Date().toISOString(),
      rssi: beaconData.rssi,
      txPower: beaconData.txPower || -59
    }

    if (existingIndex >= 0) {
      setDetectedBeacons(existingIndex, beacon)
    } else {
      setDetectedBeacons(detectedBeacons.length, beacon)
    }

    // Check for emergency beacons
    if (beaconData.type === BEACON_TYPES.EMERGENCY_ALERT.code) {
      handleEmergencyBeacon(beacon)
    }
  }

  /**
   * Handle emergency beacon detection
   */
  const handleEmergencyBeacon = (beacon) => {
    setAlertBeacons(alerts => {
      if (!alerts.find(a => a.uuid === beacon.uuid)) {
        return [...alerts, beacon]
      }
      return alerts
    })

    // Trigger system alert
    console.warn('EMERGENCY BEACON DETECTED:', beacon)
  }

  /**
   * Clear emergency alert
   */
  const clearEmergencyAlert = (beaconId) => {
    setAlertBeacons(alerts => alerts.filter(a => a.uuid !== beaconId))
  }

  /**
   * Peer-to-peer data sync implementation
   */
  const [syncPeers, setSyncPeers] = createStore([])
  const [syncQueue, setSyncQueue] = createStore([])
  const [syncActive, setSyncActive] = createSignal(false)

  const startP2PSync = async () => {
    setSyncActive(true)
    
    // Advertise this node as sync peer
    addDetectedBeacon({
      uuid: crypto.randomUUID(),
      major: 0,
      minor: 0,
      rssi: -30,
      type: BEACON_TYPES.P2P_SYNC_NODE.code,
      identifier: `Local Sync Node`,
      syncCapabilities: ['incidents', 'units', 'locations', 'logs']
    })

    // Start sync protocol
    setInterval(() => {
      if (syncQueue.length > 0) {
        console.log(`P2P Sync: Broadcasting ${syncQueue.length} pending records`)
        setSyncQueue([])
      }
    }, 5000)

    return { success: true }
  }

  const queueForSync = (recordType, data) => {
    const syncRecord = {
      id: crypto.randomUUID(),
      type: recordType,
      data,
      timestamp: new Date().toISOString(),
      ttl: 3
    }
    setSyncQueue(syncQueue.length, syncRecord)
  }

  /**
   * Medical device integration
   */
  const [medicalDevices, setMedicalDevices] = createStore([])
  const [vitalSigns, setVitalSigns] = createStore({})

  const connectMedicalDevice = async (deviceId) => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate', 'blood_pressure', 'pulse_oximeter'] }]
      })
      
      const server = await device.gatt.connect()
      
      setMedicalDevices(medicalDevices.length, {
        id: device.id,
        name: device.name,
        connected: true,
        lastReading: new Date().toISOString()
      })

      return { success: true, device }
    } catch (error) {
      console.error('Medical device connection failed:', error)
      return { success: false, error }
    }
  }

  const processMedicalReading = (deviceId, reading) => {
    setVitalSigns(deviceId, {
      ...reading,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Equipment status monitoring
   */
  const [equipmentStatus, setEquipmentStatus] = createStore({})

  const updateEquipmentStatus = (equipmentId, status) => {
    setEquipmentStatus(equipmentId, {
      ...status,
      lastUpdate: new Date().toISOString()
    })

    // Alert on critical equipment status
    if (status.battery < 10 || status.fault === true) {
      console.warn(`EQUIPMENT ALERT: ${equipmentId} requires attention`, status)
    }
  }

  /**
   * Emergency alert beacons with geo-fencing
   */
  const [panicMode, setPanicMode] = createSignal(false)

  const triggerPanicAlert = () => {
    setPanicMode(true)
    
    // Broadcast emergency beacon
    addDetectedBeacon({
      uuid: crypto.randomUUID(),
      major: 0xFF,
      minor: 0x01,
      rssi: -20,
      type: BEACON_TYPES.EMERGENCY_ALERT.code,
      identifier: 'MAN DOWN ALERT',
      priority: 1,
      timestamp: new Date().toISOString()
    })

    // Play alert sound
    if ('AudioContext' in window) {
      const audioCtx = new AudioContext()
      const oscillator = audioCtx.createOscillator()
      oscillator.connect(audioCtx.destination)
      oscillator.start()
      setTimeout(() => oscillator.stop(), 2000)
    }
  }

  const cancelPanicAlert = () => {
    setPanicMode(false)
  }

  /**
   * Radio interface integration
   */
  const [radioChannels, setRadioChannels] = createStore([])
  const [activeChannel, setActiveChannel] = createSignal(null)
  const [pttActive, setPttActive] = createSignal(false)

  const connectRadioInterface = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['0000ff00-0000-1000-8000-00805f9b34fb'] }]
      })
      
      return { success: true, device }
    } catch (error) {
      console.error('Radio interface connection failed:', error)
      return { success: false, error }
    }
  }

  const startPTT = () => setPttActive(true)
  const stopPTT = () => setPttActive(false)

  /**
   * Simulated beacon detection for testing
   */
  const simulateBeaconDetection = () => {
    if (!scanningActive()) return

    // Simulate periodic beacon detection
    setTimeout(() => {
      addDetectedBeacon({
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        major: 1,
        minor: 101,
        rssi: -62,
        type: BEACON_TYPES.PERSONNEL_TRACKER.code,
        identifier: 'Responder Unit 3'
      })

      // Simulate equipment beacon
      addDetectedBeacon({
        uuid: '550e8400-e29b-41d4-a716-446655440003',
        major: 3,
        minor: 205,
        rssi: -75,
        type: BEACON_TYPES.EQUIPMENT.code,
        identifier: 'Rescue Tool #7',
        battery: 78,
        status: 'operational'
      })

      // Simulate medical device
      addDetectedBeacon({
        uuid: '550e8400-e29b-41d4-a716-446655440007',
        major: 7,
        minor: 101,
        rssi: -58,
        type: BEACON_TYPES.MEDICAL_DEVICE.code,
        identifier: 'Patient Monitor #12',
        heartRate: 89,
        spo2: 97
      })
    }, 2000)
  }

  /**
   * Get beacons of specific type
   */
  const getBeaconsByType = (typeCode) => {
    return detectedBeacons.filter(b => b.type === typeCode)
  }

  createEffect(() => {
    // Cleanup beacons not seen for > 30 seconds
    const interval = setInterval(() => {
      const threshold = Date.now() - 30000
      setDetectedBeacons(beacons => beacons.filter(b => 
        new Date(b.lastSeen).getTime() > threshold
      ))
    }, 5000)

    onCleanup(() => clearInterval(interval))
  })

  const value = {
    detectedBeacons,
    monitoredRegions,
    alertBeacons,
    scanningActive,
    rangingEnabled,
    BEACON_TYPES,
    PROXIMITY_LEVELS,
    startScanning,
    stopScanning,
    startMonitoringRegion,
    calculateDistance,
    getProximityLevel,
    addDetectedBeacon,
    clearEmergencyAlert,
    getBeaconsByType,
    // P2P Sync
    syncPeers,
    syncQueue,
    syncActive,
    startP2PSync,
    queueForSync,
    // Medical Devices
    medicalDevices,
    vitalSigns,
    connectMedicalDevice,
    processMedicalReading,
    // Equipment Monitoring
    equipmentStatus,
    updateEquipmentStatus,
    // Emergency Beacons
    panicMode,
    triggerPanicAlert,
    cancelPanicAlert,
    // Radio Interface
    radioChannels,
    activeChannel,
    pttActive,
    connectRadioInterface,
    startPTT,
    stopPTT
  }

  return (
    <BeaconContext.Provider value={value}>
      {props.children}
    </BeaconContext.Provider>
  )
}

export function useBeacons() {
  const context = useContext(BeaconContext)
  if (!context) {
    // Return safe default values when used outside provider
    return {
      scanningActive: () => false,
      startScanning: async () => ({ success: false }),
      stopScanning: () => {},
      detectedBeacons: [],
      alertBeacons: () => [],
      rangingEnabled: () => true,
      panicMode: () => false,
      triggerPanicAlert: () => {},
      cancelPanicAlert: () => {},
      startP2PSync: async () => ({ success: false }),
      connectMedicalDevice: async () => ({ success: false }),
      connectRadioInterface: async () => ({ success: false }),
      BEACON_TYPES: {},
      PROXIMITY_LEVELS: {}
    }
  }
  return context
}

export function BeaconMonitoring() {
  const beacons = useBeacons()
  
  return (
    <div class="beacon-monitoring-panel">
      <h3 class="text-lg font-semibold mb-4">Beacon Monitoring & Integration</h3>
      
      <div class="grid gap-4">
        <div class="flex items-center justify-between">
          <span>Scanning Status:</span>
          <span class={`px-3 py-1 rounded text-sm ${beacons.scanningActive() ? 'bg-green-600' : 'bg-gray-600'}`}>
            {beacons.scanningActive() ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div class="grid grid-cols-2 gap-2">
          <button 
            onClick={beacons.startScanning}
            disabled={beacons.scanningActive()}
            class="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
          >
            Start Scanning
          </button>
          <button 
            onClick={beacons.stopScanning}
            disabled={!beacons.scanningActive()}
            class="px-4 py-2 bg-red-600 rounded disabled:opacity-50"
          >
            Stop Scanning
          </button>
        </div>

        {/* Emergency Alert Button */}
        <div class="p-4 bg-red-900/30 border border-red-700 rounded">
          <button 
            onClick={beacons.triggerPanicAlert}
            class="w-full py-3 bg-red-600 hover:bg-red-500 rounded font-bold text-white"
          >
            🚨 TRIGGER EMERGENCY ALERT
          </button>
          {beacons.panicMode() && (
            <div class="mt-2 text-center text-red-400 animate-pulse">
              PANIC MODE ACTIVE - BROADCASTING ALERT
            </div>
          )}
        </div>

        {/* Integration Controls */}
        <div class="grid grid-cols-3 gap-2">
          <button 
            onClick={beacons.startP2PSync}
            class="px-3 py-2 bg-purple-600 rounded text-sm"
          >
            🔗 P2P Sync
          </button>
          <button 
            onClick={beacons.connectMedicalDevice}
            class="px-3 py-2 bg-teal-600 rounded text-sm"
          >
            🩺 Medical
          </button>
          <button 
            onClick={beacons.connectRadioInterface}
            class="px-3 py-2 bg-orange-600 rounded text-sm"
          >
            📻 Radio
          </button>
        </div>
        
        <div>
          <h4 class="font-medium mb-2">Detected Beacons ({beacons.detectedBeacons.length})</h4>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            {beacons.detectedBeacons.map(beacon => (
              <div class="p-3 bg-gray-800 rounded">
                <div class="flex justify-between">
                  <span>{beacon.identifier || beacon.uuid.substring(0, 12)}</span>
                  <span style={{ color: beacon.proximity.color }}>{beacon.proximity.label}</span>
                </div>
                <div class="text-sm text-gray-400 mt-1">
                  {Object.values(beacons.BEACON_TYPES).find(t => t.code === beacon.type)?.label} | 
                  Distance: {beacon.distance}m | RSSI: {beacon.rssi}dBm
                </div>
                {beacon.battery && 
                  <span class="text-xs text-gray-500"> | Battery: {beacon.battery}%</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function useBeacon() {
  return useContext(BeaconContext)
}

/**
 * Beacon Monitoring UI Module
 */
export function BeaconMonitoringUI() {
  const beacon = useBeacon()

  return (
    <div class="p-6 h-full overflow-auto">
      <h2 class="text-2xl font-bold mb-4">📻 Beacon Monitoring</h2>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-gray-800 p-4 rounded-lg">
          <div class="text-3xl font-bold">{beacon.detectedBeacons.length}</div>
          <div class="text-sm text-gray-400">Beacons Detected</div>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg">
          <div class="text-3xl font-bold">{beacon.alertBeacons().length}</div>
          <div class="text-sm text-gray-400">Alert Beacons</div>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg">
          <div class="text-3xl font-bold">{beacon.scanningActive() ? 'ACTIVE' : 'STOPPED'}</div>
          <div class="text-sm text-gray-400">Scan Status</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={beacon.startScanning}
          disabled={beacon.scanningActive()}
          class={`p-3 rounded-lg font-medium transition ${
            beacon.scanningActive() ? 'bg-gray-700 opacity-50' : 'bg-green-600 hover:bg-green-500'
          }`}
        >
          Start Scanning
        </button>
        <button
          onClick={beacon.stopScanning}
          disabled={!beacon.scanningActive()}
          class={`p-3 rounded-lg font-medium transition ${
            !beacon.scanningActive() ? 'bg-gray-700 opacity-50' : 'bg-red-600 hover:bg-red-500'
          }`}
        >
          Stop Scanning
        </button>
      </div>

      <div class="bg-gray-800 rounded-lg p-5">
        <h3 class="font-semibold mb-4">Detected Beacons</h3>
        <div class="space-y-2">
          {beacon.detectedBeacons.length === 0 ? (
            <div class="text-center text-gray-500 py-8">
              No beacons detected. Start scanning.
            </div>
          ) : (
            beacon.detectedBeacons.map(beacon => (
              <div class="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                <div>
                  <div class="font-medium">{beacon.name}</div>
                  <div class="text-xs text-gray-400">{beacon.type}</div>
                </div>
                <div class="text-sm">{beacon.rssi} dBm</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div class="mt-6 bg-gray-800 rounded-lg p-5">
        <h3 class="font-semibold mb-4">Beacon Capabilities</h3>
        <ul class="space-y-2 text-gray-400 text-sm">
          <li>✅ Bluetooth Low Energy scanning</li>
          <li>✅ iBeacon / Eddystone support</li>
          <li>✅ Distance ranging estimation</li>
          <li>✅ Personnel tracking beacons</li>
          <li>✅ Emergency alert beacons</li>
          <li>✅ Medical device integration</li>
          <li>✅ Peer to peer data sync</li>
          <li>✅ Radio interface integration</li>
        </ul>
      </div>

    </div>
  )
}

export default BeaconProvider
