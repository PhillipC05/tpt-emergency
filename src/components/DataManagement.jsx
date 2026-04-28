import { createSignal, createEffect, onMount } from 'solid-js'
import { db } from '../lib/offline-db'

export function DataManagement() {
  const [showModal, setShowModal] = createSignal(false)
  const [backups, setBackups] = createSignal([])
  const [autoBackupEnabled, setAutoBackupEnabled] = createSignal(true)
  const [archiveDays, setArchiveDays] = createSignal(7)

  onMount(async () => {
    await loadBackups()
    const settings = await db.settings.get('auto_backup')
    if(settings) setAutoBackupEnabled(settings.value)
    
    const archiveSetting = await db.settings.get('auto_archive_days')
    if(archiveSetting) setArchiveDays(archiveSetting.value)
  })

  const loadBackups = async () => {
    const list = await db.backups.orderBy('created_at').reverse().limit(10).toArray()
    setBackups(list)
  }

  const exportData = async () => {
    const data = await db.exportFullData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tpt-emergency-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (e) => {
    const file = e.target.files[0]
    if(!file) return
    
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        await db.importFullData(ev.target.result)
        alert('Data imported successfully')
        window.location.reload()
      } catch(err) {
        alert('Import failed: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const createManualBackup = async () => {
    await db.createAutoBackup()
    await loadBackups()
  }

  const restoreBackup = async (backup) => {
    if(!confirm('Restore this backup? All current data will be replaced.')) return
    await db.importFullData(backup.data)
    window.location.reload()
  }

  const toggleAutoBackup = async () => {
    const newVal = !autoBackupEnabled()
    setAutoBackupEnabled(newVal)
    await db.settings.put({ key: 'auto_backup', value: newVal })
  }

  const saveArchiveDays = async () => {
    await db.settings.put({ key: 'auto_archive_days', value: parseInt(archiveDays()) })
    alert('Auto archive settings saved')
  }

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        class="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
        title="Data Management & Backups"
      >
        💾
      </button>

      {showModal() && (
        <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div class="bg-gray-800 rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 class="text-lg font-bold mb-4">💾 Data Management</h3>

            <div class="space-y-4">
              <div class="bg-gray-700/50 p-4 rounded-lg">
                <h4 class="font-medium mb-3">Backup & Restore</h4>
                <div class="flex gap-2">
                  <button onClick={exportData} class="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm">
                    ⬇️ Export All Data
                  </button>
                  <button onClick={createManualBackup} class="px-3 py-2 bg-green-600 hover:bg-green-500 rounded text-sm">
                    ✅ Create Backup
                  </button>
                  <label class="px-3 py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm cursor-pointer">
                    ⬆️ Import Data
                    <input type="file" accept=".json" class="hidden" onChange={importData} />
                  </label>
                </div>
              </div>

              <div class="bg-gray-700/50 p-4 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium">Automatic Hourly Backups</h4>
                  <button 
                    onClick={toggleAutoBackup}
                    class={`px-3 py-1 rounded text-sm ${autoBackupEnabled() ? 'bg-green-600' : 'bg-gray-600'}`}
                  >
                    {autoBackupEnabled() ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div class="text-xs text-gray-400">Last 24 backups are automatically retained</div>
              </div>

              <div class="bg-gray-700/50 p-4 rounded-lg">
                <h4 class="font-medium mb-3">Automatic Incident Archiving</h4>
                <div class="flex items-center gap-2">
                  <span class="text-sm">Auto archive closed incidents after:</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="90" 
                    value={archiveDays()} 
                    onInput={e => setArchiveDays(e.target.value)}
                    class="w-16 px-2 py-1 bg-gray-700 rounded text-center"
                  />
                  <span class="text-sm">days</span>
                  <button onClick={saveArchiveDays} class="px-2 py-1 bg-blue-600 rounded text-sm">Save</button>
                </div>
              </div>

              <div class="bg-gray-700/50 p-4 rounded-lg">
                <h4 class="font-medium mb-3">Stored Backups</h4>
                <div class="space-y-2 max-h-40 overflow-y-auto">
                  {backups().length === 0 ? (
                    <div class="text-sm text-gray-400">No backups created yet</div>
                  ) : (
                    backups().map(backup => (
                      <div class="flex items-center justify-between p-2 bg-gray-800 rounded text-sm">
                        <span>{new Date(backup.created_at).toLocaleString()}</span>
                        <div class="flex items-center gap-2">
                          <span class="text-xs text-gray-400">{Math.round(backup.size / 1024)} KB</span>
                          <button onClick={() => restoreBackup(backup)} class="px-2 py-1 bg-blue-600 rounded text-xs">Restore</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div class="mt-6 flex justify-end">
              <button onClick={() => setShowModal(false)} class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}