import { Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import FireDepartmentModule from './FireDepartment.jsx'
import AmbulanceServiceModule from './AmbulanceService.jsx'
import PoliceDepartmentModule from './PoliceDepartment.jsx'
import DisasterResponseModule from './DisasterResponse.jsx'
import CallCenterConsole from './CallCenterConsole.jsx'
import { CommunicationsIntegration } from './CommunicationsIntegration.jsx'
import AuditLogViewer from './AuditLogSystem.jsx'
import PersonnelAccountabilityViewer from './PersonnelAccountability.jsx'
import HazMatResponse from './HazMatResponse.jsx'
import MedicalCommand from './MedicalCommand.jsx'
import MutualAidCoordinator from './MutualAidCoordinator.jsx'
import WeatherIntegration from './WeatherIntegration.jsx'
import UnitShiftScheduling from './UnitShiftScheduling.jsx'
import TrafficAwareRouting from './TrafficAwareRouting.jsx'
import RadioChannelManagement from './RadioChannelManagement.jsx'
import PermissionSystem from './PermissionSystem.jsx'
import PatientTransportTracking from './PatientTransportTracking.jsx'
import ResourceMaintenanceLogging from './ResourceMaintenanceLogging.jsx'
import GeofenceAlerting from './GeofenceAlerting.jsx'
import { SearchAndRescueUI } from './SearchAndRescue.jsx'
import { BeaconMonitoringUI } from './BeaconMonitoring.jsx'
import { IncidentReportingUI } from './IncidentReporting.jsx'

const moduleComponents = {
  fire: FireDepartmentModule,
  ambulance: AmbulanceServiceModule,
  police: PoliceDepartmentModule,
  disaster: DisasterResponseModule,
  callcenter: CallCenterConsole,
  communications: CommunicationsIntegration,
  auditlog: AuditLogViewer,
  personnel: PersonnelAccountabilityViewer,
  hazmat: HazMatResponse,
  medical: MedicalCommand,
  mutualaid: MutualAidCoordinator,
  weather: WeatherIntegration,
  shiftscheduling: UnitShiftScheduling,
  trafficrouting: TrafficAwareRouting,
  radiochannels: RadioChannelManagement,
  permissions: PermissionSystem,
  patienttransport: PatientTransportTracking,
  maintenance: ResourceMaintenanceLogging,
  geofence: GeofenceAlerting,
  sar: SearchAndRescueUI,
  beacon: BeaconMonitoringUI,
  incidentreporting: IncidentReportingUI
}

export function ModuleLoader(props) {
  return (
    <Show
      when={moduleComponents[props.moduleId]}
      fallback={
        <div class="p-6 text-center text-gray-500">
          Module {props.moduleId} not implemented yet
        </div>
      }
    >
      <Dynamic component={moduleComponents[props.moduleId]} />
    </Show>
  )
}