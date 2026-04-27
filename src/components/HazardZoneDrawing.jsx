/**
 * TPT Emergency System - Hazard Zone Drawing Component
 * @module src/components/HazardZoneDrawing.jsx
 * Interactive hazard zone drawing and management for map interface
 */

import { createSignal, createEffect, onCleanup } from 'solid-js'
import { useDispatch } from '../modules/CommonDispatchLayer'

export function HazardZoneDrawing({ map }) {
  const dispatch = useDispatch()
  
  const [drawingMode, setDrawingMode] = createSignal(false)
  const [currentZone, setCurrentZone] = createSignal([])
  const [hazardZones, setHazardZones] = createSignal([])
  const [activeZoneType, setActiveZoneType] = createSignal('exclusion')

  const HAZARD_ZONE_TYPES = {
    exclusion: {
      label: 'Exclusion Zone',
      color: '#dc2626',
      opacity: 0.4,
      description: 'No entry - extreme danger'
    },
    restricted: {
      label: 'Restricted Zone',
      color: '#ea580c',
      opacity: 0.35,
      description: 'Authorized personnel only'
    },
    hazard: {
      label: 'Hazard Area',
      color: '#ca8a04',
      opacity: 0.3,
      description: 'Exercise caution'
    },
    evacuation: {
      label: 'Evacuation Zone',
      color: '#65a30d',
      opacity: 0.3,
      description: 'Immediate evacuation required'
    },
    safe: {
      label: 'Safe Zone',
      color: '#059669',
      opacity: 0.25,
      description: 'Safe assembly area'
    }
  }

  const startDrawing = (type = 'exclusion') => {
    setActiveZoneType(type)
    setDrawingMode(true)
    setCurrentZone([])
    map.getCanvas().style.cursor = 'crosshair'
  }

  const cancelDrawing = () => {
    setDrawingMode(false)
    setCurrentZone([])
    map.getCanvas().style.cursor = ''
  }

  const finishDrawing = () => {
    if (currentZone().length < 3) {
      cancelDrawing()
      return
    }

    const newZone = {
      id: Date.now(),
      type: activeZoneType(),
      coordinates: [...currentZone()],
      createdAt: new Date().toISOString(),
      active: true,
      properties: HAZARD_ZONE_TYPES[activeZoneType()]
    }

    setHazardZones(zones => [...zones, newZone])
    renderZoneOnMap(newZone)
    
    cancelDrawing()
    
    dispatch.addDispatchLog('HAZARD_ZONE_CREATED', `Created ${HAZARD_ZONE_TYPES[activeZoneType()].label}`, {
      zoneId: newZone.id,
      coordinates: currentZone().length
    })
  }

  const renderZoneOnMap = (zone) => {
    if (!map) return

    const layerId = `hazard-zone-${zone.id}`
    const sourceId = `hazard-source-${zone.id}`

    if (map.getSource(sourceId)) {
      map.removeLayer(layerId)
      map.removeSource(sourceId)
    }

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [zone.coordinates.map(c => [c.lng, c.lat])]
        },
        properties: {
          type: zone.type,
          name: zone.properties.label
        }
      }
    })

    map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': zone.properties.color,
        'fill-opacity': zone.properties.opacity,
        'fill-outline-color': zone.properties.color
      }
    })

    map.addLayer({
      id: `${layerId}-border`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': zone.properties.color,
        'line-width': 3,
        'line-opacity': 0.8
      }
    })
  }

  const removeZone = (zoneId) => {
    const layerId = `hazard-zone-${zoneId}`
    const sourceId = `hazard-source-${zoneId}`
    
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId)
      map.removeLayer(`${layerId}-border`)
      map.removeSource(sourceId)
    }

    setHazardZones(zones => zones.filter(z => z.id !== zoneId))
    
    dispatch.addDispatchLog('HAZARD_ZONE_REMOVED', 'Hazard zone removed', { zoneId })
  }

  const handleMapClick = (e) => {
    if (!drawingMode()) return
    
    const coord = {
      lng: e.lngLat.lng,
      lat: e.lngLat.lat
    }

    setCurrentZone(zone => [...zone, coord])
  }

  createEffect(() => {
    if (!map()) return
    
    const mapInstance = map()
    
    mapInstance.on('click', handleMapClick)
    
    onCleanup(() => {
      mapInstance.off('click', handleMapClick)
    })
  })

  const toggleZoneVisibility = (zoneId) => {
    const zone = hazardZones().find(z => z.id === zoneId)
    if (!zone) return

    const layerId = `hazard-zone-${zoneId}`
    const visibility = map.getLayoutProperty(layerId, 'visibility')
    
    map.setLayoutProperty(layerId, 'visibility', visibility === 'visible' ? 'none' : 'visible')
  }

  return {
    drawingMode,
    hazardZones,
    currentZone,
    activeZoneType,
    HAZARD_ZONE_TYPES,
    startDrawing,
    cancelDrawing,
    finishDrawing,
    removeZone,
    toggleZoneVisibility
  }
}

export default HazardZoneDrawing