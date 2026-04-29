# Asset Provider Plugin System

TPT Emergency implements a generic asset provider interface that allows integration of any external system without modifying core application code.

This system was specifically designed for drone integration, but works equally well for:
✅ Drones / UAV Systems
✅ Robotics
✅ Remote Sensors
✅ Cameras
✅ Aircraft
✅ Marine Vessels
✅ Ground Vehicles
✅ Any other geospatial asset

---

## Core Design Principles

1.  **No manufacturer specific code in core system**
    All hardware and protocol specific implementations live entirely in separate provider plugins.

2.  **Future proof interface**
    The interface has been designed to be stable for at least 10 years. New capabilities can be added without breaking existing providers.

3.  **Offline first**
    All asset state is automatically cached locally, works completely without internet connectivity.

4.  **Zero trust**
    Providers run in isolated context, no privileged access to core system data.

---

## Implementing a Provider

All providers must extend the base `AssetProvider` class and implement the required interface methods:

```javascript
import { AssetProvider, ASSET_TYPES, ASSET_STATUS } from './src/lib/asset-provider.js';

export class MyCustomDroneProvider extends AssetProvider {
  // Provider metadata
  static metadata = {
    id: 'my-drone-provider',
    name: 'My Custom Drone Integration',
    description: 'Support for ACME Drone Systems',
    version: '1.0.0',
    author: 'Your Company',
    supportedTypes: [ASSET_TYPES.DRONE]
  };

  // Required implementation
  async initialize() {
    // Setup connection, authentication etc
    return true;
  }

  async connect() {
    // Connect to asset network / API
    return true;
  }

  async disconnect() {
    // Cleanup connections
    return true;
  }

  async sendCommand(assetId, command, payload) {
    // Send command to specific asset
    return { success: true };
  }
}
```

---

## Registering a Provider

```javascript
import { assetRegistry } from './src/lib/asset-provider.js';
import { MyCustomDroneProvider } from './my-provider.js';

// Register your provider
const provider = new MyCustomDroneProvider({
  apiKey: 'your-api-key',
  host: '192.168.1.100'
});

assetRegistry.register(provider);

// Initialize and connect
await provider.initialize();
await provider.connect();
```

---

## Asset Object Standard

All assets regardless of type use this standard structure:

```javascript
{
  id: 'drone-001',
  providerId: 'my-drone-provider',
  type: ASSET_TYPES.DRONE,
  name: 'Drone 01',
  status: ASSET_STATUS.ACTIVE,
  
  position: {
    lat: -36.8485,
    lng: 174.7633,
    altitude: 45.2,
    heading: 270,
    speed: 3.5
  },
  
  telemetry: {
    battery: 87,
    signal: 72,
    temperature: 24,
    custom: {
      // Any manufacturer specific telemetry
    }
  },
  
  capabilities: [
    'position',
    'video_stream',
    'thermal',
    'waypoint_mission',
    'return_to_home'
  ],
  
  metadata: {
    model: 'X8 Quadcopter',
    manufacturer: 'ACME Drones',
    serial: 'ACME-12345',
    firmware: 'v2.4.1'
  },
  
  lastUpdate: 1751234567890,
  lastSeen: 1751234567890
}
```

---

## Standard Commands

All assets should implement these standard commands where applicable:

| Command | Description | Payload |
|---------|-------------|---------|
| `takeoff` | Ascend to safe altitude | `{ altitude: number }` |
| `land` | Land at current position | |
| `rtl` / `return_to_home` | Return to home position | |
| `goto` | Go to specified coordinates | `{ lat: number, lng: number, altitude: number }` |
| `hold` | Hold current position | |
| `start_stream` | Start video stream | |
| `stop_stream` | Stop video stream | |

---

## Events

Providers emit standard events that the core system automatically handles:

| Event | Description | Data |
|-------|-------------|------|
| `asset:update` | Asset state has changed | Full asset object |
| `asset:added` | New asset discovered | Asset object |
| `asset:removed` | Asset no longer available | Asset ID |
| `provider:connected` | Provider connection established | Provider |
| `provider:disconnected` | Provider disconnected | Provider |
| `alert` | Asset critical alert | `{ assetId, level, message }` |

---

## Core System Integrations

When you implement a provider correctly you get all these features automatically:
✅ Real time asset position on the map
✅ Automatic flight path history logging & replay
✅ Incident correlation
✅ Permission system integration
✅ Offline caching
✅ Timeline logging against incidents
✅ Geofence compliance checking
✅ Audit logging of all commands

---

## Example Implementation

See `src/lib/providers/example-drone-provider.js` for a complete working reference implementation including position simulation.

---

## Official Providers

Official supported providers will be maintained in separate repositories:
- MAVLink / PX4 / ArduPilot
- DJI OSDK
- Skydio
- Autel Robotics

Third party providers are fully supported and encouraged.