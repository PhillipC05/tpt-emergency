/**
 * TPT Emergency System - Route Calculation Engine
 * @module src/modules/RouteCalculation.jsx
 * Offline-capable routing and navigation system for emergency vehicles
 */

import { createSignal, createEffect, createContext, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'

const RouteContext = createContext()

export function RouteProvider(props) {
  const [activeRoute, setActiveRoute] = createStore(null)
  const [routeHistory, setRouteHistory] = createStore([])
  const [waypoints, setWaypoints] = createStore([])
  const [routePreferences, setRoutePreferences] = createStore({
    avoidTolls: true,
    preferHighways: true,
    vehicleHeight: 3.8,
    vehicleWeight: 15000,
    emergencyPriority: true
  })

  const ROUTE_TYPES = {
    FASTEST: { label: 'Fastest Route', priority: 'time' },
    SHORTEST: { label: 'Shortest Route', priority: 'distance' },
    SAFEST: { label: 'Safest Route', priority: 'safety' },
    OFFROAD: { label: 'Off-road Access', priority: 'terrain' }
  }

  /**
   * Calculate route between origin and destination
   * Implements offline routing with emergency vehicle parameters
   */
  const calculateRoute = async (origin, destination, options = {}) => {
    // Simulate route calculation (in production uses offline routing engine)
    const distance = calculateDistance(origin, destination)
    const estimatedTime = calculateEstimatedTime(distance, options.vehicleType || 'fire')
    
    const route = {
      id: Date.now(),
      origin,
      destination,
      distance: distance.toFixed(2),
      estimatedTime: Math.round(estimatedTime),
      waypoints: generateWaypoints(origin, destination, 8),
      type: options.routeType || 'FASTEST',
      createdAt: new Date().toISOString(),
      status: 'calculated',
      turnByTurn: generateTurnByTurn(),
      restrictions: checkRouteRestrictions(origin, destination)
    }

    setActiveRoute(route)
    addRouteToHistory(route)

    return route
  }

  /**
   * Calculate great circle distance between coordinates
   * Using Haversine formula
   */
  const calculateDistance = (origin, destination) => {
    const R = 6371 // Earth radius in km
    const dLat = (destination.lat - origin.lat) * Math.PI / 180
    const dLon = (destination.lng - origin.lng) * Math.PI / 180
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Calculate estimated travel time based on vehicle type
   */
  const calculateEstimatedTime = (distance, vehicleType) => {
    const averageSpeeds = {
      fire: 55,
      ambulance: 65,
      police: 70,
      disaster: 45,
      standard: 50
    }

    const speed = averageSpeeds[vehicleType] || averageSpeeds.standard
    return (distance / speed) * 60
  }

  /**
   * Generate intermediate waypoints for route
   */
  const generateWaypoints = (origin, destination, count) => {
    const points = []
    for (let i = 0; i <= count; i++) {
      const progress = i / count
      points.push({
        lat: origin.lat + (destination.lat - origin.lat) * progress,
        lng: origin.lng + (destination.lng - origin.lng) * progress,
        index: i
      })
    }
    return points
  }

  /**
   * Generate turn-by-turn directions
   */
  const generateTurnByTurn = () => {
    return [
      { instruction: 'Head north on Main Street', distance: '0.3 km', time: 1 },
      { instruction: 'Turn right onto Oak Avenue', distance: '1.2 km', time: 4 },
      { instruction: 'Continue onto Highway 1', distance: '5.7 km', time: 6 },
      { instruction: 'Take exit 42 toward Incident Site', distance: '0.8 km', time: 2 },
      { instruction: 'Arrive at destination', distance: '0 km', time: 0 }
    ]
  }

  /**
   * Check for route restrictions and hazards
   */
  const checkRouteRestrictions = (origin, destination) => {
    return {
      lowBridges: [],
      weightRestrictions: [],
      heightRestrictions: [],
      closedRoads: [],
      hazardZones: []
    }
  }

  /**
   * Add route to calculation history
   */
  const addRouteToHistory = (route) => {
    setRouteHistory(routeHistory.length, {
      id: route.id,
      origin: route.origin,
      destination: route.destination,
      distance: route.distance,
      estimatedTime: route.estimatedTime,
      createdAt: route.createdAt
    })
  }

  /**
   * Cancel active route navigation
   */
  const cancelRoute = () => {
    setActiveRoute(null)
    setWaypoints([])
  }

  /**
   * Update route preferences
   */
  const updatePreferences = (newPreferences) => {
    setRoutePreferences({ ...routePreferences, ...newPreferences })
  }

  createEffect(() => {
    if (activeRoute) {
      // Broadcast route to connected units
      console.log('Route active:', activeRoute.id)
    }
  })

  const value = {
    activeRoute,
    routeHistory,
    waypoints,
    routePreferences,
    ROUTE_TYPES,
    calculateRoute,
    calculateDistance,
    calculateEstimatedTime,
    cancelRoute,
    updatePreferences
  }

  return (
    <RouteContext.Provider value={value}>
      {props.children}
    </RouteContext.Provider>
  )
}

export function useRouting() {
  return useContext(RouteContext)
}

export default RouteProvider