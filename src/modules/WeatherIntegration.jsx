/**
 * TPT Emergency System - Weather & Environmental Integration
 * @module src/modules/WeatherIntegration.jsx
 * Real-time weather monitoring, alerts, and environmental hazard tracking
 */

import { createSignal, createEffect, onMount, onCleanup, For } from 'solid-js'

export function WeatherIntegration() {
  const [weatherData, setWeatherData] = createSignal(null)
  const [alerts, setAlerts] = createSignal([])
  const [forecast, setForecast] = createSignal([])
  const [location, setLocation] = createSignal({ lat: null, lon: null, name: 'Current Location' })
  const [loading, setLoading] = createSignal(false)
  const [activeTab, setActiveTab] = createSignal('current')
  const [environmentalSensors, setEnvironmentalSensors] = createSignal([])

  // Simulated environmental sensor data for offline/demo operation
  const simulateSensorData = () => {
    const now = new Date()
    return [
      {
        id: 'sensor-1',
        name: 'Station Alpha',
        type: 'air_quality',
        aqi: Math.floor(Math.random() * 150) + 20,
        pm25: Math.floor(Math.random() * 50) + 5,
        pm10: Math.floor(Math.random() * 80) + 10,
        o3: Math.floor(Math.random() * 100) + 20,
        status: 'active',
        lastUpdate: now.toISOString()
      },
      {
        id: 'sensor-2',
        name: 'River Gauge 1',
        type: 'flood',
        waterLevel: (Math.random() * 5 + 1).toFixed(2),
        flowRate: Math.floor(Math.random() * 500) + 100,
        floodStage: 'normal',
        status: 'active',
        lastUpdate: now.toISOString()
      },
      {
        id: 'sensor-3',
        name: 'Wind Monitor',
        type: 'wind',
        speed: Math.floor(Math.random() * 60) + 5,
        gusts: Math.floor(Math.random() * 30) + 60,
        direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        status: 'active',
        lastUpdate: now.toISOString()
      },
      {
        id: 'sensor-4',
        name: 'Seismic Station',
        type: 'seismic',
        magnitude: (Math.random() * 2).toFixed(1),
        intensity: 'I',
        depth: Math.floor(Math.random() * 20) + 5,
        status: 'active',
        lastUpdate: now.toISOString()
      },
      {
        id: 'sensor-5',
        name: 'Radiation Monitor',
        type: 'radiation',
        level: (Math.random() * 0.5).toFixed(3),
        unit: 'μSv/h',
        baseline: 0.1,
        status: 'active',
        lastUpdate: now.toISOString()
      }
    ]
  }

  const fetchWeatherData = async () => {
    setLoading(true)
    try {
      // Try Open-Meteo API (free, no key required)
      const lat = location().lat || 40.7128
      const lon = location().lon || -74.0060

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,precipitation,visibility&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=3`
      )

      if (response.ok) {
        const data = await response.json()
        setWeatherData(data)

        // Build forecast array
        const daily = data.daily
        const fc = daily.time.map((time, i) => ({
          date: time,
          maxTemp: daily.temperature_2m_max[i],
          minTemp: daily.temperature_2m_min[i],
          precipitation: daily.precipitation_sum[i],
          windSpeed: daily.wind_speed_10m_max[i],
          weatherCode: daily.weather_code[i]
        }))
        setForecast(fc)

        // Generate alerts based on weather conditions
        generateWeatherAlerts(data)
      }
    } catch (error) {
      console.log('Weather fetch failed, using offline data')
      setWeatherData(generateOfflineWeather())
    } finally {
      setLoading(false)
    }
  }

  const generateOfflineWeather = () => {
    return {
      current: {
        temperature_2m: 22,
        relative_humidity_2m: 65,
        apparent_temperature: 24,
        weather_code: 1,
        wind_speed_10m: 12,
        wind_direction_10m: 180,
        pressure_msl: 1013,
        precipitation: 0,
        visibility: 10000
      }
    }
  }

  const generateWeatherAlerts = (data) => {
    const newAlerts = []
    const current = data.current

    if (current.wind_speed_10m > 50) {
      newAlerts.push({
        id: crypto.randomUUID(),
        type: 'wind',
        severity: 'high',
        title: 'High Wind Warning',
        description: `Wind speeds of ${current.wind_speed_10m} km/h detected. Secure loose objects and avoid elevated operations.`,
        timestamp: new Date().toISOString(),
        expires: new Date(Date.now() + 3600000).toISOString()
      })
    }

    if (current.temperature_2m > 35) {
      newAlerts.push({
        id: crypto.randomUUID(),
        type: 'heat',
        severity: 'high',
        title: 'Extreme Heat Advisory',
        description: `Temperature ${current.temperature_2m}°C. Increase hydration protocols and monitor personnel for heat stress.`,
        timestamp: new Date().toISOString(),
        expires: new Date(Date.now() + 3600000).toISOString()
      })
    }

    if (current.precipitation > 10) {
      newAlerts.push({
        id: crypto.randomUUID(),
        type: 'flood',
        severity: 'medium',
        title: 'Heavy Rain Alert',
        description: `Precipitation ${current.precipitation}mm. Monitor for flooding and reduced visibility.`,
        timestamp: new Date().toISOString(),
        expires: new Date(Date.now() + 3600000).toISOString()
      })
    }

    if (current.visibility < 1000) {
      newAlerts.push({
        id: crypto.randomUUID(),
        type: 'visibility',
        severity: 'medium',
        title: 'Low Visibility Warning',
        description: `Visibility reduced to ${current.visibility}m. Exercise caution during vehicle operations.`,
        timestamp: new Date().toISOString(),
        expires: new Date(Date.now() + 3600000).toISOString()
      })
    }

    setAlerts(prev => [...newAlerts, ...prev].slice(0, 20))
  }

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  const getWeatherIcon = (code) => {
    if (code === 0) return '☀️'
    if (code <= 3) return '🌤️'
    if (code <= 48) return '☁️'
    if (code <= 67) return '🌧️'
    if (code <= 77) return '🌨️'
    if (code <= 82) return '🌧️'
    if (code <= 86) return '❄️'
    if (code <= 99) return '⛈️'
    return '🌡️'
  }

  const getWeatherDescription = (code) => {
    const descriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      95: 'Thunderstorm'
    }
    return descriptions[code] || 'Unknown'
  }

  const getSeverityColor = (severity) => {
    return {
      low: 'bg-blue-600',
      medium: 'bg-yellow-600',
      high: 'bg-orange-600',
      critical: 'bg-red-600'
    }[severity] || 'bg-gray-600'
  }

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'text-green-400'
    if (aqi <= 100) return 'text-yellow-400'
    if (aqi <= 150) return 'text-orange-400'
    return 'text-red-400'
  }

  const getFloodStageColor = (stage) => {
    return {
      normal: 'text-green-400',
      action: 'text-yellow-400',
      minor: 'text-orange-400',
      moderate: 'text-red-400',
      major: 'text-purple-400'
    }[stage] || 'text-gray-400'
  }

  onMount(() => {
    fetchWeatherData()
    setEnvironmentalSensors(simulateSensorData())

    const weatherInterval = setInterval(fetchWeatherData, 300000) // 5 minutes
    const sensorInterval = setInterval(() => {
      setEnvironmentalSensors(simulateSensorData())
    }, 30000) // 30 seconds

    onCleanup(() => {
      clearInterval(weatherInterval)
      clearInterval(sensorInterval)
    })
  })

  return (
    <div class="p-6 h-full flex flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">🌤️ Weather & Environmental Monitor</h2>
        <div class="flex items-center gap-3">
          {loading() && <span class="text-sm text-gray-400">Updating...</span>}
          <button
            onClick={fetchWeatherData}
            class="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div class="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('current')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'current' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Current Conditions
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'forecast' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Forecast
        </button>
        <button
          onClick={() => setActiveTab('sensors')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'sensors' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Environmental Sensors
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          class={`px-4 py-2 rounded text-sm font-medium transition ${activeTab() === 'alerts' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Alerts ({alerts().length})
        </button>
      </div>

      {activeTab() === 'current' && weatherData() && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-4 gap-4 mb-4">
            <div class="bg-gray-800 rounded-lg p-4 text-center">
              <div class="text-4xl mb-2">{getWeatherIcon(weatherData().current.weather_code)}</div>
              <div class="text-3xl font-bold">{weatherData().current.temperature_2m}°C</div>
              <div class="text-sm text-gray-400">{getWeatherDescription(weatherData().current.weather_code)}</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 text-center">
              <div class="text-2xl mb-2">💨</div>
              <div class="text-3xl font-bold">{weatherData().current.wind_speed_10m}</div>
              <div class="text-sm text-gray-400">km/h {weatherData().current.wind_direction_10m}°</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 text-center">
              <div class="text-2xl mb-2">💧</div>
              <div class="text-3xl font-bold">{weatherData().current.relative_humidity_2m}%</div>
              <div class="text-sm text-gray-400">Humidity</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 text-center">
              <div class="text-2xl mb-2">📊</div>
              <div class="text-3xl font-bold">{weatherData().current.pressure_msl}</div>
              <div class="text-sm text-gray-400">hPa Pressure</div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="bg-gray-800 rounded-lg p-4">
              <div class="text-sm text-gray-400 mb-1">Feels Like</div>
              <div class="text-2xl font-bold">{weatherData().current.apparent_temperature}°C</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4">
              <div class="text-sm text-gray-400 mb-1">Precipitation</div>
              <div class="text-2xl font-bold">{weatherData().current.precipitation} mm</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4">
              <div class="text-sm text-gray-400 mb-1">Visibility</div>
              <div class="text-2xl font-bold">{(weatherData().current.visibility / 1000).toFixed(1)} km</div>
            </div>
          </div>
        </div>
      )}

      {activeTab() === 'forecast' && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-3 gap-4">
            <For each={forecast()}>
              {day => (
                <div class="bg-gray-800 rounded-lg p-4">
                  <div class="text-center mb-3">
                    <div class="text-3xl mb-2">{getWeatherIcon(day.weatherCode)}</div>
                    <div class="font-medium">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                    <div class="text-sm text-gray-400">{getWeatherDescription(day.weatherCode)}</div>
                  </div>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-gray-400">High</span>
                      <span class="font-bold">{day.maxTemp}°C</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Low</span>
                      <span class="font-bold">{day.minTemp}°C</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Precip</span>
                      <span class="font-bold">{day.precipitation} mm</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Wind</span>
                      <span class="font-bold">{day.windSpeed} km/h</span>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'sensors' && (
        <div class="flex-1 overflow-auto">
          <div class="grid grid-cols-2 gap-4">
            <For each={environmentalSensors()}>
              {sensor => (
                <div class="bg-gray-800 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class="text-xl">
                        {sensor.type === 'air_quality' && '🌫️'}
                        {sensor.type === 'flood' && '🌊'}
                        {sensor.type === 'wind' && '🍃'}
                        {sensor.type === 'seismic' && '🌋'}
                        {sensor.type === 'radiation' && '☢️'}
                      </span>
                      <div>
                        <div class="font-medium">{sensor.name}</div>
                        <div class="text-xs text-gray-400">{sensor.type.replace('_', ' ').toUpperCase()}</div>
                      </div>
                    </div>
                    <span class={`w-2 h-2 rounded-full ${sensor.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>

                  {sensor.type === 'air_quality' && (
                    <div class="space-y-2">
                      <div class="flex justify-between items-center">
                        <span class="text-gray-400">AQI</span>
                        <span class={`text-2xl font-bold ${getAQIColor(sensor.aqi)}`}>{sensor.aqi}</span>
                      </div>
                      <div class="grid grid-cols-3 gap-2 text-center text-sm">
                        <div class="bg-gray-900 rounded p-2">
                          <div class="text-gray-400 text-xs">PM2.5</div>
                          <div class="font-bold">{sensor.pm25}</div>
                        </div>
                        <div class="bg-gray-900 rounded p-2">
                          <div class="text-gray-400 text-xs">PM10</div>
                          <div class="font-bold">{sensor.pm10}</div>
                        </div>
                        <div class="bg-gray-900 rounded p-2">
                          <div class="text-gray-400 text-xs">O3</div>
                          <div class="font-bold">{sensor.o3}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {sensor.type === 'flood' && (
                    <div class="space-y-2">
                      <div class="flex justify-between">
                        <span class="text-gray-400">Water Level</span>
                        <span class="font-bold">{sensor.waterLevel} m</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-400">Flow Rate</span>
                        <span class="font-bold">{sensor.flowRate} m³/s</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-400">Flood Stage</span>
                        <span class={`font-bold ${getFloodStageColor(sensor.floodStage)}`}>{sensor.floodStage.toUpperCase()}</span>
                      </div>
                    </div>
                  )}

                  {sensor.type === 'wind' && (
                    <div class="space-y-2">
                      <div class="flex justify-between">
                        <span class="text-gray-400">Wind Speed</span>
                        <span class="font-bold">{sensor.speed} km/h</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-400">Gusts</span>
                        <span class="font-bold">{sensor.gusts} km/h</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-400">Direction</span>
                        <span class="font-bold">{sensor.direction}</span>
                      </div>
                    </div>
                  )}

                  {sensor.type === 'seismic' && (
                    <div class="space-y-2">
                      <div class="flex justify-between">
                        <span class="text-gray-400">Magnitude</span>
                        <span class="font-bold">{sensor.magnitude}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-400">Intensity</span>
                        <span class="font-bold">{sensor.intensity}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-400">Depth</span>
                        <span class="font-bold">{sensor.depth} km</span>
                      </div>
                    </div>
                  )}

                  {sensor.type === 'radiation' && (
                    <div class="space-y-2">
                      <div class="flex justify-between items-center">
                        <span class="text-gray-400">Current Level</span>
                        <span class="font-bold">{sensor.level} {sensor.unit}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-400">Baseline</span>
                        <span class="font-bold">{sensor.baseline} {sensor.unit}</span>
                      </div>
                      <div class="h-2 bg-gray-700 rounded overflow-hidden mt-2">
                        <div
                          class={`h-full ${parseFloat(sensor.level) > sensor.baseline * 2 ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min((parseFloat(sensor.level) / (sensor.baseline * 5)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div class="text-xs text-gray-500 mt-2 text-right">
                    Updated: {new Date(sensor.lastUpdate).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}

      {activeTab() === 'alerts' && (
        <div class="flex-1 overflow-auto">
          <div class="space-y-2">
            <For each={alerts()}>
              {alert => (
                <div class={`p-4 rounded-lg border ${alert.severity === 'critical' ? 'border-red-600 bg-red-900/20' : alert.severity === 'high' ? 'border-orange-600 bg-orange-900/20' : 'border-yellow-600 bg-yellow-900/20'}`}>
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span class="font-medium">{alert.title}</span>
                      </div>
                      <div class="text-sm text-gray-300">{alert.description}</div>
                      <div class="text-xs text-gray-500 mt-2">
                        Issued: {new Date(alert.timestamp).toLocaleString()} • Expires: {new Date(alert.expires).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      class="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600 ml-2"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </For>
            {alerts().length === 0 && (
              <div class="text-gray-500 text-center py-8">
                <div class="text-4xl mb-2">✅</div>
                <div>No active weather alerts</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default WeatherIntegration
