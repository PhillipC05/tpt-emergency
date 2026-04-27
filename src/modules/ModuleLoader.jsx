import { createMemo } from 'solid-js'
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

export function ModuleLoader(props) {
  const moduleId = createMemo(() => props.moduleId)

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
    geofence: GeofenceAlerting
  }

  const ModuleComponent = moduleComponents[moduleId()]
  
  if (!ModuleComponent) {
    return (
      <div class="p-6 text-center text-gray-500">
        Module {moduleId()} not implemented yet
      </div>
    )
  }

  return <ModuleComponent />
}