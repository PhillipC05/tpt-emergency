/* d:\Programming\2 WIP\TPT Open Source\tpt-emergency\src\components\IncidentCreator.jsx */
import { createSignal, createEffect, onMount } from 'solid-js'

export function IncidentCreator(props) {
  const [formData, setFormData] = createSignal({
    type: 'fire',
    status: 'active',
    address: '',
    latitude: 0,
    longitude: 0,
    description: '',
    priority: 'medium'
  })
  const [addressSuggestions, setAddressSuggestions] = createSignal([])
  const [showSuggestions, setShowSuggestions] = createSignal(false)
  const [geocoderAvailable, setGeocoderAvailable] = createSignal(false)
  let geocoder = null

  const incidentTypes = [
    { id: 'fire', name: 'Fire', icon: '🔥', color: 'bg-orange-600' },
    { id: 'ambulance', name: 'Medical', icon: '🚑', color: 'bg-red-600' },
    { id: 'police', name: 'Police', icon: '🚔', color: 'bg-blue-600' },
    { id: 'disaster', name: 'Disaster', icon: '🌪️', color: 'bg-yellow-600' },
    { id: 'sar', name: 'Search & Rescue', icon: '🔍', color: 'bg-emerald-600' }
  ]

  const priorityColors = {
    low: 'bg-green-600',
    medium: 'bg-yellow-600',
    high: 'bg-orange-600',
    critical: 'bg-red-600'
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })

        // Reverse geocode coordinates to address
        if (geocoder) {
          geocoder.geocode({ location: { lat: position.coords.latitude, lng: position.coords.longitude } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              setFormData({
                ...formData(),
                address: results[0].formatted_address
              })
            }
          })
        }
      })
    }
  }

  const searchAddress = (query) => {
    if (!geocoder || query.length < 3) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    geocoder.geocode({ address: query }, (results, status) => {
      if (status === 'OK') {
        setAddressSuggestions(results.slice(0, 5))
        setShowSuggestions(true)
      }
    })
  }

  const selectAddress = (result) => {
    setFormData({
      ...formData(),
      address: result.formatted_address,
      latitude: result.geometry.location.lat(),
      longitude: result.geometry.location.lng()
    })
    setShowSuggestions(false)
  }

  onMount(() => {
    // Check if Google Maps Geocoder is available
    if (window.google && window.google.maps) {
      geocoder = new window.google.maps.Geocoder()
      setGeocoderAvailable(true)
      console.log('✅ Address geocoding available')
    } else {
      console.log('⚠️  Address geocoding not available, fallback to manual entry')
    }
  })

  const submit = async (e) => {
    e.preventDefault()
    
    const incident = {
      ...formData(),
      created_at: Date.now(),
      data: {}
    }

    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident)
    })

    if (res.ok) {
      props.onCreated?.(await res.json())
      setFormData({
        type: 'fire',
        status: 'active',
        address: '',
        latitude: 0,
        longitude: 0,
        description: '',
        priority: 'medium'
      })
    }
  }

  return (
    <div class="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
      <h2 class="text-xl font-bold mb-6">📝 Create New Incident</h2>
      
      <form onSubmit={submit} class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-2">Incident Type</label>
          <div class="grid grid-cols-4 gap-2">
            {incidentTypes.map(type => (
              <button
                type="button"
                onClick={() => setFormData({ ...formData(), type: type.id })}
                class={`p-3 rounded-lg text-center transition ${formData().type === type.id ? type.color : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <div class="text-2xl">{type.icon}</div>
                <div class="text-sm mt-1">{type.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-2">Priority</label>
          <div class="grid grid-cols-4 gap-2">
            {Object.entries(priorityColors).map(([level, color]) => (
              <button
                type="button"
                onClick={() => setFormData({ ...formData(), priority: level })}
                class={`p-2 rounded-lg text-sm capitalize transition ${formData().priority === level ? color : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

         <div>
           <label class="block text-sm text-gray-400 mb-2">Location Address</label>
           <div class="relative">
             <div class="flex gap-2">
               <input
                 type="text"
                 value={formData().address}
                 onInput={(e) => {
                   setFormData({ ...formData(), address: e.target.value })
                   searchAddress(e.target.value)
                 }}
                 onFocus={() => formData().address.length >=3 && setShowSuggestions(true)}
                 onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                 class="flex-1 bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                 placeholder={`Enter incident location address ${geocoderAvailable() ? '(autocomplete available)' : ''}`}
                 required
               />
               <button
                 type="button"
                 onClick={getCurrentLocation}
                 class="px-4 bg-blue-600 hover:bg-blue-500 rounded-lg transition"
                 title="Use My Current Location"
               >
                 📍
               </button>
             </div>

             {showSuggestions() && addressSuggestions().length > 0 && (
               <div class="absolute top-full left-0 right-0 mt-1 bg-gray-700 rounded-lg z-10 overflow-hidden shadow-xl border border-gray-600">
                 {addressSuggestions().map(suggestion => (
                   <button
                     type="button"
                     onMouseDown={() => selectAddress(suggestion)}
                     class="w-full text-left p-3 hover:bg-gray-600 transition text-sm border-b border-gray-600 last:border-0"
                   >
                     📍 {suggestion.formatted_address}
                   </button>
                 ))}
               </div>
             )}
           </div>

           {formData().latitude !== 0 && (
             <div class="mt-2 text-xs text-gray-500">
               📍 Coordinates: {formData().latitude.toFixed(6)}, {formData().longitude.toFixed(6)}
             </div>
           )}
         </div>

        <div>
          <label class="block text-sm text-gray-400 mb-2">Description</label>
          <textarea
            value={formData().description}
            onInput={(e) => setFormData({ ...formData(), description: e.target.value })}
            class="w-full bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            placeholder="Describe the incident, hazards, number of people involved..."
          />
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="button"
            onClick={props.onClose}
            class="flex-1 px-6 py-3 bg-gray-700 rounded-lg font-medium hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="flex-1 px-6 py-3 bg-red-600 rounded-lg font-medium hover:bg-red-500 transition"
          >
            🚨 Create Incident
          </button>
        </div>
      </form>
    </div>
  )
}