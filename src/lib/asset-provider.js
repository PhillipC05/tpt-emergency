/**
 * TPT Emergency - Generic Asset Provider Interface
 * 
 * Standard plugin interface for all external assets including:
 * - Drones / UAV Systems
 * - Robotics
 * - Remote Sensors
 * - Cameras
 * - Vehicles
 * - Aircraft
 * - Marine Assets
 * 
 * All manufacturer specific implementations must implement this interface.
 * Core system will never contain manufacturer specific code.
 */

export const ASSET_TYPES = {
  DRONE: 'drone',
  AIRCRAFT: 'aircraft',
  VEHICLE: 'vehicle',
  ROBOT: 'robot',
  SENSOR: 'sensor',
  CAMERA: 'camera',
  MARINE: 'marine',
  GENERIC: 'generic'
};

export const ASSET_STATUS = {
  OFFLINE: 'offline',
  STANDBY: 'standby',
  ACTIVE: 'active',
  ALERT: 'alert',
  ERROR: 'error',
  MISSION: 'mission'
};

/**
 * Base Asset Provider Interface
 * All asset plugins must extend and implement this class
 */
export class AssetProvider {
  /**
   * Provider metadata
   * Override this in your implementation
   */
  static metadata = {
    id: 'base-provider',
    name: 'Base Asset Provider',
    description: 'Base provider interface, do not use directly',
    version: '1.0.0',
    author: 'TPT Emergency',
    supportedTypes: []
  };

  constructor(config = {}) {
    this.config = config;
    this.connected = false;
    this.assets = new Map();
    this.subscribers = [];
    this.eventHandlers = new Map();
  }

  /**
   * Initialize the provider
   * @returns {Promise<boolean>} success
   */
  async initialize() {
    throw new Error('initialize() must be implemented by provider');
  }

  /**
   * Connect to asset backend / network
   * @returns {Promise<boolean>} success
   */
  async connect() {
    throw new Error('connect() must be implemented by provider');
  }

  /**
   * Disconnect from asset backend
   * @returns {Promise<boolean>} success
   */
  async disconnect() {
    throw new Error('disconnect() must be implemented by provider');
  }

  /**
   * Get list of all assets managed by this provider
   * @returns {Promise<Array>} Asset list
   */
  async getAssets() {
    return Array.from(this.assets.values());
  }

  /**
   * Get single asset by ID
   * @param {string} assetId 
   * @returns {Promise<Object|null>} Asset object
   */
  async getAsset(assetId) {
    return this.assets.get(assetId) || null;
  }

  /**
   * Send command to asset
   * @param {string} assetId 
   * @param {string} command 
   * @param {Object} payload 
   * @returns {Promise<any>} Command result
   */
  async sendCommand(assetId, command, payload = {}) {
    throw new Error('sendCommand() must be implemented by provider');
  }

  /**
   * Subscribe to asset updates
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Broadcast update event to all subscribers
   * @param {string} eventType 
   * @param {Object} data 
   */
  emit(eventType, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(eventType, data, this);
      } catch (e) {
        console.error(`Asset provider subscriber error:`, e);
      }
    });

    if (this.eventHandlers.has(eventType)) {
      this.eventHandlers.get(eventType).forEach(handler => {
        try {
          handler(data);
        } catch (e) {
          console.error(`Asset provider event handler error:`, e);
        }
      });
    }
  }

  /**
   * Register event handler for specific event
   * @param {string} event 
   * @param {Function} handler 
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Remove event handler
   * @param {string} event 
   * @param {Function} handler 
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Update asset state
   * @param {string} assetId 
   * @param {Object} updates 
   */
  updateAsset(assetId, updates) {
    const existing = this.assets.get(assetId) || {};
    const updated = {
      ...existing,
      ...updates,
      id: assetId,
      providerId: this.constructor.metadata.id,
      lastUpdate: Date.now()
    };

    this.assets.set(assetId, updated);
    this.emit('asset:update', updated);
    return updated;
  }

  /**
   * Get provider status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      connected: this.connected,
      assetCount: this.assets.size,
      metadata: this.constructor.metadata
    };
  }

  /**
   * Clean up provider resources
   */
  destroy() {
    this.subscribers = [];
    this.eventHandlers.clear();
    this.assets.clear();
    this.connected = false;
  }
}

