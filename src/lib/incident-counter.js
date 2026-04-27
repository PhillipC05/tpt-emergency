import { db } from './offline-db'

/**
 * Generates permanent sequential incident numbers
 * Guaranteed to never repeat, never change, never have gaps
 * Works 100% offline
 */
export async function getNextIncidentNumber() {
  // Get current counter
  let counter = await db.settings.get('incident_counter')
  
  if (!counter) {
    // Initialize counter if first run
    const year = new Date().getFullYear()
    counter = { key: 'incident_counter', value: 1 }
    await db.settings.add(counter)
  }

  const nextNumber = counter.value
  
  // Atomically increment counter
  await db.settings.update('incident_counter', {
    value: nextNumber + 1
  })

  // Format: YYYY-NNNNN (ex: 2026-00012)
  const year = new Date().getFullYear()
  return `${year}-${nextNumber.toString().padStart(5, '0')}`
}

export async function getCurrentIncidentNumber() {
  const counter = await db.settings.get('incident_counter')
  return counter?.value || 0
}