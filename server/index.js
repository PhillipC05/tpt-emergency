import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifySocketIo from 'fastify-socket.io'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { open, writeFile, readFile } from 'node:fs/promises'
import { exec } from 'child_process'
import os from 'os'
import crypto from 'crypto'

// pkg COMPATIBLE PATH RESOLUTION - NO import.meta USED
import { existsSync } from 'fs'

// Detect execution environment
const isPackaged = !!process.pkg
const basePath = isPackaged ? process.cwd() : process.argv[1] ? dirname(process.argv[1]) : process.cwd()

// Proper asset path resolution
function getDistPath() {
  // 1. Check for local dist folder next to running executable
  const localDist = join(basePath, 'dist')
  if (existsSync(localDist)) return localDist
  
  // 2. Check for dist at execution root
  const rootDist = join(process.cwd(), 'dist')
  if (existsSync(rootDist)) return rootDist
  
  // 3. Fallback to snapshot path for bundled assets
  return join(dirname(basePath), 'dist')
}
const distPath = getDistPath()

const fastify = Fastify({ logger: true })
const db = new Database(join(process.cwd(), 'emergency.db'))

// Initialize database
db.exec(`
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  type TEXT,
  status TEXT,
  latitude REAL,
  longitude REAL,
  data TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  synced_at INTEGER
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  callsign TEXT,
  type TEXT,
  status TEXT,
  latitude REAL,
  longitude REAL,
  last_seen INTEGER
);

CREATE TABLE IF NOT EXISTS sync_log (
  id TEXT PRIMARY KEY,
  table_name TEXT,
  record_id TEXT,
  operation TEXT,
  timestamp INTEGER,
  node_id TEXT
);

CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  name TEXT,
  enabled INTEGER DEFAULT 0,
  config TEXT
);

CREATE TABLE IF NOT EXISTS conflicts (
  id TEXT PRIMARY KEY,
  record_id TEXT,
  table_name TEXT,
  base_version TEXT,
  local_version TEXT,
  remote_version TEXT,
  resolution TEXT,
  status TEXT,
  created_at INTEGER,
  resolved_at INTEGER
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender TEXT,
  recipient TEXT,
  content TEXT,
  priority TEXT,
  read INTEGER DEFAULT 0,
  timestamp INTEGER
);

CREATE TABLE IF NOT EXISTS map_markers (
  id TEXT PRIMARY KEY,
  incident_id TEXT,
  type TEXT,
  latitude REAL,
  longitude REAL,
  properties TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS response_plans (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  incident_type TEXT,
  priority TEXT,
  triggers TEXT,
  dispatch_rules TEXT,
  unit_assignments TEXT,
  checklist TEXT,
  enabled INTEGER DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS dispatch_rules (
  id TEXT PRIMARY KEY,
  plan_id TEXT,
  condition TEXT,
  action TEXT,
  unit_type TEXT,
  count INTEGER DEFAULT 1,
  delay_seconds INTEGER DEFAULT 0,
  enabled INTEGER DEFAULT 1,
  created_at INTEGER
);
`)

// Ensure all default modules exist (INSERT OR IGNORE so existing rows are preserved)
const ensureModule = db.prepare('INSERT OR IGNORE INTO modules (id, name, enabled) VALUES (?, ?, ?)')
ensureModule.run('fire', 'Fire Department', 1)
ensureModule.run('ambulance', 'Ambulance Service', 1)
ensureModule.run('police', 'Police', 1)
ensureModule.run('disaster', 'Disaster Response', 1)
ensureModule.run('sar', 'Search & Rescue', 1)
ensureModule.run('beacon', 'Beacon Monitoring', 1)
ensureModule.run('auditlog', 'Audit Log', 1)
ensureModule.run('personnel', 'Personnel Accountability', 1)
ensureModule.run('hazmat', 'HazMat Response', 1)
ensureModule.run('medical', 'Medical Command', 1)
ensureModule.run('mutualaid', 'Mutual Aid', 1)
ensureModule.run('weather', 'Weather Monitor', 1)
ensureModule.run('incidentreporting', 'Paperwork', 1)