/**
 * Asset Provider Registry
 * Manages all registered asset providers
 */
export class AssetProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.globalSubscribers = [];
  }

  /**
   * Register an asset provider
   * @param {AssetProvider} provider 
   */
  register(provider) {
    const metadata = provider.constructor.metadata;
    if (this.providers.has(metadata.id)) {
      console.warn(`Asset provider ${metadata.id} is already registered, overwriting`);
    }

    this.providers.set(metadata.id, provider);
    
    // Forward events to global subscribers
    provider.subscribe((event, data, sourceProvider) => {
      this.globalSubscribers.forEach(callback => {
        try {
          callback(event, data, sourceProvider);
        } catch (e) {
          console.error(`Global asset subscriber error:`, e);
        }
      });
    });

    console.log(`Registered asset provider: ${metadata.name} v${metadata.version}`);
    return provider;
  }

  /**
   * Unregister a provider
   * @param {string} providerId 
   */
  unregister(providerId) {
    if (this.providers.has(providerId)) {
      const provider = this.providers.get(providerId);
      provider.destroy();
      this.providers.delete(providerId);
      console.log(`Unregistered asset provider: ${providerId}`);
    }
  }

  /**
   * Get provider by ID
   * @param {string} providerId 
   * @returns {AssetProvider|null}
   */
  get(providerId) {
    return this.providers.get(providerId) || null;
  }

  /**
   * Get all registered providers
   * @returns {Array<AssetProvider>}
   */
  getAll() {
    return Array.from(this.providers.values());
  }

  /**
   * Get all assets across all providers
   * @returns {Promise<Array>}
   */
  async getAllAssets() {
    const allAssets = [];
    for (const provider of this.providers.values()) {
      try {
        const assets = await provider.getAssets();
        allAssets.push(...assets);
      } catch (e) {
        console.error(`Failed to get assets from provider:`, e);
      }
    }
    return allAssets;
  }

  /**
   * Subscribe to events from all providers
   * @param {Function} callback 
   * @returns {Function} Unsubscribe
   */
  subscribeAll(callback) {
    this.globalSubscribers.push(callback);
    return () => {
      this.globalSubscribers = this.globalSubscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Initialize all registered providers
   */
  async initializeAll() {
    const results = [];
    for (const provider of this.providers.values()) {
      try {
        const success = await provider.initialize();
        results.push({ provider, success });
      } catch (e) {
        console.error(`Failed to initialize provider:`, e);
        results.push({ provider, success: false, error: e });
      }
    }
    return results;
  }

  /**
   * Connect all registered providers
   */
  async connectAll() {
    const results = [];
    for (const provider of this.providers.values()) {
      try {
        const success = await provider.connect();
        results.push({ provider, success });
      } catch (e) {
        console.error(`Failed to connect provider:`, e);
        results.push({ provider, success: false, error: e });
      }
    }
    return results;
  }
}

// Global singleton registry instance
export const assetRegistry = new AssetProviderRegistry();

// Standard Asset Object Structure
/*
{
  id: string,
  providerId: string,
  type: ASSET_TYPES,
  name: string,
  status: ASSET_STATUS,
  
  position: {
    lat: number,
    lng: number,
    altitude: number,
    heading: number,
    speed: number
  },
  
  telemetry: {
    battery: number,
    signal: number,
    temperature: number,
    custom: {}
  },
  
  capabilities: string[],
  
  metadata: {
    model: string,
    serial: string,
    manufacturer: string,
    firmware: string
  },
  
  lastUpdate: number,
  lastSeen: number
}
*/

export default {
  AssetProvider,
  AssetProviderRegistry,
  assetRegistry,
  ASSET_TYPES,
  ASSET_STATUS
};