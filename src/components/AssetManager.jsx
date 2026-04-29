import { createSignal, createEffect, onMount, onCleanup, For } from 'solid-js'
import { assetRegistry, ASSET_TYPES, ASSET_STATUS } from '../lib/asset-provider.js'
import ExampleDroneProvider from '../lib/providers/example-drone-provider.js'

export function AssetManager() {
  const [assets, setAssets] = createSignal([])
  const [providers, setProviders] = createSignal([])
  const [showAddForm, setShowAddForm] = createSignal(false)
  const [selectedAsset, setSelectedAsset] = createSignal(null)
  let unsubscribeGlobal = null

  const [newAsset, setNewAsset] = createSignal({
    name: '',
    type: ASSET_TYPES.DRONE,
    position: { lat: -36.8485, lng: 174.7633, altitude: 0 },
    telemetry: { battery: 100, signal: 100 }
  })

  onMount(async () => {
    updateProviderList()
    updateAssetList()

    unsubscribeGlobal = assetRegistry.subscribeAll(() => {
      updateAssetList()
      updateProviderList()
    })
  })

  onCleanup(() => {
    if (unsubscribeGlobal) unsubscribeGlobal()
  })

  async function updateAssetList() {
    const allAssets = await assetRegistry.getAllAssets()
    setAssets(allAssets)
  }

  function updateProviderList() {
    setProviders(assetRegistry.getAll().map(p => p.getStatus()))
  }

  async function createAsset() {
    // For manually added assets we use the example provider
    const provider = assetRegistry.get('example-drone')
    if (!provider) {
      // Auto register example provider if not present
      const droneProvider = new ExampleDroneProvider({ simulated: true })
      assetRegistry.register(droneProvider)
      await droneProvider.initialize()
      await droneProvider.connect()
    }

    setShowAddForm(false)
    setNewAsset({
      name: '',
      type: ASSET_TYPES.DRONE,
      position: { lat: -36.8485, lng: 174.7633, altitude: 0 },
      telemetry: { battery: 100, signal: 100 }
    })
  }

  async function sendAssetCommand(asset, command, payload = {}) {
    const provider = assetRegistry.get(asset.providerId)
    if (provider) {
      await provider.sendCommand(asset.id, command, payload)
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case ASSET_STATUS.ACTIVE: return 'bg-green-500'
      case ASSET_STATUS.MISSION: return 'bg-blue-500'
      case ASSET_STATUS.STANDBY: return 'bg-yellow-500'
      case ASSET_STATUS.ALERT: return 'bg-orange-500'
      case ASSET_STATUS.ERROR: return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div class="p-4">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Asset Manager</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm())}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          + Add Asset
        </button>
      </div>

      {showAddForm() && (
        <div class="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 class="font-bold mb-4">Add New Asset</h3>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Asset Name</label>
              <input
                type="text"
                value={newAsset().name}
                onInput={(e) => setNewAsset({ ...newAsset(), name: e.target.value })}
                class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Asset Type</label>
              <select
                value={newAsset().type}
                onChange={(e) => setNewAsset({ ...newAsset(), type: e.target.value })}
                class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              >
                <For each={Object.entries(ASSET_TYPES)}>
                  {([key, value]) => <option value={value}>{key}</option>}
                </For>
              </select>
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <button onClick={() => setShowAddForm(false)} class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
              Cancel
            </button>
            <button onClick={createAsset} class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg">
              Create Asset
            </button>
          </div>
        </div>
      )}

      <div class="mb-8">
        <h3 class="font-bold mb-3 text-gray-400 uppercase text-sm">Connected Providers</h3>
        <div class="grid grid-cols-2 gap-3">
          <For each={providers()}>
            {(provider) => (
              <div class="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <div class="font-medium">{provider.metadata.name}</div>
                  <div class="text-xs text-gray-400">{provider.metadata.description}</div>
                </div>
                <div class="flex items-center gap-2">
                  <div class={`w-2 h-2 rounded-full ${provider.connected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <div class="text-sm text-gray-400">{provider.assetCount} assets</div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      <h3 class="font-bold mb-3 text-gray-400 uppercase text-sm">Active Assets ({assets().length})</h3>
      
      <div class="space-y-3">
        <For each={assets()}>
          {(asset) => (
            <div class={`bg-gray-800 rounded-lg p-4 ${selectedAsset()?.id === asset.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelectedAsset(asset)}>
              <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3">
                  <div class={`w-3 h-3 rounded-full ${getStatusColor(asset.status)}`}></div>
                  <div>
                    <div class="font-bold">{asset.name}</div>
                    <div class="text-xs text-gray-400 uppercase">{asset.type}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm">🔋 {Math.round(asset.telemetry.battery)}%</div>
                  <div class="text-xs text-gray-400">📶 {Math.round(asset.telemetry.signal)}%</div>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2 text-xs text-gray-400 mb-3">
                <div>Alt: <span class="text-white">{Math.round(asset.position.altitude)}m</span></div>
                <div>Speed: <span class="text-white">{Math.round(asset.position.speed)} m/s</span></div>
                <div>Heading: <span class="text-white">{Math.round(asset.position.heading)}°</span></div>
              </div>

              {selectedAsset()?.id === asset.id && asset.type === ASSET_TYPES.DRONE && (
                <div class="flex gap-2 flex-wrap pt-2 border-t border-gray-700">
                  <button onClick={() => sendAssetCommand(asset, 'takeoff')} class="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm">
                    Takeoff
                  </button>
                  <button onClick={() => sendAssetCommand(asset, 'land')} class="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded text-sm">
                    Land
                  </button>
                  <button onClick={() => sendAssetCommand(asset, 'rtl')} class="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded text-sm">
                    Return Home
                  </button>
                  <button onClick={() => sendAssetCommand(asset, 'hold')} class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                    Hold
                  </button>
                </div>
              )}
            </div>
          )}
        </For>

        {assets().length === 0 && (
          <div class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">🛸</div>
            <div>No active assets</div>
            <div class="text-sm">Click Add Asset to create your first asset</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AssetManager