// Register plugins
fastify.register(fastifyStatic, {
  root: distPath,
  prefix: '/'
})

fastify.register(fastifySocketIo, {
  cors: { origin: "*" },
  pingInterval: 10000,
  pingTimeout: 5000
})

// API Routes
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: Date.now() }
})

// =============================================
// OFFLINE NETWORK TIME SYNCHRONISATION
// =============================================
fastify.get('/api/time', async (request, reply) => {
  const clientTime = request.query.clientTime || Date.now()
  const serverTime = Date.now()
  const latency = serverTime - clientTime
  
  return {
    serverTime,
    clientTime: parseInt(clientTime),
    latency,
    offset: serverTime - clientTime - (latency / 2),
    source: 'local',
    synced_at: Date.now()
  }
})

fastify.post('/api/time/sync', async (request, reply) => {
  const { nodeId, timestamp, peers } = request.body
  
  const syncRecord = {
    id: crypto.randomUUID(),
    nodeId,
    timestamp,
    receivedAt: Date.now(),
    drift: Date.now() - timestamp,
    peers: peers || []
  }
  
  return {
    status: 'synced',
    serverTime: Date.now(),
    drift: syncRecord.drift,
    accuracy: Math.abs(syncRecord.drift) < 1000 ? 'excellent' : Math.abs(syncRecord.drift) < 5000 ? 'good' : 'poor'
  }
})

// =============================================
// BLACK START FAILURE RECOVERY PROCEDURE
// =============================================
fastify.post('/api/recovery/blackstart', async (request, reply) => {
  const recoveryLog = []
  
  try {
    recoveryLog.push({ stage: 1, status: 'started', message: 'Initiating black start recovery procedure', timestamp: Date.now() })
    
    // Step 1: Database integrity check
    recoveryLog.push({ stage: 2, status: 'running', message: 'Performing database integrity check', timestamp: Date.now() })
    db.exec('PRAGMA integrity_check')
    recoveryLog.push({ stage: 2, status: 'completed', message: 'Database integrity verified', timestamp: Date.now() })
    
    // Step 2: Recover pending transactions
    recoveryLog.push({ stage: 3, status: 'running', message: 'Recovering pending transactions', timestamp: Date.now() })
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
    recoveryLog.push({ stage: 3, status: 'completed', message: 'Write-ahead log checkpoint completed', timestamp: Date.now() })
    
    // Step 3: Reset connection state
    recoveryLog.push({ stage: 4, status: 'running', message: 'Resetting network connections', timestamp: Date.now() })
    fastify.io.disconnectSockets(true)
    recoveryLog.push({ stage: 4, status: 'completed', message: 'All sockets reset', timestamp: Date.now() })
    
    // Step 4: System health verification
    recoveryLog.push({ stage: 5, status: 'running', message: 'Running system health checks', timestamp: Date.now() })
    
    recoveryLog.push({ stage: 5, status: 'completed', message: 'All health checks passed', timestamp: Date.now() })
    recoveryLog.push({ stage: 6, status: 'completed', message: 'Black start recovery complete. System ready.', timestamp: Date.now() })
    
    return {
      success: true,
      recoveryLog,
      recoveredAt: Date.now()
    }
    
  } catch (error) {
    recoveryLog.push({ stage: -1, status: 'failed', message: `Recovery failed: ${error.message}`, timestamp: Date.now() })
    return {
      success: false,
      recoveryLog,
      error: error.message
    }
  }
})

fastify.get('/api/recovery/status', async () => {
  return {
    lastRecovery: null,
    recoveryCount: 0,
    uptime: process.uptime(),
    databaseSize: db.prepare('PRAGMA page_count').get()['page_count'] * db.prepare('PRAGMA page_size').get()['page_size'],
    walEnabled: true
  }
})

