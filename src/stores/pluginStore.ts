import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PluginManifest,
  PluginInstance,
  PluginStatus,
  PluginPermission,
  MarketplacePlugin,
} from '../types/plugin';
import { EXAMPLE_PLUGINS } from '../types/plugin';

export interface PluginStoreState {
  // Installed plugins
  plugins: PluginInstance[];
  
  // Active plugin IDs for quick lookup
  activePluginIds: Set<string>;
  
  // Marketplace cache
  marketplaceCache: MarketplacePlugin[];
  lastMarketplaceUpdate: number;
  
  // Loading states
  installing: string | null;
  updating: string | null;
  uninstalling: string | null;
  
  // Error state
  error: string | null;
  
  // Actions
  installPlugin: (manifest: PluginManifest, code?: string) => Promise<string>;
  uninstallPlugin: (id: string) => Promise<void>;
  updatePlugin: (id: string, manifest: PluginManifest) => Promise<void>;
  activatePlugin: (id: string) => Promise<void>;
  deactivatePlugin: (id: string) => Promise<void>;
  setPluginConfig: (id: string, config: Record<string, any>) => void;
  setPluginError: (id: string, error: string | null) => void;
  
  // Marketplace
  refreshMarketplace: () => Promise<void>;
  searchMarketplace: (query: string) => MarketplacePlugin[];
  getFeaturedPlugins: () => MarketplacePlugin[];
  getTrendingPlugins: () => MarketplacePlugin[];
  getPluginsByCategory: (category: string) => MarketplacePlugin[];
  
  // Getters
  getActivePlugins: () => PluginInstance[];
  getPluginById: (id: string) => PluginInstance | undefined;
  hasPermission: (pluginId: string, permission: PluginPermission) => boolean;
  checkUpdateAvailable: (pluginId: string) => boolean;
}

export const usePluginStore = create<PluginStoreState>()(
  persist(
    (set, get) => ({
      plugins: [],
      activePluginIds: new Set(),
      marketplaceCache: [],
      lastMarketplaceUpdate: 0,
      installing: null,
      updating: null,
      uninstalling: null,
      error: null,

      // Install plugin
      installPlugin: async (manifest, code) => {
        set({ installing: manifest.id, error: null });
        
        try {
          // Simulate installation delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const instance: PluginInstance = {
            manifest,
            status: 'installed',
            config: getDefaultConfig(manifest),
            installedAt: Date.now(),
            updatedAt: Date.now(),
            size: code?.length || 0,
          };
          
          set((state) => ({
            plugins: [...state.plugins, instance],
            installing: null,
          }));
          
          return manifest.id;
        } catch (error) {
          set({ error: String(error), installing: null });
          throw error;
        }
      },

      // Uninstall plugin
      uninstallPlugin: async (id) => {
        set({ uninstalling: id, error: null });
        
        try {
          // Simulate uninstallation
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set((state) => ({
            plugins: state.plugins.filter((p) => p.manifest.id !== id),
            activePluginIds: new Set(
              Array.from(state.activePluginIds).filter((pid) => pid !== id)
            ),
            uninstalling: null,
          }));
        } catch (error) {
          set({ error: String(error), uninstalling: null });
          throw error;
        }
      },

      // Update plugin
      updatePlugin: async (id, newManifest) => {
        set({ updating: id, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set((state) => ({
            plugins: state.plugins.map((p) =>
              p.manifest.id === id
                ? {
                    ...p,
                    manifest: newManifest,
                    updatedAt: Date.now(),
                    status: p.status === 'active' ? 'active' : 'installed',
                  }
                : p
            ),
            updating: null,
          }));
        } catch (error) {
          set({ error: String(error), updating: null });
          throw error;
        }
      },

      // Activate plugin
      activatePlugin: async (id) => {
        try {
          // Simulate loading plugin runtime
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set((state) => ({
            plugins: state.plugins.map((p) =>
              p.manifest.id === id ? { ...p, status: 'active', error: undefined } : p
            ),
            activePluginIds: new Set([...state.activePluginIds, id]),
          }));
        } catch (error) {
          set((state) => ({
            plugins: state.plugins.map((p) =>
              p.manifest.id === id ? { ...p, status: 'error', error: String(error) } : p
            ),
          }));
          throw error;
        }
      },

      // Deactivate plugin
      deactivatePlugin: async (id) => {
        set((state) => ({
          plugins: state.plugins.map((p) =>
            p.manifest.id === id ? { ...p, status: 'inactive' } : p
          ),
          activePluginIds: new Set(
            Array.from(state.activePluginIds).filter((pid) => pid !== id)
          ),
        }));
      },

      // Set plugin configuration
      setPluginConfig: (id, config) => {
        set((state) => ({
          plugins: state.plugins.map((p) =>
            p.manifest.id === id ? { ...p, config: { ...p.config, ...config } } : p
          ),
        }));
      },

      // Set plugin error
      setPluginError: (id, error) => {
        set((state) => ({
          plugins: state.plugins.map((p) =>
            p.manifest.id === id ? { ...p, error: error || undefined } : p
          ),
        }));
      },

      // Marketplace
      refreshMarketplace: async () => {
        // Simulate fetching from marketplace API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { plugins } = get();
        const installedIds = new Set(plugins.map((p) => p.manifest.id));
        
        const marketplacePlugins: MarketplacePlugin[] = EXAMPLE_PLUGINS.map((manifest) => ({
          manifest,
          downloads: Math.floor(Math.random() * 10000),
          rating: 4 + Math.random(),
          reviewCount: Math.floor(Math.random() * 500),
          featured: Math.random() > 0.7,
          trending: Math.random() > 0.8,
          installed: installedIds.has(manifest.id),
        }));
        
        set({
          marketplaceCache: marketplacePlugins,
          lastMarketplaceUpdate: Date.now(),
        });
      },

      searchMarketplace: (query) => {
        const { marketplaceCache } = get();
        const lowerQuery = query.toLowerCase();
        return marketplaceCache.filter(
          (p) =>
            p.manifest.name.toLowerCase().includes(lowerQuery) ||
            p.manifest.description.toLowerCase().includes(lowerQuery) ||
            p.manifest.keywords.some((k) => k.toLowerCase().includes(lowerQuery))
        );
      },

      getFeaturedPlugins: () => {
        return get().marketplaceCache.filter((p) => p.featured);
      },

      getTrendingPlugins: () => {
        return get().marketplaceCache.filter((p) => p.trending);
      },

      getPluginsByCategory: (category) => {
        return get().marketplaceCache.filter((p) =>
          p.manifest.categories.includes(category as any)
        );
      },

      // Getters
      getActivePlugins: () => {
        return get().plugins.filter((p) => p.status === 'active');
      },

      getPluginById: (id) => {
        return get().plugins.find((p) => p.manifest.id === id);
      },

      hasPermission: (pluginId, permission) => {
        const plugin = get().getPluginById(pluginId);
        return plugin?.manifest.permissions.includes(permission) || false;
      },

      checkUpdateAvailable: (pluginId) => {
        const plugin = get().getPluginById(pluginId);
        if (!plugin) return false;
        
        // Check if newer version exists in marketplace
        const marketplacePlugin = get().marketplaceCache.find(
          (p) => p.manifest.id === pluginId
        );
        if (!marketplacePlugin) return false;
        
        return marketplacePlugin.manifest.version !== plugin.manifest.version;
      },
    }),
    {
      name: 'nexusai-plugins',
      partialize: (state) => ({
        plugins: state.plugins.map((p) => ({
          ...p,
          runtime: undefined, // Don't persist runtime
        })),
        activePluginIds: Array.from(state.activePluginIds),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert activePluginIds back to Set
          state.activePluginIds = new Set(state.activePluginIds as any);
        }
      },
    }
  )
);

