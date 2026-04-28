/**
 * TPT Emergency System - Incident Reporting & Compliance Module
 * @module src/modules/IncidentReporting.jsx
 * Mandatory reporting, paperwork, compliance forms and audit logging
 */

import { createSignal, createEffect, createContext, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'

const ReportingContext = createContext()

export function ReportingProvider(props) {
  const [incidentReports, setIncidentReports] = createStore([])
  const [formTemplates, setFormTemplates] = createStore([])
  const [reportLog, setReportLog] = createStore([])
  const [activeReport, setActiveReport] = createSignal(null)

  const REPORT_TYPES = {
    INCIDENT: 'incident_report',
    PATIENT_CARE: 'patient_care',
    VEHICLE_CHECK: 'vehicle_check',
    EQUIPMENT_CHECK: 'equipment_check',
    HAZARD_ASSESSMENT: 'hazard_assessment',
    HANDOVER: 'operational_handover',
    DEBRIEF: 'post_incident_debrief',
    DRUG_ADMIN: 'drug_administration'
  }

  const COMPLIANCE_STATUS = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    REVIEWED: 'reviewed',
    COMPLETE: 'complete',
    OVERDUE: 'overdue'
  }

  /**
   * Create new incident report
   */
  const createReport = (type, incidentId) => {
    const report = {
      id: Date.now() + Math.random(),
      type: type,
      incidentId: incidentId,
      status: COMPLIANCE_STATUS.DRAFT,
      createdAt: new Date().toISOString(),
      createdBy: null,
      submittedAt: null,
      data: {},
      signatures: [],
      ...getTemplateForType(type)
    }

    setIncidentReports(incidentReports.length, report)
    return report
  }

  /**
   * Update report data
   */
  const updateReport = (reportId, data) => {
    setIncidentReports(
      r => r.id === reportId,
      {
        data: { ...data },
        updatedAt: new Date().toISOString()
      }
    )
  }

  /**
   * Submit completed report
   */
  const submitReport = (reportId, userId) => {
    setIncidentReports(
      r => r.id === reportId,
      {
        status: COMPLIANCE_STATUS.SUBMITTED,
        submittedAt: new Date().toISOString(),
        submittedBy: userId
      }
    )

    addReportLog(reportId, 'REPORT_SUBMITTED', 'Report submitted for review')
  }

  /**
   * Sign report
   */
  const signReport = (reportId, userId, name, role) => {
    setIncidentReports(
      r => r.id === reportId,
      {
        signatures: r => [...r, {
          userId,
          name,
          role,
          signedAt: new Date().toISOString()
        }]
      }
    )
  }

  /**
   * Report Templates
   */
  const getTemplateForType = (type) => {
    const templates = {
      [REPORT_TYPES.INCIDENT]: {
        fields: [
          { id: 'location', label: 'Incident Location', required: true },
          { id: 'time_reported', label: 'Time Reported', type: 'datetime', required: true },
          { id: 'type', label: 'Incident Type', required: true },
          { id: 'persons_involved', label: 'Persons Involved', type: 'number' },
          { id: 'injuries', label: 'Injuries Sustained' },
          { id: 'actions_taken', label: 'Actions Taken', type: 'textarea' },
          { id: 'resources_used', label: 'Resources Used' },
          { id: 'outcome', label: 'Incident Outcome' },
          { id: 'followup_required', label: 'Followup Required', type: 'boolean' }
        ]
      },
      [REPORT_TYPES.PATIENT_CARE]: {
        fields: [
          { id: 'patient_name', label: 'Patient Name' },
          { id: 'age', label: 'Age' },
          { id: 'presentation', label: 'Presentation', required: true },
          { id: 'observations', label: 'Observations', type: 'textarea' },
          { id: 'treatment', label: 'Treatment Provided', type: 'textarea' },
          { id: 'transport_destination', label: 'Transport Destination' },
          { id: 'handover_time', label: 'Handover Time', type: 'datetime' }
        ]
      },
      [REPORT_TYPES.VEHICLE_CHECK]: {
        fields: [
          { id: 'vehicle_id', label: 'Vehicle ID', required: true },
          { id: 'odometer', label: 'Odometer Reading', type: 'number' },
          { id: 'fuel_level', label: 'Fuel Level %', type: 'number' },
          { id: 'lights', label: 'Lights', type: 'boolean' },
          { id: 'brakes', label: 'Brakes', type: 'boolean' },
          { id: 'tires', label: 'Tyres', type: 'boolean' },
          { id: 'equipment_complete', label: 'Equipment Complete', type: 'boolean' },
          { id: 'defects', label: 'Defects Noted' }
        ]
      },
      [REPORT_TYPES.HAZARD_ASSESSMENT]: {
        fields: [
          { id: 'location', label: 'Hazard Location', required: true },
          { id: 'hazard_type', label: 'Hazard Type', required: true },
          { id: 'risk_level', label: 'Risk Level', options: ['Low', 'Medium', 'High', 'Extreme'] },
          { id: 'control_measures', label: 'Control Measures', type: 'textarea' },
          { id: 'mitigation_time', label: 'Estimated Mitigation Time' }
        ]
      },
      [REPORT_TYPES.EQUIPMENT_CHECK]: {
        fields: [
          { id: 'equipment_id', label: 'Equipment ID', required: true },
          { id: 'equipment_type', label: 'Equipment Type', required: true },
          { id: 'checked_by', label: 'Checked By', required: true },
          { id: 'check_date', label: 'Check Date', type: 'datetime', required: true },
          { id: 'condition', label: 'Condition', options: ['Serviceable', 'Requires Attention', 'Unserviceable'] },
          { id: 'battery_level', label: 'Battery Level %', type: 'number' },
          { id: 'calibration_due', label: 'Calibration Due Date', type: 'datetime' },
          { id: 'faults', label: 'Faults Noted', type: 'textarea' },
          { id: 'action_taken', label: 'Action Taken' }
        ]
      },
      [REPORT_TYPES.HANDOVER]: {
        fields: [
          { id: 'handover_from', label: 'Handover From', required: true },
          { id: 'handover_to', label: 'Handover To', required: true },
          { id: 'handover_time', label: 'Handover Time', type: 'datetime', required: true },
          { id: 'active_incidents', label: 'Active Incidents', type: 'textarea', required: true },
          { id: 'units_on_duty', label: 'Units On Duty' },
          { id: 'outstanding_tasks', label: 'Outstanding Tasks', type: 'textarea' },
          { id: 'resources_status', label: 'Resources Status', type: 'textarea' },
          { id: 'communications_check', label: 'Communications Check', type: 'boolean' },
          { id: 'notes', label: 'Additional Notes', type: 'textarea' }
        ]
      },
      [REPORT_TYPES.DEBRIEF]: {
        fields: [
          { id: 'incident_id', label: 'Incident Reference', required: true },
          { id: 'debrief_date', label: 'Debrief Date', type: 'datetime', required: true },
          { id: 'facilitator', label: 'Facilitator', required: true },
          { id: 'attendees', label: 'Attendees', type: 'textarea' },
          { id: 'what_went_well', label: 'What Went Well', type: 'textarea' },
          { id: 'what_could_improve', label: 'Areas for Improvement', type: 'textarea' },
          { id: 'lessons_learned', label: 'Lessons Learned', type: 'textarea' },
          { id: 'action_items', label: 'Action Items / Follow-up', type: 'textarea' },
          { id: 'training_identified', label: 'Training Needs Identified', type: 'textarea' }
        ]
      },
      [REPORT_TYPES.DRUG_ADMIN]: {
        fields: [
          { id: 'patient_id', label: 'Patient ID', required: true },
          { id: 'administered_by', label: 'Administered By', required: true },
          { id: 'drug_name', label: 'Drug Name', required: true },
          { id: 'dose', label: 'Dose', required: true },
          { id: 'route', label: 'Route', options: ['IV', 'IM', 'SC', 'Oral', 'Sublingual', 'Intranasal', 'Inhalation'] },
          { id: 'time_administered', label: 'Time Administered', type: 'datetime', required: true },
          { id: 'indication', label: 'Indication', required: true },
          { id: 'patient_response', label: 'Patient Response', type: 'textarea' },
          { id: 'adverse_effects', label: 'Adverse Effects' },
          { id: 'batch_number', label: 'Batch Number' },
          { id: 'expiry', label: 'Expiry Date' },
          { id: 'witness', label: 'Witness / Second Signatory', required: true }
        ]
      }
    }

    return templates[type] || { fields: [] }
  }

  /**
   * Add audit log entry
   */
  const addReportLog = (reportId, type, message) => {
    setReportLog(reportLog.length, {
      id: Date.now() + Math.random(),
      reportId,
      type,
      message,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Get reports for incident
   */
  const getReportsForIncident = (incidentId) => {
    return incidentReports.filter(r => r.incidentId === incidentId)
  }

  /**
   * Generate compliance summary
   */
  const getComplianceSummary = () => {
    return {
      total: incidentReports.length,
      draft: incidentReports.filter(r => r.status === COMPLIANCE_STATUS.DRAFT).length,
      submitted: incidentReports.filter(r => r.status === COMPLIANCE_STATUS.SUBMITTED).length,
      complete: incidentReports.filter(r => r.status === COMPLIANCE_STATUS.COMPLETE).length,
      overdue: incidentReports.filter(r => {
        const age = Date.now() - new Date(r.createdAt).getTime()
        return age > 86400000 && r.status !== COMPLIANCE_STATUS.COMPLETE
      }).length
    }
  }

  createEffect(() => {
    if (formTemplates.length === 0) {
      Object.values(REPORT_TYPES).forEach(type => {
        setFormTemplates(formTemplates.length, {
          id: type,
          name: type.replace(/_/g, ' ').replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
          template: getTemplateForType(type)
        })
      })
    }
  })

  const value = {
    incidentReports,
    formTemplates,
    reportLog,
    activeReport,
    REPORT_TYPES,
    COMPLIANCE_STATUS,
    createReport,
    updateReport,
    submitReport,
    signReport,
    getReportsForIncident,
    getComplianceSummary,
    getTemplateForType
  }

  return (
    <ReportingContext.Provider value={value}>
      {props.children}
    </ReportingContext.Provider>
  )
}

export function useReporting() {
  return useContext(ReportingContext)
}

/**
 * Incident Reporting UI Module
 */
export function IncidentReportingUI() {
  const reporting = useReporting()
  const summary = reporting.getComplianceSummary()

  return (
    <div class="p-6 h-full overflow-auto">
      <h2 class="text-2xl font-bold mb-4">📋 Incident Reporting & Compliance</h2>

      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-gray-800 p-4 rounded-lg">
          <div class="text-3xl font-bold">{summary.total}</div>
          <div class="text-sm text-gray-400">Total Reports</div>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg">
          <div class="text-3xl font-bold">{summary.draft}</div>
          <div class="text-sm text-gray-400">Draft</div>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg">
          <div class="text-3xl font-bold">{summary.submitted}</div>
          <div class="text-sm text-gray-400">Submitted</div>
        </div>
        <div class="bg-red-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold text-red-400">{summary.overdue}</div>
          <div class="text-sm text-red-300">Overdue</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-gray-800 rounded-lg p-5">
          <h3 class="font-semibold mb-4">Report Templates</h3>
          <div class="space-y-2">
            {reporting.formTemplates.map(template => (
              <div class="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                <div>
                  <div class="font-medium">{template.name}</div>
                  <div class="text-xs text-gray-400">{template.template.fields.length} fields</div>
                </div>
                <button class="px-3 py-1 bg-blue-600 rounded text-sm">
                  New
                </button>
              </div>
            ))}
          </div>
        </div>

        <div class="bg-gray-800 rounded-lg p-5">
          <h3 class="font-semibold mb-4">Report Types</h3>
          <ul class="space-y-2 text-gray-400 text-sm">
            <li>✅ Incident Reports</li>
            <li>✅ Patient Care Reports</li>
            <li>✅ Vehicle Check Sheets</li>
            <li>✅ Equipment Checks</li>
            <li>✅ Hazard Assessments</li>
            <li>✅ Operational Handover</li>
            <li>✅ Post Incident Debrief</li>
            <li>✅ Drug Administration Logs</li>
          </ul>
        </div>
      </div>

      <div class="mt-6 bg-gray-800 rounded-lg p-5">
        <h3 class="font-semibold mb-4">Recent Reports</h3>
        <div class="space-y-2">
          {reporting.incidentReports.length === 0 ? (
            <div class="text-center text-gray-500 py-8">
              No reports created
            </div>
          ) : (
            reporting.incidentReports.map(report => (
              <div class="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                <div>
                  <div class="font-medium">Report #{report.id.toString().slice(0, 8)}</div>
                  <div class="text-xs text-gray-400">{new Date(report.createdAt).toLocaleString()}</div>
                </div>
                <span class={`px-2 py-1 rounded text-xs ${
                  report.status === 'complete' ? 'bg-green-600' :
                  report.status === 'submitted' ? 'bg-blue-600' :
                  report.status === 'overdue' ? 'bg-red-600' : 'bg-gray-600'
                }`}>
                  {report.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}

export default ReportingProvider