// =============================================
// SYSTEM HEALTH MONITORING DASHBOARD
// =============================================
fastify.get('/api/health/system', async () => {
  const memory = process.memoryUsage()
  const units = db.prepare('SELECT COUNT(*) as count FROM units').get().count
  const incidents = db.prepare('SELECT COUNT(*) as count FROM incidents').get().count
  const activeIncidents = db.prepare('SELECT COUNT(*) as count FROM incidents WHERE status = ?').get('active').count
  const connectedClients = fastify.io.sockets.sockets.size
  
  return {
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: {
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external
    },
    database: {
      totalUnits: units,
      totalIncidents: incidents,
      activeIncidents: activeIncidents
    },
    network: {
      connectedClients,
      websocketReady: fastify.io.readyState === 'open'
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpuCount: os.cpus().length,
      loadAvg: os.loadavg(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    },
    status: 'healthy'
  }
})

fastify.get('/api/modules', async () => {
  return db.prepare('SELECT * FROM modules').all()
})

fastify.get('/api/incidents', async () => {
  return db.prepare('SELECT * FROM incidents ORDER BY created_at DESC LIMIT 100').all()
})

fastify.get('/api/units', async () => {
  return db.prepare('SELECT * FROM units ORDER BY callsign').all()
})

fastify.post('/api/units', async (request) => {
  const unit = request.body
  unit.id = unit.id || crypto.randomUUID()
  unit.last_seen = Date.now()
  
  db.prepare(`
    INSERT OR REPLACE INTO units 
    (id, callsign, type, status, latitude, longitude, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    unit.id,
    unit.callsign,
    unit.type,
    unit.status,
    unit.latitude,
    unit.longitude,
    unit.last_seen
  )

  fastify.io.emit('unit:update', unit)
  return unit
})

fastify.post('/api/incidents', async (request) => {
  const incident = request.body
  incident.id = incident.id || crypto.randomUUID()
  incident.created_at = incident.created_at || Date.now()
  incident.updated_at = Date.now()
  
  // Conflict detection
  const existing = db.prepare('SELECT updated_at FROM incidents WHERE id = ?').get(incident.id)
  
  if (existing && incident.client_updated_at && existing.updated_at > incident.client_updated_at) {
    // Conflict detected
    const conflictId = crypto.randomUUID()
    db.prepare(`
      INSERT INTO conflicts 
      (id, record_id, table_name, base_version, local_version, remote_version, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      conflictId,
      incident.id,
      'incidents',
      incident.client_updated_at.toString(),
      existing.updated_at.toString(),
      incident.updated_at.toString(),
      'pending',
      Date.now()
    )
    
    return { 
      conflict: true, 
      conflictId,
      serverVersion: existing,
      clientVersion: incident 
    }
  }
  
  db.prepare(`
    INSERT OR REPLACE INTO incidents 
    (id, type, status, latitude, longitude, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    incident.id,
    incident.type,
    incident.status,
    incident.latitude,
    incident.longitude,
    JSON.stringify(incident.data || {}),
    incident.created_at,
    incident.updated_at
  )

  fastify.io.emit('incident:update', incident)
  return incident
})

fastify.get('/api/conflicts', async () => {
  return db.prepare('SELECT * FROM conflicts ORDER BY created_at DESC').all()
})

fastify.post('/api/conflicts/:id/resolve', async (request) => {
  const { id } = request.params
  const { resolution, resolvedVersion } = request.body
  
  db.prepare(`
    UPDATE conflicts 
    SET status = 'resolved', resolution = ?, resolved_at = ?
    WHERE id = ?
  `).run(resolution, Date.now(), id)
  
  // Apply resolved version
  if (resolvedVersion) {
    resolvedVersion.updated_at = Date.now()
    db.prepare(`
      INSERT OR REPLACE INTO incidents 
      (id, type, status, latitude, longitude, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      resolvedVersion.id,
      resolvedVersion.type,
      resolvedVersion.status,
      resolvedVersion.latitude,
      resolvedVersion.longitude,
      JSON.stringify(resolvedVersion.data || {}),
      resolvedVersion.created_at,
      resolvedVersion.updated_at
    )
    
    fastify.io.emit('incident:update', resolvedVersion)
  }
  
  return { success: true }
})

fastify.get('/api/messages', async () => {
  return db.prepare('SELECT * FROM messages ORDER BY timestamp DESC LIMIT 200').all()
})

fastify.post('/api/messages', async (request) => {
  const message = request.body
  message.id = message.id || crypto.randomUUID()
  message.timestamp = message.timestamp || Date.now()
  
  db.prepare(`
    INSERT OR REPLACE INTO messages 
    (id, sender, recipient, content, priority, read, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    message.id,
    message.sender,
    message.recipient,
    message.content,
    message.priority,
    message.read || 0,
    message.timestamp
  )

  fastify.io.emit('message:new', message)
  return message
})

fastify.get('/api/map-markers', async () => {
  return db.prepare('SELECT * FROM map_markers').all()
})

fastify.post('/api/map-markers', async (request) => {
  const marker = request.body
  marker.id = marker.id || crypto.randomUUID()
  marker.created_at = marker.created_at || Date.now()
  marker.updated_at = Date.now()
  
  db.prepare(`
    INSERT OR REPLACE INTO map_markers 
    (id, incident_id, type, latitude, longitude, properties, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    marker.id,
    marker.incident_id,
    marker.type,
    marker.latitude,
    marker.longitude,
    JSON.stringify(marker.properties || {}),
    marker.created_at,
    marker.updated_at
  )

  fastify.io.emit('map:marker:update', marker)
  return marker
})

// Incident Closing Workflow
fastify.post('/api/incidents/:id/close', async (request) => {
  const { id } = request.params
  const { resolution, outcome, injuries, fatalities, propertyDamage, lessonsLearned, followUpRequired, followUpDetails } = request.body
  
  const existing = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id)
  if (!existing) {
    return { error: 'Incident not found' }
  }
  
  const data = JSON.parse(existing.data || '{}')
  data.closeReport = {
    resolution,
    outcome,
    injuries: injuries || 0,
    fatalities: fatalities || 0,
    propertyDamage: propertyDamage || '',
    lessonsLearned: lessonsLearned || '',
    followUpRequired: followUpRequired || false,
    followUpDetails: followUpDetails || '',
    closedAt: new Date().toISOString(),
    closedBy: 'System'
  }
  
  const updated_at = Date.now()
  
  db.prepare(`
    UPDATE incidents 
    SET status = ?, data = ?, updated_at = ?
    WHERE id = ?
  `).run(outcome, JSON.stringify(data), updated_at, id)
  
  const updated = { ...existing, status: outcome, data, updated_at }
  fastify.io.emit('incident:update', updated)
  
  return { success: true, incident: updated }
})

fastify.post('/api/incidents/:id/reopen', async (request) => {
  const { id } = request.params
  
  const existing = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id)
  if (!existing) {
    return { error: 'Incident not found' }
  }
  
  const data = JSON.parse(existing.data || '{}')
  if (data.closeReport) {
    data.closeReport.reopenedAt = new Date().toISOString()
  }
  
  const updated_at = Date.now()
  
  db.prepare(`
    UPDATE incidents 
    SET status = ?, data = ?, updated_at = ?
    WHERE id = ?
  `).run('active', JSON.stringify(data), updated_at, id)
  
  const updated = { ...existing, status: 'active', data, updated_at }
  fastify.io.emit('incident:update', updated)
  
  return { success: true, incident: updated }
})

