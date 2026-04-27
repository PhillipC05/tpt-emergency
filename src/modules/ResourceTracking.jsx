/**
 * TPT Emergency System - Resource Tracking System
 * @module src/modules/ResourceTracking.jsx
 * Shared resource tracking and management system across all modules
 */

import { createSignal, createEffect, createContext, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { useDispatch } from './CommonDispatchLayer'

const ResourceContext = createContext()

export function ResourceProvider(props) {
  const dispatch = useDispatch()
  
  const [resources, setResources] = createStore([])
  const [resourceLog, setResourceLog] = createStore([])
  const [allocationHistory, setAllocationHistory] = createStore([])

  const RESOURCE_TYPES = {
    PERSONNEL: 'personnel',
    VEHICLE: 'vehicle',
    EQUIPMENT: 'equipment',
    SUPPLIES: 'supplies',
    SPECIALIZED: 'specialized'
  }

  const RESOURCE_STATUS = {
    AVAILABLE: 'available',
    ALLOCATED: 'allocated',
    IN_USE: 'in_use',
    MAINTENANCE: 'maintenance',
    DEPLETED: 'depleted'
  }

  /**
   * Register a new resource to the tracking system
   */
  const registerResource = (resourceData) => {
    const newResource = {
      id: Date.now() + Math.random(),
      status: RESOURCE_STATUS.AVAILABLE,
      quantity: 1,
      currentLocation: null,
      assignedIncident: null,
      assignedUnit: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...resourceData
    }

    setResources(resources.length, newResource)
    addResourceLog('RESOURCE_REGISTERED', `Resource registered: ${resourceData.name}`, { resourceId: newResource.id })
    
    return newResource
  }

  /**
   * Allocate resource to an incident
   */
  const allocateResource = (resourceId, incidentId, unitId = null, quantity = 1) => {
    const resource = resources.find(r => r.id === resourceId)
    
    if (!resource || resource.status !== RESOURCE_STATUS.AVAILABLE) return null
    if (resource.quantity < quantity) return null

    setResources(
      r => r.id === resourceId,
      {
        status: RESOURCE_STATUS.ALLOCATED,
        assignedIncident: incidentId,
        assignedUnit: unitId,
        allocatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    )

    addResourceLog('RESOURCE_ALLOCATED', `Resource allocated to incident #${incidentId}`, {
      resourceId,
      incidentId,
      unitId,
      quantity
    })

    setAllocationHistory(allocationHistory.length, {
      resourceId,
      incidentId,
      unitId,
      quantity,
      allocatedAt: new Date().toISOString()
    })

    return true
  }

  /**
   * Release resource back to pool
   */
  const releaseResource = (resourceId) => {
    const resource = resources.find(r => r.id === resourceId)
    
    if (!resource) return null

    setResources(
      r => r.id === resourceId,
      {
        status: RESOURCE_STATUS.AVAILABLE,
        assignedIncident: null,
        assignedUnit: null,
        allocatedAt: null,
        updatedAt: new Date().toISOString()
      }
    )

    addResourceLog('RESOURCE_RELEASED', `Resource released back to pool`, { resourceId })
    return true
  }

  /**
   * Update resource status
   */
  const updateResourceStatus = (resourceId, status, additionalData = {}) => {
    setResources(
      r => r.id === resourceId,
      {
        status,
        updatedAt: new Date().toISOString(),
        ...additionalData
      }
    )

    addResourceLog('RESOURCE_UPDATED', `Resource status updated: ${status}`, { resourceId })
  }

  /**
   * Get available resources by type
   */
  const getAvailableResources = (type = null) => {
    return resources.filter(r => 
      r.status === RESOURCE_STATUS.AVAILABLE && 
      (!type || r.type === type)
    )
  }

  /**
   * Get resources assigned to incident
   */
  const getIncidentResources = (incidentId) => {
    return resources.filter(r => r.assignedIncident === incidentId)
  }

  /**
   * Add entry to resource log
   */
  const addResourceLog = (type, message, metadata = {}) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type,
      message,
      metadata
    }

    setResourceLog(resourceLog.length, logEntry)
  }

  createEffect(() => {
    if (resources.length === 0) {
      // Standard Equipment
      registerResource({ type: 'equipment', name: 'Defibrillator', category: 'medical', serialNumber: 'MED-001' })
      registerResource({ type: 'equipment', name: 'Breathing Apparatus', category: 'fire', serialNumber: 'FIR-001' })
      registerResource({ type: 'equipment', name: 'Thermal Imaging Camera', category: 'fire', serialNumber: 'FIR-002' })
      registerResource({ type: 'equipment', name: 'Jaws of Life', category: 'rescue', serialNumber: 'RES-001' })
      
      // Supplies
      registerResource({ type: 'supplies', name: 'Medical Kits', category: 'medical', quantity: 50, unit: 'kits' })
      registerResource({ type: 'supplies', name: 'Oxygen Bottles', category: 'medical', quantity: 24, unit: 'bottles' })
      registerResource({ type: 'supplies', name: 'Foam Concentrate', category: 'fire', quantity: 500, unit: 'litres' })
      
      // Personnel
      registerResource({ type: 'personnel', name: 'Paramedic', skillLevel: 'advanced', certification: 'ACP' })
      registerResource({ type: 'personnel', name: 'Firefighter', skillLevel: 'advanced', certification: 'FF2' })
      registerResource({ type: 'personnel', name: 'Hazmat Technician', skillLevel: 'specialist', certification: 'HAZMAT' })
    }
  })

  const value = {
    resources,
    resourceLog,
    allocationHistory,
    RESOURCE_TYPES,
    RESOURCE_STATUS,
    registerResource,
    allocateResource,
    releaseResource,
    updateResourceStatus,
    getAvailableResources,
    getIncidentResources
  }

  return (
    <ResourceContext.Provider value={value}>
      {props.children}
    </ResourceContext.Provider>
  )
}

export function useResourceTracking() {
  return useContext(ResourceContext)
}

export default ResourceProvider