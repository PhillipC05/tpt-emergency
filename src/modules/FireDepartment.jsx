/**
 * TPT Emergency System - Fire Department Module
 * @module src/modules/FireDepartment.jsx
 */

import { createSignal, createEffect, createMemo } from 'solid-js'
import { useDispatch } from './CommonDispatchLayer'

export function FireDepartmentModule() {
  const dispatch = useDispatch()
  
  const fireUnits = createMemo(() => dispatch.units.filter(u => u.type === 'fire'))
  const activeCalls = createMemo(() => dispatch.incidents.filter(i => i.type === 'fire').length)
  const unitsDeployed = createMemo(() => fireUnits().filter(u => u.status === dispatch.UNIT_STATUS.DISPATCHED || u.status === dispatch.UNIT_STATUS.ON_SCENE).length)
  const unitsAvailable = createMemo(() => fireUnits().filter(u => u.status === dispatch.UNIT_STATUS.AVAILABLE).length)
  const unitsOnScene = createMemo(() => fireUnits().filter(u => u.status === dispatch.UNIT_STATUS.ON_SCENE).length)

  createEffect(() => {
    // Module initialization
    console.log('✅ Fire Department Module loaded with shared dispatch system')
  })

  return (
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">🔥 Fire Department Module</h2>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-orange-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold">{activeCalls()}</div>
          <div class="text-sm text-orange-300">Active Calls</div>
        </div>
        <div class="bg-orange-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold">{unitsDeployed()}</div>
          <div class="text-sm text-orange-300">Units Deployed</div>
        </div>
        <div class="bg-orange-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold">{unitsOnScene()}</div>
          <div class="text-sm text-orange-300">On Scene</div>
        </div>
        <div class="bg-orange-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold">{unitsAvailable()}</div>
          <div class="text-sm text-orange-300">Available Units</div>
        </div>
      </div>

      <div class="bg-gray-800 rounded-lg p-6">
        <h3 class="font-semibold mb-3">Fire Department Capabilities</h3>
        <ul class="space-y-2 text-gray-400">
          <li>✅ Structure Fire Response</li>
          <li>✅ Wildfire Tracking & Mapping</li>
          <li>✅ Hazardous Materials Incidents</li>
          <li>✅ Vehicle Extrication Operations</li>
          <li>✅ Water Supply Management</li>
          <li>✅ Hydrant Location Database</li>
          <li>✅ Pre-Incident Plans</li>
        </ul>
      </div>
    </div>
  )
}

export default FireDepartmentModule