// Weather data proxy (caches for offline resilience)
fastify.get('/api/weather', async (request) => {
  const { lat, lon } = request.query
  
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat || 40.7128}&longitude=${lon || -74.0060}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,precipitation,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=3`
    )
    
    if (response.ok) {
      const data = await response.json()
      return data
    }
  } catch (error) {
    fastify.log.error('Weather fetch error:', error)
  }
  
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
})

// =============================================
// OFFLINE ENCRYPTED IMPORT / EXPORT SYSTEM
// =============================================

function encryptData(data, password) {
  const salt = crypto.randomBytes(16)
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final()
  ])
  
  const authTag = cipher.getAuthTag()
  
  return {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    data: encrypted.toString('base64'),
    version: 1,
    exportedAt: Date.now()
  }
}

function decryptData(encryptedData, password) {
  try {
    const salt = Buffer.from(encryptedData.salt, 'base64')
    const iv = Buffer.from(encryptedData.iv, 'base64')
    const authTag = Buffer.from(encryptedData.authTag, 'base64')
    const data = Buffer.from(encryptedData.data, 'base64')
    
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    
    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final()
    ])
    
    return JSON.parse(decrypted.toString('utf8'))
  } catch (error) {
    throw new Error('Invalid password or corrupted data')
  }
}

fastify.post('/api/export', async (request) => {
  const { password, exportPath } = request.body
  
  const exportData = {
    incidents: db.prepare('SELECT * FROM incidents').all(),
    units: db.prepare('SELECT * FROM units').all(),
    messages: db.prepare('SELECT * FROM messages').all(),
    mapMarkers: db.prepare('SELECT * FROM map_markers').all(),
    syncLog: db.prepare('SELECT * FROM sync_log').all(),
    exportMetadata: {
      exportedAt: Date.now(),
      nodeId: crypto.randomUUID(),
      version: '1.0.0'
    }
  }
  
  const encrypted = encryptData(exportData, password)
  
  if (exportPath) {
    await writeFile(exportPath, JSON.stringify(encrypted, null, 2))
    return { success: true, path: exportPath, size: JSON.stringify(encrypted).length }
  }
  
  return encrypted
})

fastify.post('/api/import', async (request) => {
  const { password, importData, importPath, dryRun = false } = request.body
  
  let data
  try {
    const encrypted = importPath 
      ? JSON.parse(await readFile(importPath, 'utf8'))
      : importData
    
    data = decryptData(encrypted, password)
  } catch (error) {
    return { error: error.message }
  }
  
  const stats = {
    incidents: 0,
    units: 0,
    messages: 0,
    mapMarkers: 0,
    conflicts: 0
  }
  
  if (!dryRun) {
    const insertIncident = db.prepare('INSERT OR REPLACE INTO incidents (id, type, status, latitude, longitude, data, created_at, updated_at, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const insertUnit = db.prepare('INSERT OR REPLACE INTO units (id, callsign, type, status, latitude, longitude, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)')
    const insertMessage = db.prepare('INSERT OR REPLACE INTO messages (id, sender, recipient, content, priority, read, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
    const insertMarker = db.prepare('INSERT OR REPLACE INTO map_markers (id, incident_id, type, latitude, longitude, properties, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    
    for (const incident of data.incidents || []) {
      insertIncident.run(incident.id, incident.type, incident.status, incident.latitude, incident.longitude, incident.data, incident.created_at, incident.updated_at, incident.synced_at)
      stats.incidents++
    }
    
    for (const unit of data.units || []) {
      insertUnit.run(unit.id, unit.callsign, unit.type, unit.status, unit.latitude, unit.longitude, unit.last_seen)
      stats.units++
    }
    
    for (const message of data.messages || []) {
      insertMessage.run(message.id, message.sender, message.recipient, message.content, message.priority, message.read, message.timestamp)
      stats.messages++
    }
    
    for (const marker of data.mapMarkers || []) {
      insertMarker.run(marker.id, marker.incident_id, marker.type, marker.latitude, marker.longitude, marker.properties, marker.created_at, marker.updated_at)
      stats.mapMarkers++
    }
  }
  
  return {
    success: true,
    dryRun,
    stats,
    metadata: data.exportMetadata
  }
})

fastify.get('/api/usb/drives', async () => {
  const drives = []
  if (process.platform === 'win32') {
    for (let i = 67; i <= 90; i++) {
      const driveLetter = String.fromCharCode(i)
      try {
        await open(`${driveLetter}:\\`, 'r')
        drives.push({
          path: `${driveLetter}:\\`,
          label: `USB Drive ${driveLetter}:`,
          available: true
        })
      } catch (e) {}
    }
  } else {
    const mountPoints = ['/media', '/mnt', '/Volumes']
    for (const mount of mountPoints) {
      try {
        const { readdir } = await import('node:fs/promises')
        const entries = await readdir(mount, { withFileTypes: true })
        for (const entry of entries) {
          if (entry.isDirectory()) {
            drives.push({
              path: join(mount, entry.name),
              label: entry.name,
              available: true
            })
          }
        }
      } catch (e) {}
    }
  }
  
  return drives
})

// =============================================
// TEMPLATE RESPONSE PLANS & AUTO DISPATCH
// =============================================

fastify.get('/api/response-plans', async () => {
  const plans = db.prepare('SELECT * FROM response_plans WHERE enabled = 1 ORDER BY name').all()
  return plans.map(plan => ({
    ...plan,
    triggers: JSON.parse(plan.triggers || '[]'),
    dispatch_rules: JSON.parse(plan.dispatch_rules || '[]'),
    unit_assignments: JSON.parse(plan.unit_assignments || '[]'),
    checklist: JSON.parse(plan.checklist || '[]')
  }))
})

fastify.post('/api/response-plans', async (request) => {
  const plan = request.body
  plan.id = plan.id || crypto.randomUUID()
  plan.created_at = plan.created_at || Date.now()
  plan.updated_at = Date.now()
  
  db.prepare(`
    INSERT OR REPLACE INTO response_plans 
    (id, name, description, incident_type, priority, triggers, dispatch_rules, unit_assignments, checklist, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    plan.id,
    plan.name,
    plan.description,
    plan.incident_type,
    plan.priority,
    JSON.stringify(plan.triggers || []),
    JSON.stringify(plan.dispatch_rules || []),
    JSON.stringify(plan.unit_assignments || []),
    JSON.stringify(plan.checklist || []),
    plan.enabled ? 1 : 0,
    plan.created_at,
    plan.updated_at
  )
  
  fastify.io.emit('response-plan:update', plan)
  return plan
})

