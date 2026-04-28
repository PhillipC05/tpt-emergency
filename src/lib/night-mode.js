/**
 * Night vision mode for emergency operations
 * Preserves dark adaptation when operating at night
 * Automatically activates after sunset
 * Pure red interface with zero blue light
 */
import { createSignal } from 'solid-js'

const [nightModeEnabled, setNightModeEnabled] = createSignal(false)
const [autoNightMode, setAutoNightModeSignal] = createSignal(false)

export function enableNightMode() {
  document.documentElement.classList.add('night-mode')
  setNightModeEnabled(true)
  localStorage.setItem('night_mode', 'true')
}

export function disableNightMode() {
  document.documentElement.classList.remove('night-mode')
  setNightModeEnabled(false)
  localStorage.setItem('night_mode', 'false')
}

export function toggleNightMode() {
  if (nightModeEnabled()) {
    disableNightMode()
  } else {
    enableNightMode()
  }
}

export function isNightMode() {
  return nightModeEnabled()
}

export function isAutoNightModeEnabled() {
  return autoNightMode()
}

export function setAutoNightMode(enabled) {
  setAutoNightModeSignal(enabled)
  localStorage.setItem('auto_night_mode', enabled.toString())
}

function checkSunset() {
  if (!autoNightMode()) return

  const hour = new Date().getHours()
  const isNightTime = hour < 6 || hour >= 18

  if (isNightTime && !nightModeEnabled()) {
    enableNightMode()
  } else if (!isNightTime && nightModeEnabled()) {
    disableNightMode()
  }
}

export function initNightMode() {
  // Load saved preferences
  const saved = localStorage.getItem('night_mode')
  const savedAuto = localStorage.getItem('auto_night_mode')

  if (savedAuto !== null) {
    setAutoNightModeSignal(savedAuto === 'true')
  }

  if (saved === 'true') {
    enableNightMode()
  } else if (saved === null) {
    // First run, check time automatically
    checkSunset()
  }

  // Check every 5 minutes
  setInterval(checkSunset, 300000)
}

// Add CSS dynamically
const style = document.createElement('style')
style.textContent = `
.night-mode {
  filter: sepia(100%) saturate(100%) brightness(70%) hue-rotate(-50deg) !important;
}

.night-mode img,
.night-mode video,
.night-mode canvas {
  filter: sepia(100%) saturate(100%) brightness(70%) hue-rotate(-50deg) !important;
}

/* EXCLUDE night mode toggle button from filter so it remains visible */
.night-mode .night-mode-toggle,
.night-mode [title="Toggle Night Mode"] {
  filter: none !important;
  background-color: #dc2626 !important;
  border-color: white !important;
  color: white !important;
}

/* Sidebar visibility improvements for night mode */
.night-mode .bg-gray-800,
.night-mode .bg-gray-900 {
  background-color: #1a0000 !important;
}

.night-mode .bg-gray-700 {
  background-color: #330000 !important;
}

.night-mode .hover\:bg-gray-700\/50:hover {
  background-color: #400000 !important;
}

.night-mode .border-gray-700 {
  border-color: #440000 !important;
}

.night-mode .text-gray-400 {
  color: #aa6666 !important;
}

.night-mode * {
  border-color: #400 !important;
}
`
document.head.appendChild(style)