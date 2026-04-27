import Dexie from 'dexie'

export class OfflineDB extends Dexie {
  constructor() {
    super('tpt-emergency')
    
    this.version(2).stores({
      incidents: 'id, type, status, created_at, incident_number',
      units: 'id, callsign, type, status, last_seen, battery_level',
      sync_log: '++id, table_name, record_id, timestamp',
      settings: 'key',
      alarms: '++id, type, unit_id, created_at, acknowledged',
      timers: '++id, incident_id, name, start_time, end_time',
      ics_roles: '++id, incident_id, role, person_id, assigned_at',
      undo_log: '++id, action, timestamp, data'
    })
  }

  async getPendingSync() {
    return await this.sync_log.where('synced').equals(0).toArray()
  }

  async markSynced(ids) {
    return await this.sync_log.bulkUpdate(ids.map(id => ({
      id,
      synced: 1,
      synced_at: Date.now()
    })))
  }

  async queueForSync(tableName, recordId, operation) {
    return await this.sync_log.add({
      table_name: tableName,
      record_id: recordId,
      operation,
      timestamp: Date.now(),
      synced: 0
    })
  }
}

// Create and export singleton database instance
export const db = new OfflineDB()
export default db
