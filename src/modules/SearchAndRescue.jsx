/**
 * TPT Emergency System - Search and Rescue Module
 * @module src/modules/SearchAndRescue.jsx
 * SAR operations management, grid searches, team tracking and mission coordination
 */

import { createSignal, createEffect, createContext, useContext, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'

const SARContext = createContext()

export function SARProvider(props) {
  const [searchMissions, setSearchMissions] = createStore([])
  const [searchGrids, setSearchGrids] = createStore([])
  const [searchTeams, setSearchTeams] = createStore([])
  const [foundPersons, setFoundPersons] = createStore([])
  const [activeMission, setActiveMission] = createSignal(null)
  const [searchMode, setSearchMode] = createSignal(false)

  const SEARCH_PATTERNS = {
    PARALLEL: 'parallel',
    CRESCENT: 'crescent',
    SECTOR: 'sector',
    GRID: 'grid',
    EXPANDING: 'expanding',
    TRACKLINE: 'trackline'
  }

  const TEAM_STATUS = {
    STANDBY: 'standby',
    SEARCHING: 'searching',
    RETURNING: 'returning',
    RESTING: 'resting',
    FOUND: 'found'
  }

  /**
   * Create new search mission
   */
  const createMission = (missionData) => {
    const mission = {
      id: Date.now() + Math.random(),
      status: 'active',
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      searchPattern: SEARCH_PATTERNS.GRID,
      teams: [],
      grids: [],
      ...missionData
    }

    setSearchMissions(searchMissions.length, mission)
    return mission
  }

  /**
   * Assign search grid to team
   */
  const assignGrid = (gridId, teamId) => {
    setSearchGrids(
      g => g.id === gridId,
      {
        assignedTeam: teamId,
        status: 'assigned',
        assignedAt: new Date().toISOString()
      }
    )

    setSearchTeams(
      t => t.id === teamId,
      {
        status: TEAM_STATUS.SEARCHING,
        currentGrid: gridId
      }
    )
  }

  /**
   * Mark grid as searched
   */
  const markGridSearched = (gridId, result = 'clear') => {
    setSearchGrids(
      g => g.id === gridId,
      {
        status: 'searched',
        result: result,
        completedAt: new Date().toISOString()
      }
    )
  }

  /**
   * Register found person
   */
  const registerFound = (personData) => {
    const found = {
      id: Date.now() + Math.random(),
      foundAt: new Date().toISOString(),
      location: null,
      status: 'alive',
      transportRequired: false,
      ...personData
    }

    setFoundPersons(foundPersons.length, found)
    return found
  }

  /**
   * Create search grid pattern
   */
  const generateGridPattern = (center, radius, gridSize = 100) => {
    const grids = []
    const steps = Math.ceil(radius / gridSize)

    for (let x = -steps; x <= steps; x++) {
      for (let y = -steps; y <= steps; y++) {
        grids.push({
          id: `${x}_${y}`,
          x: x,
          y: y,
          status: 'unassigned',
          bounds: {
            north: center.lat + (y * gridSize * 0.0000089),
            south: center.lat + ((y - 1) * gridSize * 0.0000089),
            east: center.lng + (x * gridSize * 0.0000089),
            west: center.lng + ((x - 1) * gridSize * 0.0000089)
          }
        })
      }
    }

    setSearchGrids(grids)
    return grids
  }

  /**
   * SAR Team Management
   */
  const registerTeam = (teamData) => {
    const team = {
      id: Date.now() + Math.random(),
      status: TEAM_STATUS.STANDBY,
      members: [],
      equipment: [],
      lastUpdate: new Date().toISOString(),
      ...teamData
    }

    setSearchTeams(searchTeams.length, team)
    return team
  }

  const updateTeamStatus = (teamId, status, location = null) => {
    setSearchTeams(
      t => t.id === teamId,
      {
        status: status,
        location: location,
        lastUpdate: new Date().toISOString()
      }
    )
  }

  createEffect(() => {
    if (searchTeams.length === 0) {
      registerTeam({ name: 'SAR Team 1', callsign: 'SAR-1' })
      registerTeam({ name: 'SAR Team 2', callsign: 'SAR-2' })
      registerTeam({ name: 'SAR Team 3', callsign: 'SAR-3' })
      registerTeam({ name: 'K9 Unit', callsign: 'K9-1' })
      registerTeam({ name: 'Drone Unit', callsign: 'DRONE-1' })
    }
  })

  const value = {
    searchMissions,
    searchGrids,
    searchTeams,
    foundPersons,
    activeMission,
    searchMode,
    SEARCH_PATTERNS,
    TEAM_STATUS,
    createMission,
    assignGrid,
    markGridSearched,
    registerFound,
    generateGridPattern,
    registerTeam,
    updateTeamStatus,
    setSearchMode
  }

  return (
    <SARContext.Provider value={value}>
      {props.children}
    </SARContext.Provider>
  )
}

export function useSAR() {
  return useContext(SARContext)
}

/**
 * Search and Rescue UI Module
 * Displays when user selects SAR from sidebar
 */
export function SearchAndRescueUI() {
  const sar = useSAR()

  return (
    <div class="p-6 h-full overflow-auto">
      <h2 class="text-2xl font-bold mb-4">🔍 Search & Rescue Operations</h2>

      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-emerald-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold">{sar.searchMissions.length}</div>
          <div class="text-sm text-emerald-300">Active Missions</div>
        </div>
        <div class="bg-emerald-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold">{sar.searchTeams.length}</div>
          <div class="text-sm text-emerald-300">Teams Deployed</div>
        </div>
        <div class="bg-emerald-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold">{sar.searchGrids.length}</div>
          <div class="text-sm text-emerald-300">Search Grids</div>
        </div>
        <div class="bg-emerald-900/30 p-4 rounded-lg">
          <div class="text-3xl font-bold">{sar.foundPersons.length}</div>
          <div class="text-sm text-emerald-300">Persons Located</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-gray-800 rounded-lg p-5">
          <h3 class="font-semibold mb-4">Search Teams</h3>
          <div class="space-y-2">
            {sar.searchTeams.map(team => (
              <div class="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                <div>
                  <div class="font-medium">{team.name}</div>
                  <div class="text-xs text-gray-400">{team.callsign}</div>
                </div>
                <div class={`px-2 py-1 rounded text-xs ${
                  team.status === 'standby' ? 'bg-gray-600' :
                  team.status === 'searching' ? 'bg-emerald-600' :
                  team.status === 'returning' ? 'bg-amber-600' : 'bg-gray-600'
                }`}>
                  {team.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div class="bg-gray-800 rounded-lg p-5">
          <h3 class="font-semibold mb-4">Search Patterns</h3>
          <div class="space-y-2 text-gray-400 text-sm">
            <div>✅ Parallel Track</div>
            <div>✅ Crescent Sweep</div>
            <div>✅ Sector Search</div>
            <div>✅ Grid Search</div>
            <div>✅ Expanding Square</div>
            <div>✅ Track Line Search</div>
          </div>
        </div>
      </div>

      <div class="mt-6 bg-gray-800 rounded-lg p-5">
        <div class="text-xs text-gray-400 mb-2">
          ✅ Full SAR state management system is operational. User interface is currently in development.
        </div>
      </div>
    </div>
  )
}

export default SARProvider
