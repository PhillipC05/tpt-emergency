import Dexie from 'dexie'

export class OfflineDB extends Dexie {
  constructor() {
    super('tpt-emergency')
    
    this.version(3).stores({
      incidents: 'id, type, status, created_at, incident_number, archived_at',
      units: 'id, callsign, type, status, last_seen, battery_level',
      sync_log: '++id, table_name, record_id, timestamp',
      settings: 'key',
      alarms: '++id, type, unit_id, created_at, acknowledged',
      timers: '++id, incident_id, name, start_time, end_time',
      ics_roles: '++id, incident_id, role, person_id, assigned_at',
      undo_log: '++id, action, timestamp, data',
      backups: '++id, created_at, size'
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

  async exportFullData() {
    const data = {
      export_time: Date.now(),
      version: 3,
      incidents: await this.incidents.toArray(),
      units: await this.units.toArray(),
      alarms: await this.alarms.toArray(),
      timers: await this.timers.toArray(),
      ics_roles: await this.ics_roles.toArray(),
      settings: await this.settings.toArray(),
      sync_log: await this.sync_log.toArray(),
      undo_log: await this.undo_log.toArray()
    }
    return JSON.stringify(data, null, 2)
  }

  async importFullData(jsonData) {
    const data = JSON.parse(jsonData)
    await this.transaction('rw', this.tables, async () => {
      await this.incidents.clear()
      await this.units.clear()
      await this.alarms.clear()
      await this.timers.clear()
      await this.ics_roles.clear()
      await this.settings.clear()
      await this.sync_log.clear()
      await this.undo_log.clear()

      if(data.incidents) await this.incidents.bulkAdd(data.incidents)
      if(data.units) await this.units.bulkAdd(data.units)
      if(data.alarms) await this.alarms.bulkAdd(data.alarms)
      if(data.timers) await this.timers.bulkAdd(data.timers)
      if(data.ics_roles) await this.ics_roles.bulkAdd(data.ics_roles)
      if(data.settings) await this.settings.bulkAdd(data.settings)
      if(data.sync_log) await this.sync_log.bulkAdd(data.sync_log)
      if(data.undo_log) await this.undo_log.bulkAdd(data.undo_log)
    })
    return true
  }

  async createAutoBackup() {
    const data = await this.exportFullData()
    const backupId = await this.backups.add({
      created_at: Date.now(),
      size: data.length,
      data: data
    })

    // Keep only last 24 backups
    const allBackups = await this.backups.orderBy('created_at').reverse().toArray()
    if(allBackups.length > 24) {
      const toDelete = allBackups.slice(24).map(b => b.id)
      await this.backups.bulkDelete(toDelete)
    }

    return backupId
  }
}

// Create and export singleton database instance
export const db = new OfflineDB()
export default db
