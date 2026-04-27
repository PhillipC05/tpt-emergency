/**
 * TPT Emergency System - Common Dispatch Layer
 * @module src/modules/CommonDispatchLayer.jsx
 * Shared dispatch system used across all emergency service modules
 */

import { createSignal, createEffect, createContext, useContext, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'

// Dispatch Context
const DispatchContext = createContext()

/**
 * Dispatch Provider Component
 * Provides shared dispatch functionality to all modules
 */
export function DispatchProvider(props) {
  const [incidents, setIncidents] = createStore([])
  const [units, setUnits] = createStore([])
  const [activeDispatch, setActiveDispatch] = createSignal(null)
  const [dispatchLog, setDispatchLog] = createStore([])

  // Unit status constants
  const UNIT_STATUS = {
    AVAILABLE: 'available',
    DISPATCHED: 'dispatched',
    ON_SCENE: 'on_scene',
    RETURNING: 'returning',
    OUT_OF_SERVICE: 'out_of_service'
  }

  // Incident priority constants
  const INCIDENT_PRIORITY = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
    EMERGENCY: 5
  }

  /**
   * Create a new incident
   */
  const createIncident = (incidentData) => {
    const newIncident = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: 'pending',
      priority: INCIDENT_PRIORITY.MEDIUM,
      assignedUnits: [],
      ...incidentData
    }

    setIncidents(incidents.length, newIncident)
    addDispatchLog('INCIDENT_CREATED', `New incident created: ${incidentData.type}`)
    
    return newIncident
  }

  /**
   * Dispatch unit to incident
   */
  const dispatchUnit = (unitId, incidentId) => {
    const unit = units.find(u => u.id === unitId)
    const incident = incidents.find(i => i.id === incidentId)

    if (!unit || !incident) return null

    setUnits(
      u => u.id === unitId,
      {
        status: UNIT_STATUS.DISPATCHED,
        assignedIncident: incidentId,
        dispatchedAt: new Date().toISOString()
      }
    )

    setIncidents(
      i => i.id === incidentId,
      i => ({ assignedUnits: [...i.assignedUnits, unitId] })
    )

    addDispatchLog('UNIT_DISPATCHED', `Unit ${unit.callSign} dispatched to incident #${incidentId}`)

    return { unit, incident }
  }

  /**
   * Update unit status
   */
  const updateUnitStatus = (unitId, status, additionalData = {}) => {
    setUnits(
      u => u.id === unitId,
      {
        status,
        updatedAt: new Date().toISOString(),
        ...additionalData
      }
    )

    addDispatchLog('STATUS_UPDATED', `Unit status updated: ${status}`)
  }

  /**
   * Add entry to dispatch log
   */
  const addDispatchLog = (type, message, metadata = {}) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type,
      message,
      metadata
    }

    setDispatchLog(dispatchLog.length, logEntry)
  }

  /**
   * Get available units for specific type
   */
  const getAvailableUnits = (type = null) => {
    return units.filter(u => 
      u.status === UNIT_STATUS.AVAILABLE && 
      (!type || u.type === type)
    )
  }

  /**
   * Register new unit to dispatch system
   */
  const registerUnit = (unitData) => {
    const newUnit = {
      id: Date.now() + Math.random(),
      status: UNIT_STATUS.AVAILABLE,
      registeredAt: new Date().toISOString(),
      ...unitData
    }

    setUnits(units.length, newUnit)
    addDispatchLog('UNIT_REGISTERED', `New unit registered: ${unitData.callSign}`)
    
    return newUnit
  }

  createEffect(() => {
    // Initialize default units for each service
    if (units.length === 0) {
      // Fire Department Units
      registerUnit({ type: 'fire', callSign: 'E1', name: 'Engine 1', station: 'Station 1' })
      registerUnit({ type: 'fire', callSign: 'E2', name: 'Engine 2', station: 'Station 2' })
      registerUnit({ type: 'fire', callSign: 'T1', name: 'Truck 1', station: 'Station 1' })
      registerUnit({ type: 'fire', callSign: 'B1', name: 'Battalion Chief', station: 'HQ' })

      // Ambulance Units
      registerUnit({ type: 'ambulance', callSign: 'A1', name: 'Ambulance 1', station: 'Medical Center' })
      registerUnit({ type: 'ambulance', callSign: 'A2', name: 'Ambulance 2', station: 'Medical Center' })
      registerUnit({ type: 'ambulance', callSign: 'M1', name: 'Medic 1', station: 'Hospital' })

      // Police Units
      registerUnit({ type: 'police', callSign: 'P1', name: 'Patrol 1', district: 'Central' })
      registerUnit({ type: 'police', callSign: 'P2', name: 'Patrol 2', district: 'North' })
      registerUnit({ type: 'police', callSign: 'K9', name: 'K9 Unit', district: 'West' })

      // Disaster Response
      registerUnit({ type: 'disaster', callSign: 'USAR1', name: 'USAR Team 1', station: 'Regional Base' })
      registerUnit({ type: 'disaster', callSign: 'HAZ1', name: 'Hazmat Team 1', station: 'Regional Base' })
    }
  })

  const value = {
    incidents,
    units,
    dispatchLog,
    activeDispatch,
    UNIT_STATUS,
    INCIDENT_PRIORITY,
    createIncident,
    dispatchUnit,
    updateUnitStatus,
    getAvailableUnits,
    registerUnit,
    addDispatchLog
  }

  return (
    <DispatchContext.Provider value={value}>
      {props.children}
    </DispatchContext.Provider>
  )
}

/**
 * Hook to access dispatch system
 */
export function useDispatch() {
  return useContext(DispatchContext)
}

export default DispatchProvider