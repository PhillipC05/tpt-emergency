# TPT Emergency System - Architecture Documentation

## System Overview

TPT Emergency is a offline-first emergency dispatch and vehicle tracking system built for real-time incident response operations.

---

## Core Technical Pillars

### 1. Offline First Architecture
- IndexedDB local storage for all mission critical data
- Automatic sync when connectivity is restored
- Service Worker for PWA offline support
- SQLite persistent database layer

### 2. Real-time Communications
- WebSocket connections with automatic reconnection
- Broadcast channel for cross-tab communication
- Beacon monitoring system for vehicle tracking
- Alarm receiver with audible notifications

### 3. Modular Dispatch System
- Component based architecture
- SolidJS reactivity system
- Map rendering with MapLibre GL
- Vehicle mode interface for field units

---

## Project Structure

```
tpt-emergency/
├── src/                          # Frontend Application
│   ├── components/              # Reusable UI Components
│   │   ├── Map.jsx             # Interactive Map Component
│   │   ├── VehicleMode.jsx     # Field Unit Interface
│   │   ├── AlarmReceiver.jsx   # Incident Alert System
│   │   └── ...
│   ├── modules/                 # Feature Modules
│   │   └── BeaconMonitoring.jsx
│   ├── lib/                     # Core Libraries
│   │   ├── offline-db.js       # Local Database Layer
│   │   ├── socket.js           # WebSocket Client
│   │   └── night-mode.js       # Theme System
│   ├── App.jsx                  # Root Application
│   └── index.jsx                # Entry Point
├── server/                      # Backend Server
│   └── index.js                # Node.js WebSocket Server
├── public/                      # Static Assets
├── deploy/                      # Deployment Configurations
└── scripts/                     # Utility Scripts
```

---

## Core Components

### Frontend Stack
| Component | Technology | Purpose |
|-----------|------------|---------|
| UI Framework | SolidJS | Reactive high performance rendering |
| Map Engine | MapLibre GL | Open source vector mapping |
| Styling | Tailwind CSS | Utility first responsive design |
| Build System | Vite | Modern fast build tooling |
| Offline Storage | IndexedDB | Local persistent data |
| PWA | Workbox | Service Worker management |

### Backend Stack
| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js | Server execution environment |
| WebSockets | Socket.IO | Real-time bidirectional communication |
| Database | SQLite | Persistent server storage |

---

## Data Flow

1. **Incoming Events** → WebSocket Server
2. **Broadcast** → All connected clients
3. **Local Storage** → IndexedDB persistence
4. **UI Reactivity** → SolidJS automatic updates
5. **User Actions** → Confirm, acknowledge, respond
6. **Sync Back** → Server replication when online

---

## Network Resilience

- Automatic connection state detection
- Queue for offline operations
- Exponential backoff reconnection
- Idempotent message processing
- Conflict resolution strategies

---

## Build Pipeline

1. Vite bundling and tree shaking
2. SolidJS JSX compilation
3. CSS optimization and purging
4. PWA Service Worker generation
5. Asset compression and caching
6. Bundle analysis and size checking