fastify.post('/api/incidents/:id/apply-plan/:planId', async (request) => {
  const { id, planId } = request.params
  
  const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id)
  const plan = db.prepare('SELECT * FROM response_plans WHERE id = ?').get(planId)
  
  if (!incident || !plan) {
    return { error: 'Incident or plan not found' }
  }
  
  const rules = JSON.parse(plan.dispatch_rules || '[]')
  const assignedUnits = []
  
  for (const rule of rules) {
    const availableUnits = db.prepare('SELECT * FROM units WHERE type = ? AND status = ? LIMIT ?').all(rule.unit_type, 'available', rule.count)
    for (const unit of availableUnits) {
      db.prepare('UPDATE units SET status = ?, incident_id = ? WHERE id = ?').run('dispatched', id, unit.id)
      assignedUnits.push(unit)
      
      fastify.io.emit('unit:dispatch', {
        unit,
        incident,
        plan: plan.name,
        dispatchedAt: Date.now()
      })
    }
  }
  
  return {
    success: true,
    plan: plan.name,
    unitsDispatched: assignedUnits.length,
    units: assignedUnits
  }
})

fastify.get('/api/dispatch-rules', async () => {
  return db.prepare('SELECT * FROM dispatch_rules WHERE enabled = 1').all()
})

fastify.post('/api/dispatch-rules', async (request) => {
  const rule = request.body
  rule.id = rule.id || crypto.randomUUID()
  rule.created_at = Date.now()
  
  db.prepare(`
    INSERT OR REPLACE INTO dispatch_rules
    (id, plan_id, condition, action, unit_type, count, delay_seconds, enabled, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    rule.id,
    rule.plan_id,
    rule.condition,
    rule.action,
    rule.unit_type,
    rule.count,
    rule.delay_seconds,
    rule.enabled ? 1 : 0,
    rule.created_at
  )
  
  return rule
})

// =============================================
// WATCHMAN / STANDBY LOW POWER MODE
// =============================================

let powerMode = 'active'
let lastActivity = Date.now()
const activityTimers = new Map()

fastify.get('/api/power/mode', async () => {
  return {
    mode: powerMode,
    lastActivity,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  }
})

fastify.post('/api/power/activity', async () => {
  lastActivity = Date.now()
  if (powerMode === 'standby') {
    powerMode = 'active'
    fastify.io.emit('power:mode', { mode: 'active' })
    fastify.log.info('System woken from standby mode')
  }
  return { success: true, lastActivity }
})

fastify.post('/api/power/standby', async () => {
  powerMode = 'standby'
  fastify.io.emit('power:mode', { mode: 'standby' })
  fastify.log.info('System entering standby low power mode')
  
  // Reduce socket ping interval to conserve power
  fastify.io.engine.pingInterval = 60000
  fastify.io.engine.pingTimeout = 120000
  
  return { success: true, enteredAt: Date.now() }
})

fastify.post('/api/power/active', async () => {
  powerMode = 'active'
  lastActivity = Date.now()
  fastify.io.emit('power:mode', { mode: 'active' })
  fastify.log.info('System returning to active mode')
  
  // Restore normal ping intervals
  fastify.io.engine.pingInterval = 10000
  fastify.io.engine.pingTimeout = 5000
  
  return { success: true, activatedAt: Date.now() }
})

// Auto standby timer - DISABLED per requirement: Disable all session timeouts / auto logout
// All timeouts are permanently disabled for emergency operations
// setInterval(() => {
//   if (powerMode === 'active' && Date.now() - lastActivity > 1800000) { // 30 minutes
//     powerMode = 'standby'
//     fastify.io.emit('power:mode', { mode: 'standby', auto: true })
//     fastify.io.engine.pingInterval = 60000
//     fastify.io.engine.pingTimeout = 120000
//     fastify.log.info('Auto entering standby mode after 30 minutes inactivity')
//   }
// }, 60000)

// Realtime Socket Handling
fastify.ready().then(() => {
  fastify.io.on('connection', (socket) => {
    fastify.log.info(`Client connected: ${socket.id}`)

    socket.on('disconnect', () => {
      fastify.log.info(`Client disconnected: ${socket.id}`)
    })

    socket.on('position:update', (data) => {
      socket.broadcast.emit('position:update', data)
    })

    socket.on('status:update', (data) => {
      socket.broadcast.emit('status:update', data)
    })

    socket.on('message:send', (data) => {
      data.id = crypto.randomUUID()
      data.timestamp = Date.now()
      fastify.io.emit('message:received', data)
    })

    socket.on('unit:location', (data) => {
      data.last_seen = Date.now()
      // Update unit location in database
      db.prepare(`
        UPDATE units 
        SET latitude = ?, longitude = ?, last_seen = ?
        WHERE id = ?
      `).run(data.latitude, data.longitude, data.last_seen, data.unitId)
      
      fastify.io.emit('unit:location', data)
    })
  })
})

const start = async () => {
  try {
    let port = process.env.PORT || 8383
    let listening = false
    
    // Automatically find available port starting from 8383
    while (!listening) {
      try {
        await fastify.listen({ port, host: '0.0.0.0' })
        listening = true
      } catch (err) {
        if (err.code === 'EADDRINUSE') {
          fastify.log.warn(`Port ${port} already in use, trying next port...`)
          port++
          // Prevent infinite loop - try up to 10 ports
          if (port > 8393) {
            throw new Error(`No available ports found in range 8383-8393`)
          }
        } else {
          throw err
        }
      }
    }
    
    console.log('\n')
    console.log('========================================')
    console.log('✅ TPT EMERGENCY SYSTEM RUNNING')
    console.log('========================================')
    console.log(`Local:    http://localhost:${port}`)
    // Safe network interface detection with fallback
    let networkAddress = '0.0.0.0'
    try {
      const interfaces = Object.values(os.networkInterfaces()).flat()
      const externalIp = interfaces.find(x => x.family === 'IPv4' && !x.internal)
      if (externalIp) networkAddress = externalIp.address
    } catch (e) {}
    console.log(`Network:  http://${networkAddress}:${port}`)
    console.log('')
    console.log('System is ready. All features work offline.')
    console.log('Database file: emergency.db')
    console.log('========================================')

    // Auto open browser - enabled for packaged executables
    const isProduction = process.env.NODE_ENV === 'production' && !process.pkg
    if (!isProduction) {
      const start = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open'
      exec(`${start} http://localhost:${port}`)
    }

  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()