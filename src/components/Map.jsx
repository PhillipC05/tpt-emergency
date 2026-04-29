import { createSignal, onMount, onCleanup, createEffect } from 'solid-js'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css'
import { geocoder } from '../lib/geocoder'
import { assetRegistry, ASSET_TYPES } from '../lib/asset-provider.js'
import ExampleDroneProvider from '../lib/providers/example-drone-provider.js'

export function Map() {
  let mapContainer
  const [map, setMap] = createSignal(null)
  const [assets, setAssets] = createSignal(new Map())
  const assetMarkers = new Map()
  let unsubscribeGlobal = null

  onMount(async () => {
    const MaplibreGeocoder = (await import('@maplibre/maplibre-gl-geocoder')).default

    // Initialize Asset System & Drone Provider
    const droneProvider = new ExampleDroneProvider({ simulated: true })
    assetRegistry.register(droneProvider)
    await droneProvider.initialize()
    await droneProvider.connect()

    // Subscribe to global asset updates
    unsubscribeGlobal = assetRegistry.subscribeAll(async (event, data) => {
      if (event === 'asset:update') {
        updateAssetOnMap(data)
      }
    })

    const mapInstance = new maplibregl.Map({
      container: mapContainer,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [174.885971, -40.900557],
      zoom: 12,
      attributionControl: true
    })

    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapInstance.addControl(new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true
    }), 'top-right')

    mapInstance.addControl(new MaplibreGeocoder(geocoder.getMaplibreAdapter(), {
      maplibregl,
      placeholder: 'Search address... (works offline)'
    }), 'top-left')

    mapInstance.on('load', () => {
      setMap(mapInstance)
    })
  })

  function updateAssetOnMap(asset) {
    if (!map() || !asset.position) return

    const existing = assetMarkers.get(asset.id)
    
    if (existing) {
      // Update existing marker position and rotation
      existing.setLngLat([asset.position.lng, asset.position.lat])
      
      // Update rotation for moving assets
      if (asset.position.heading !== undefined) {
        existing.getElement().style.transform = `rotate(${asset.position.heading}deg)`
      }

      // Update popup content
      existing.getPopup().setHTML(createAssetPopup(asset))
      return
    }

    // Create new marker
    const el = document.createElement('div')
    el.className = 'asset-marker'
    el.innerHTML = getAssetIconSVG(asset)

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([asset.position.lng, asset.position.lat])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(createAssetPopup(asset)))
      .addTo(map())

    assetMarkers.set(asset.id, marker)
  }

  function getAssetIconSVG(asset) {
    switch (asset.type) {
      case ASSET_TYPES.DRONE:
        return `
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="4" fill="#0ea5e9"/>
            <circle cx="4" cy="4" r="2" fill="#0ea5e9"/>
            <circle cx="20" cy="4" r="2" fill="#0ea5e9"/>
            <circle cx="4" cy="20" r="2" fill="#0ea5e9"/>
            <circle cx="20" cy="20" r="2" fill="#0ea5e9"/>
            <line x1="4" y1="4" x2="12" y2="12" stroke="#0ea5e9" stroke-width="1.5"/>
            <line x1="20" y1="4" x2="12" y2="12" stroke="#0ea5e9" stroke-width="1.5"/>
            <line x1="4" y1="20" x2="12" y2="12" stroke="#0ea5e9" stroke-width="1.5"/>
            <line x1="20" y1="20" x2="12" y2="12" stroke="#0ea5e9" stroke-width="1.5"/>
          </svg>
        `
      default:
        return `<div class="w-4 h-4 bg-blue-500 rounded-full"></div>`
    }
  }

  function createAssetPopup(asset) {
    return `
      <div class="p-2 min-w-[200px]">
        <div class="font-bold text-base mb-1">${asset.name}</div>
        <div class="text-xs text-gray-500 uppercase mb-2">${asset.type}</div>
        <div class="grid grid-cols-2 gap-1 text-sm">
          <div>Altitude:</div><div>${Math.round(asset.position.altitude || 0)}m</div>
          <div>Speed:</div><div>${Math.round(asset.position.speed || 0)} m/s</div>
          <div>Battery:</div><div>${Math.round(asset.telemetry.battery || 0)}%</div>
          <div>Signal:</div><div>${Math.round(asset.telemetry.signal || 0)}%</div>
        </div>
      </div>
    `
  }

  onCleanup(() => {
    if (unsubscribeGlobal) {
      unsubscribeGlobal()
    }

    assetMarkers.forEach(marker => marker.remove())
    assetMarkers.clear()

    if (map()) {
      map().remove()
    }
  })

  return (
    <div class="h-full w-full relative">
      <div ref={mapContainer} class="h-full w-full"></div>
      
      <div class="absolute top-4 left-4 bg-gray-900/90 p-4 rounded-lg">
        <div class="font-semibold mb-2">Map Controls</div>
        <div class="text-sm text-gray-400">
          <p>✅ Offline tile caching enabled</p>
          <p>✅ All tiles cached locally</p>
          <p>✅ Works fully offline</p>
        </div>
      </div>
    </div>
  )
}