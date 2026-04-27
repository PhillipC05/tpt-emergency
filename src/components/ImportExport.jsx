// src/components/ImportExport.jsx
import { createSignal, createEffect } from 'solid-js'

export function ImportExport() {
  const [showModal, setShowModal] = createSignal(false)
  const [activeTab, setActiveTab] = createSignal('export')
  const [password, setPassword] = createSignal('')
  const [confirmPassword, setConfirmPassword] = createSignal('')
  const [drives, setDrives] = useState([])
  const [selectedDrive, setSelectedDrive] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [importFile, setImportFile] = useState(null)

  const loadDrives = async () => {
    try {
      const res = await fetch('/api/usb/drives')
      setDrives(await res.json())
    } catch (e) {
      setDrives([])
    }
  }

  createEffect(() => {
    if (showModal()) {
      loadDrives()
    }
  })

  const handleExport = async () => {
    if (password() !== confirmPassword()) {
      setResult({ error: 'Passwords do not match' })
      return
    }

    setLoading(true)
    try {
      const exportPath = selectedDrive() 
        ? `${selectedDrive().path}/tpt-emergency-backup-${Date.now()}.enc`
        : null

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: password(),
          exportPath
        })
      })

      const data = await res.json()
      
      if (data.error) {
        setResult({ error: data.error })
      } else if (exportPath) {
        setResult({ success: true, message: `Export successful! File saved to ${exportPath}` })
      } else {
        // Download file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tpt-emergency-backup-${Date.now()}.enc`
        a.click()
        setResult({ success: true, message: 'Backup file downloaded' })
      }
    } catch (e) {
      setResult({ error: 'Export failed' })
    }
    setLoading(false)
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      let importData = null
      if (importFile()) {
        const text = await importFile().text()
        importData = JSON.parse(text)
      }

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: password(),
          importData,
          dryRun: false
        })
      })

      const data = await res.json()
      
      if (data.error) {
        setResult({ error: data.error })
      } else {
        setResult({ 
          success: true, 
          message: `Import successful! ${data.stats.incidents} incidents, ${data.stats.units} units imported` 
        })
      }
    } catch (e) {
      setResult({ error: 'Import failed' })
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        class="flex items-center gap-2 px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
      >
        💾 Import / Export
      </button>

      {showModal() && (
        <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div class="bg-gray-800 rounded-lg w-full max-w-md p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold">Data Import / Export</h2>
              <button onClick={() => setShowModal(false)} class="text-gray-400 hover:text-white">✕</button>
            </div>

            <div class="flex border-b border-gray-700 mb-4">
              <button
                onClick={() => setActiveTab('export')}
                class={`px-4 py-2 ${activeTab() === 'export' ? 'border-b-2 border-blue-500' : 'text-gray-400'}`}
              >
                Export
              </button>
              <button
                onClick={() => setActiveTab('import')}
                class={`px-4 py-2 ${activeTab() === 'import' ? 'border-b-2 border-blue-500' : 'text-gray-400'}`}
              >
                Import
              </button>
            </div>

            {activeTab() === 'export' && (
              <div class="space-y-4">
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Encryption Password</label>
                  <input 
                    type="password" 
                    value={password()}
                    onInput={e => setPassword(e.target.value)}
                    class="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Enter encryption password"
                  />
                </div>
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Confirm Password</label>
                  <input 
                    type="password"
                    value={confirmPassword()}
                    onInput={e => setConfirmPassword(e.target.value)}
                    class="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Confirm password"
                  />
                </div>

                {drives().length > 0 && (
                  <div>
                    <label class="block text-sm text-gray-400 mb-1">USB Drives</label>
                    <div class="space-y-2">
                      {drives().map(drive => (
                        <button
                          onClick={() => setSelectedDrive(selectedDrive()?.path === drive.path ? null : drive)}
                          class={`w-full text-left px-3 py-2 rounded ${selectedDrive()?.path === drive.path ? 'bg-blue-600' : 'bg-gray-700'}`}
                        >
                          💾 {drive.label} ({drive.path})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleExport}
                  disabled={loading() || !password()}
                  class="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded py-2 font-medium"
                >
                  {loading() ? 'Exporting...' : 'Export Backup'}
                </button>
              </div>
            )}

            {activeTab() === 'import' && (
              <div class="space-y-4">
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Backup File</label>
                  <input 
                    type="file"
                    accept=".enc,.json"
                    onChange={e => setImportFile(e.target.files[0])}
                    class="w-full bg-gray-700 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Decryption Password</label>
                  <input 
                    type="password"
                    value={password()}
                    onInput={e => setPassword(e.target.value)}
                    class="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Enter decryption password"
                  />
                </div>

                <button 
                  onClick={handleImport}
                  disabled={loading() || !password() || !importFile()}
                  class="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded py-2 font-medium"
                >
                  {loading() ? 'Importing...' : 'Import Backup'}
                </button>
              </div>
            )}

            {result() && (
              <div class={`mt-4 p-3 rounded ${result().error ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                {result().error || result().message}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}