// Helper functions
function getDefaultConfig(manifest: PluginManifest): Record<string, any> {
  if (!manifest.configSchema?.properties) return {};
  
  const config: Record<string, any> = {};
  for (const [key, prop] of Object.entries(manifest.configSchema.properties)) {
    if (prop.default !== undefined) {
      config[key] = prop.default;
    }
  }
  return config;
}

// Plugin runtime sandbox
export class PluginRuntime {
  private pluginId: string;
  private manifest: PluginManifest;
  private code: string;
  private sandbox: any;

  constructor(pluginId: string, manifest: PluginManifest, code: string) {
    this.pluginId = pluginId;
    this.manifest = manifest;
    this.code = code;
    this.sandbox = this.createSandbox();
  }

  private createSandbox() {
    // Create a restricted execution context
    // In a real implementation, this would use Web Workers or iframe
    return {
      console: {
        log: (...args: any[]) => console.log(`[${this.pluginId}]`, ...args),
        error: (...args: any[]) => console.error(`[${this.pluginId}]`, ...args),
        warn: (...args: any[]) => console.warn(`[${this.pluginId}]`, ...args),
      },
      // Plugin API will be injected here
    };
  }

  async load(): Promise<void> {
    // Simulate loading plugin code
    console.log(`Loading plugin: ${this.manifest.name}`);
  }

  unload(): void {
    console.log(`Unloading plugin: ${this.manifest.name}`);
  }

  executeHook(hook: string, context: any): any {
    // Execute plugin hooks
    return context;
  }
}

// Global plugin registry
export const pluginRegistry = {
  runtimes: new Map<string, PluginRuntime>(),
  
  async loadPlugin(pluginId: string, manifest: PluginManifest, code: string) {
    const runtime = new PluginRuntime(pluginId, manifest, code);
    await runtime.load();
    this.runtimes.set(pluginId, runtime);
    return runtime;
  },
  
  unloadPlugin(pluginId: string) {
    const runtime = this.runtimes.get(pluginId);
    if (runtime) {
      runtime.unload();
      this.runtimes.delete(pluginId);
    }
  },
  
  getRuntime(pluginId: string) {
    return this.runtimes.get(pluginId);
  },
};
