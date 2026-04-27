/**
 * TPT Emergency System - Search & Rescue Pattern Generator
 * @module src/modules/SearchRescuePatterns.jsx
 * Standard search pattern generation for emergency response operations
 */

import { createSignal, createEffect, createContext, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'

const SARContext = createContext()

export function SARProvider(props) {
  const [activePattern, setActivePattern] = createStore(null)
  const [searchAreas, setSearchAreas] = createStore([])
  const [patternHistory, setPatternHistory] = createStore([])

  const SEARCH_PATTERNS = {
    PARALLEL: {
      id: 'parallel',
      label: 'Parallel Track',
      description: 'Standard sweeping pattern for large open areas',
      spacing: 50,
      optimalConditions: 'Flat, open terrain, good visibility',
      minimumPersonnel: 4
    },
    EXPANDING_SQUARE: {
      id: 'expanding_square',
      label: 'Expanding Square',
      description: 'Outward spiral search pattern from datum point',
      spacing: 25,
      optimalConditions: 'Known last position, confined area',
      minimumPersonnel: 2
    },
    SECTOR: {
      id: 'sector',
      label: 'Sector Search',
      description: 'Radial search patterns from central point',
      segments: 8,
      optimalConditions: 'Waterborne search, circular search area',
      minimumPersonnel: 3
    },
    TRACK_LINE: {
      id: 'track_line',
      label: 'Track Line Search',
      description: 'Search along known path or route',
      offset: 30,
      optimalConditions: 'Missing person last seen on trail/road',
      minimumPersonnel: 2
    },
    GRID: {
      id: 'grid',
      label: 'Grid Search',
      description: 'Systematic block-by-block search',
      blockSize: 100,
      optimalConditions: 'Urban environments, building search',
      minimumPersonnel: 6
    },
    SHORELINE: {
      id: 'shoreline',
      label: 'Shoreline Search',
      description: 'Parallel search along water edge',
      offset: 15,
      optimalConditions: 'Coastal, river bank, lakeside operations',
      minimumPersonnel: 2
    }
  }

  /**
   * Generate search pattern coordinates
   */
  const generatePattern = (patternType, centerPoint, radius, options = {}) => {
    const pattern = SEARCH_PATTERNS[patternType]
    if (!pattern) return null

    let coordinates = []

    switch (patternType) {
      case 'EXPANDING_SQUARE':
        coordinates = generateExpandingSquare(centerPoint, radius, pattern.spacing)
        break
      case 'PARALLEL':
        coordinates = generateParallelTrack(centerPoint, radius, pattern.spacing, options.angle || 0)
        break
      case 'SECTOR':
        coordinates = generateSectorSearch(centerPoint, radius, pattern.segments)
        break
      case 'GRID':
        coordinates = generateGridSearch(centerPoint, radius, pattern.blockSize)
        break
      default:
        coordinates = generateExpandingSquare(centerPoint, radius, 25)
    }

    const searchPattern = {
      id: Date.now(),
      type: patternType,
      pattern,
      centerPoint,
      radius,
      coordinates,
      createdAt: new Date().toISOString(),
      waypoints: coordinates,
      estimatedTime: Math.round((coordinates.length * 2) / 60),
      totalDistance: (coordinates.length * pattern.spacing) / 1000,
      personnelRequired: pattern.minimumPersonnel
    }

    setActivePattern(searchPattern)
    addPatternToHistory(searchPattern)

    return searchPattern
  }

  /**
   * Generate expanding square search pattern
   */
  const generateExpandingSquare = (center, radius, spacing) => {
    const points = []
    const steps = Math.ceil(radius / spacing)
    
    points.push(center)
    
    let x = center.lng
    let y = center.lat
    let stepSize = spacing / 111000 // Convert meters to degrees approx
    
    for (let i = 1; i <= steps; i++) {
      const direction = i % 4
      const distance = stepSize * Math.ceil(i / 2)
      
      switch (direction) {
        case 1: x += distance; break
        case 2: y += distance; break
        case 3: x -= distance * 2; break
        case 0: y -= distance * 2; break
      }
      
      points.push({ lng: x, lat: y })
    }

    return points
  }

  /**
   * Generate parallel track search pattern
   */
  const generateParallelTrack = (center, radius, spacing, angle) => {
    const points = []
    const tracks = Math.ceil((radius * 2) / spacing)
    const trackLength = radius * 2
    const angleRad = angle * Math.PI / 180

    for (let i = 0; i < tracks; i++) {
      const offset = (i - tracks / 2) * spacing / 111000
      const trackStart = {
        lng: center.lng + offset * Math.sin(angleRad) - trackLength/2/111000 * Math.cos(angleRad),
        lat: center.lat + offset * Math.cos(angleRad) + trackLength/2/111000 * Math.sin(angleRad)
      }
      const trackEnd = {
        lng: center.lng + offset * Math.sin(angleRad) + trackLength/2/111000 * Math.cos(angleRad),
        lat: center.lat + offset * Math.cos(angleRad) - trackLength/2/111000 * Math.sin(angleRad)
      }
      
      points.push(trackStart, trackEnd)
    }

    return points
  }

  /**
   * Generate sector (radial) search pattern
   */
  const generateSectorSearch = (center, radius, segments) => {
    const points = []
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      points.push({
        lng: center.lng + (radius / 111000) * Math.cos(angle),
        lat: center.lat + (radius / 111000) * Math.sin(angle)
      })
    }

    return points
  }

  /**
   * Generate grid search pattern
   */
  const generateGridSearch = (center, radius, blockSize) => {
    const points = []
    const blocks = Math.ceil((radius * 2) / blockSize)
    const blockDeg = blockSize / 111000

    for (let x = -blocks/2; x <= blocks/2; x++) {
      for (let y = -blocks/2; y <= blocks/2; y++) {
        points.push({
          lng: center.lng + x * blockDeg,
          lat: center.lat + y * blockDeg,
          blockX: x,
          blockY: y,
          searched: false
        })
      }
    }

    return points
  }

  /**
   * Add pattern to operation history
   */
  const addPatternToHistory = (pattern) => {
    setPatternHistory(patternHistory.length, {
      id: pattern.id,
      type: pattern.type,
      centerPoint: pattern.centerPoint,
      createdAt: pattern.createdAt
    })
  }

  /**
   * Clear active search pattern
   */
  const clearPattern = () => {
    setActivePattern(null)
  }

  /**
   * Mark search grid block as completed
   */
  const markBlockSearched = (blockIndex) => {
    if (!activePattern || !activePattern.coordinates) return
    
    activePattern.coordinates[blockIndex].searched = true
    activePattern.coordinates[blockIndex].searchedAt = new Date().toISOString()
  }

  const value = {
    activePattern,
    searchAreas,
    patternHistory,
    SEARCH_PATTERNS,
    generatePattern,
    generateExpandingSquare,
    generateParallelTrack,
    generateSectorSearch,
    generateGridSearch,
    clearPattern,
    markBlockSearched
  }

  return (
    <SARContext.Provider value={value}>
      {props.children}
    </SARContext.Provider>
  )
}

export function useSearchRescue() {
  return useContext(SARContext)
}

export default SARProvider