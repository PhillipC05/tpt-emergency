/* d:\Programming\2 WIP\TPT Open Source\tpt-emergency\src\lib\geocoder.js */

/**
 * Unified Offline-First Geocoding Service
 * Handles both online Nominatim geocoding and offline cached lookups
 */

export class GeocoderService {
  constructor() {
    this.cache = new Map()
    this.offlineDatabase = new Map()
    this.isOnline = navigator.onLine
    this.countryCode = 'nz'
    
    // Load cache from localStorage
    this.loadCache()
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.isOnline = true)
    window.addEventListener('offline', () => this.isOnline = false)
  }
  
  setCountry(code) {
    this.countryCode = code
  }
  
  loadCache() {
    try {
      const saved = localStorage.getItem('geocoder_cache')
      if (saved) {
        const entries = JSON.parse(saved)
        entries.forEach(([query, result]) => this.cache.set(query.toLowerCase(), result))
      }
    } catch (e) {
      console.warn('Could not load geocoder cache:', e)
    }
  }
  
  saveCache() {
    try {
      // Only keep last 1000 entries
      const entries = Array.from(this.cache.entries()).slice(-1000)
      localStorage.setItem('geocoder_cache', JSON.stringify(entries))
    } catch (e) {
      console.warn('Could not save geocoder cache:', e)
    }
  }
  
  async forwardGeocode(query, limit = 5) {
    const queryKey = query.toLowerCase().trim()
    
    // Return cached result immediately if available
    if (this.cache.has(queryKey)) {
      return this.cache.get(queryKey)
    }
    
    // Try offline database first
    const offlineResults = this.searchOfflineDatabase(query)
    if (offlineResults.length > 0) {
      return offlineResults
    }
    
    // If online, use Nominatim
    if (this.isOnline) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=geojson&polygon_geojson=1&addressdetails=1&limit=${limit}&countrycodes=${this.countryCode}`
        const res = await fetch(url, { 
          headers: { 'Accept-Language': 'en' },
          signal: AbortSignal.timeout(5000)
        })
        
        if (!res.ok) throw new Error('Geocoder request failed')
        
        const geojson = await res.json()
        const features = []
        
        for (const f of geojson.features) {
          const lon = f.bbox ? (f.bbox[0] + f.bbox[2]) / 2 : f.geometry.coordinates[0]
          const lat = f.bbox ? (f.bbox[1] + f.bbox[3]) / 2 : f.geometry.coordinates[1]
          
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lon, lat] },
            place_name: f.properties.display_name,
            properties: f.properties,
            text: f.properties.display_name,
            place_type: ['place'],
            center: [lon, lat]
          })
        }
        
        // Cache successful results
        if (features.length > 0) {
          this.cache.set(queryKey, features)
          this.saveCache()
        }
        
        return features
        
      } catch (e) {
        console.warn('Online geocoding failed, falling back:', e)
      }
    }
    
    // All methods failed
    return []
  }
  
  async reverseGeocode(lat, lon) {
    const cacheKey = `rev:${lat.toFixed(5)}:${lon.toFixed(5)}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }
    
    if (this.isOnline) {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
        const res = await fetch(url, { 
          headers: { 'Accept-Language': 'en' },
          signal: AbortSignal.timeout(3000)
        })
        
        if (res.ok) {
          const data = await res.json()
          const result = data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`
          this.cache.set(cacheKey, result)
          this.saveCache()
          return result
        }
      } catch (e) {
        console.warn('Reverse geocoding failed:', e)
      }
    }
    
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`
  }
  
  searchOfflineDatabase(query) {
    // Simple offline matching for cached locations
    const results = []
    const searchTerms = query.toLowerCase().split(/\s+/)
    
    for (const [, features] of this.cache) {
      for (const feature of features) {
        const name = feature.place_name.toLowerCase()
        if (searchTerms.every(term => name.includes(term))) {
          results.push(feature)
        }
      }
    }
    
    return results.slice(0, 5)
  }
  
  /**
   * Get MapLibre Geocoder adapter for map component
   */
  getMaplibreAdapter() {
    return {
      forwardGeocode: async (config) => {
        const features = await this.forwardGeocode(config.query, config.limit || 5)
        return { features }
      }
    }
  }
  
  /**
   * Import offline address dataset
   */
  async importDataset(countryCode, data) {
    // Implementation for bulk address import
    console.log(`Importing ${countryCode} address dataset`, data.length, 'entries')
  }
}

// Global singleton instance
export const geocoder = new GeocoderService()