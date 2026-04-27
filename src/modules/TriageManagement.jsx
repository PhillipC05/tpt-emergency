/**
 * TPT Emergency System - Triage Management System
 * @module src/modules/TriageManagement.jsx
 * Medical incident triage and patient classification system
 */

import { createSignal, createEffect, createContext, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { useDispatch } from './CommonDispatchLayer'

const TriageContext = createContext()

export function TriageProvider(props) {
  const dispatch = useDispatch()
  
  const [patients, setPatients] = createStore([])
  const [triageLog, setTriageLog] = createStore([])
  const [triageStats, setTriageStats] = createStore({})

  // Standard triage classifications (START method)
  const TRIAGE_CODES = {
    IMMEDIATE: { 
      code: 'RED', 
      priority: 1, 
      label: 'Immediate', 
      description: 'Life-threatening injuries requiring immediate attention',
      color: '#dc2626',
      targetTime: '< 10 minutes'
    },
    DELAYED: { 
      code: 'YELLOW', 
      priority: 2, 
      label: 'Delayed', 
      description: 'Serious but not immediately life-threatening',
      color: '#ca8a04',
      targetTime: '1 - 2 hours'
    },
    MINOR: { 
      code: 'GREEN', 
      priority: 3, 
      label: 'Minor', 
      description: 'Walking wounded / minor injuries',
      color: '#16a34a',
      targetTime: '2 - 4 hours'
    },
    EXPECTANT: { 
      code: 'BLACK', 
      priority: 4, 
      label: 'Expectant', 
      description: 'Severe injuries with low probability of survival',
      color: '#1f2937',
      targetTime: 'Comfort care'
    },
    DECEASED: { 
      code: 'WHITE', 
      priority: 5, 
      label: 'Deceased', 
      description: 'No signs of life / dead on arrival',
      color: '#f3f4f6',
      targetTime: 'N/A'
    }
  }

  // Vital sign thresholds for automated triage
  const TRIAGE_THRESHOLDS = {
    RESPIRATORY_RATE: { min: 10, max: 30 },
    PULSE: { min: 50, max: 120 },
    CAP_REFILL: 2,
    GCS_MIN: 14
  }

  /**
   * Register a new patient for triage
   */
  const registerPatient = (patientData) => {
    const newPatient = {
      id: Date.now() + Math.random(),
      incidentId: null,
      triageCode: null,
      triageAssessedAt: null,
      assessedBy: null,
      vitalSigns: {},
      injuries: [],
      medications: [],
      allergies: [],
      status: 'waiting',
      location: null,
      assignedUnit: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...patientData
    }

    setPatients(patients.length, newPatient)
    addTriageLog('PATIENT_REGISTERED', `Patient registered: ${newPatient.id}`, { patientId: newPatient.id })
    
    return newPatient
  }

  /**
   * Perform triage assessment on patient
   */
  const performTriage = (patientId, assessmentData, assessor = null) => {
    const patient = patients.find(p => p.id === patientId)
    if (!patient) return null

    const autoCode = calculateAutoTriageCode(assessmentData.vitalSigns)
    
    const finalCode = assessmentData.overrideCode || autoCode

    setPatients(
      p => p.id === patientId,
      {
        triageCode: finalCode,
        triageAssessedAt: new Date().toISOString(),
        assessedBy: assessor,
        vitalSigns: assessmentData.vitalSigns,
        injuries: assessmentData.injuries || [],
        notes: assessmentData.notes,
        status: 'triaged',
        updatedAt: new Date().toISOString()
      }
    )

    addTriageLog('TRIAGE_COMPLETED', `Patient triaged as ${finalCode.label}`, {
      patientId,
      triageCode: finalCode.code,
      autoAssessed: !assessmentData.overrideCode
    })

    updateTriageStatistics()
    return finalCode
  }

  /**
   * Calculate automatic triage code based on vital signs
   * Implements START Triage Protocol
   */
  const calculateAutoTriageCode = (vitals = {}) => {
    if (!vitals.respiratoryRate || !vitals.pulse || !vitals.gcs) {
      return TRIAGE_CODES.IMMEDIATE
    }

    if (vitals.respiratoryRate === 0 || vitals.gcs < 8) {
      return TRIAGE_CODES.EXPECTANT
    }

    if (vitals.respiratoryRate < TRIAGE_THRESHOLDS.RESPIRATORY_RATE.min || 
        vitals.respiratoryRate > TRIAGE_THRESHOLDS.RESPIRATORY_RATE.max ||
        vitals.pulse < TRIAGE_THRESHOLDS.PULSE.min ||
        vitals.pulse > TRIAGE_THRESHOLDS.PULSE.max ||
        vitals.gcs < TRIAGE_THRESHOLDS.GCS_MIN) {
      return TRIAGE_CODES.IMMEDIATE
    }

    if (vitals.capRefill > TRIAGE_THRESHOLDS.CAP_REFILL) {
      return TRIAGE_CODES.IMMEDIATE
    }

    return TRIAGE_CODES.DELAYED
  }

  /**
   * Update patient status
   */
  const updatePatientStatus = (patientId, status, additionalData = {}) => {
    setPatients(
      p => p.id === patientId,
      {
        status,
        updatedAt: new Date().toISOString(),
        ...additionalData
      }
    )

    addTriageLog('PATIENT_UPDATED', `Patient status updated: ${status}`, { patientId })
  }

  /**
   * Assign patient to transport unit
   */
  const assignPatientToUnit = (patientId, unitId) => {
    setPatients(
      p => p.id === patientId,
      {
        assignedUnit: unitId,
        status: 'assigned',
        updatedAt: new Date().toISOString()
      }
    )

    addTriageLog('PATIENT_ASSIGNED', `Patient assigned to unit ${unitId}`, { patientId, unitId })
  }

  /**
   * Get patients by triage code
   */
  const getPatientsByTriage = (code) => {
    return patients.filter(p => p.triageCode?.code === code)
  }

  /**
   * Get patients for specific incident
   */
  const getIncidentPatients = (incidentId) => {
    return patients.filter(p => p.incidentId === incidentId)
  }

  /**
   * Add entry to triage log
   */
  const addTriageLog = (type, message, metadata = {}) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type,
      message,
      metadata
    }

    setTriageLog(triageLog.length, logEntry)
  }

  /**
   * Update triage statistics counters
   */
  const updateTriageStatistics = () => {
    const stats = {
      total: patients.length,
      triaged: patients.filter(p => p.triageCode !== null).length,
      RED: getPatientsByTriage('RED').length,
      YELLOW: getPatientsByTriage('YELLOW').length,
      GREEN: getPatientsByTriage('GREEN').length,
      BLACK: getPatientsByTriage('BLACK').length,
      WHITE: getPatientsByTriage('WHITE').length
    }
    setTriageStats(stats)
  }

  createEffect(() => {
    updateTriageStatistics()
  })

  const value = {
    patients,
    triageLog,
    triageStats,
    TRIAGE_CODES,
    TRIAGE_THRESHOLDS,
    registerPatient,
    performTriage,
    calculateAutoTriageCode,
    updatePatientStatus,
    assignPatientToUnit,
    getPatientsByTriage,
    getIncidentPatients
  }

  return (
    <TriageContext.Provider value={value}>
      {props.children}
    </TriageContext.Provider>
  )
}

export function useTriage() {
  return useContext(TriageContext)
}

export default TriageProvider