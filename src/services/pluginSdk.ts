/**
 * NexusAI Plugin SDK
 * 
 * This SDK provides a unified API for plugins to interact with the NexusAI host application.
 * 
 * @example
 * ```typescript
 * import { NexusAIPlugin } from '@nexusai/plugin-sdk';
 * 
 * const plugin = new NexusAIPlugin({
 *   manifest: {
 *     id: 'my-plugin',
 *     name: 'My Plugin',
 *     version: '1.0.0',
 *     // ... manifest fields
 *   },
 *   hooks: {
 *     'before-message-send': async (event) => {
 *       // Transform message before sending
 *       return event.payload;
 *     }
 *   }
 * });
 * 
 * plugin.register();
 * ```
 */

import type { PluginManifest, PluginHook } from '../types/plugin';

// Re-export types for convenience
export type { PluginManifest, PluginHook } from '../types/plugin';

/**
 * Plugin configuration
 */
export interface PluginConfig {
  manifest: PluginManifest;
  hooks?: Partial<Record<PluginHook, HookHandler>>;
  onError?: (error: Error) => void;
}

export type HookHandler = (event: HookEvent) => Promise<any> | any;

export interface HookEvent {
  type: PluginHook;
  payload: any;
  timestamp: number;
}

/**
 * Main Plugin class
 */
export class NexusAIPlugin {
  private manifest: PluginManifest;
  private hooks: Partial<Record<PluginHook, HookHandler>>;
  private onError?: (error: Error) => void;
  private registered: boolean = false;

  constructor(config: PluginConfig) {
    this.manifest = config.manifest;
    this.hooks = config.hooks || {};
    this.onError = config.onError;
  }

  /**
   * Register this plugin with the host application
   */
  async register(): Promise<void> {
    if (this.registered) {
      throw new Error('Plugin already registered');
    }

    try {
      // Dispatch registration event
      const event = new CustomEvent('plugin:register', {
        detail: {
          manifest: this.manifest,
          hooks: Object.keys(this.hooks),
        },
      });
      window.dispatchEvent(event);

      // Register hook handlers
      for (const [hookName, handler] of Object.entries(this.hooks)) {
        if (handler) {
          this.registerHookHandler(hookName as PluginHook, handler);
        }
      }

      this.registered = true;
      console.log(`[NexusAIPlugin] Registered: ${this.manifest.name} v${this.manifest.version}`);
    } catch (error) {
      this.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Unregister this plugin from the host application
   */
  async unregister(): Promise<void> {
    if (!this.registered) {
      return;
    }

    const event = new CustomEvent('plugin:unregister', {
      detail: { pluginId: this.manifest.id },
    });
    window.dispatchEvent(event);

    this.registered = false;
    console.log(`[NexusAIPlugin] Unregistered: ${this.manifest.name}`);
  }

  /**
   * Get plugin's runtime context
   */
  async getContext(): Promise<PluginContext> {
    const event = new CustomEvent('plugin:get-context', {
      detail: { pluginId: this.manifest.id },
    });
    window.dispatchEvent(event);

    // Return promise that resolves with context (will be filled by host)
    return new Promise((resolve) => {
      const handler = (e: any) => {
        if (e.detail?.pluginId === this.manifest.id) {
          window.removeEventListener('plugin:context', handler);
          resolve(e.detail.context);
        }
      };
      window.addEventListener('plugin:context', handler);
      setTimeout(() => resolve(this.createDefaultContext()), 5000);
    });
  }

  /**
   * Register a hook handler
   */
  private registerHookHandler(hook: PluginHook, handler: HookHandler): void {
    const event = new CustomEvent('plugin:register-hook', {
      detail: {
        pluginId: this.manifest.id,
        hook,
        handler: handler.toString(), // Serialize function
      },
    });
    window.dispatchEvent(event);
  }

  /**
   * Create default context for offline use
   */
  private createDefaultContext(): PluginContext {
    return {
      storage: {
        get: async () => null,
        set: async () => {},
        delete: async () => {},
      },
    };
  }

  /**
   * Get manifest
   */
  getManifest(): PluginManifest {
    return this.manifest;
  }

  /**
   * Check if plugin is registered
   */
  isRegistered(): boolean {
    return this.registered;
  }
}

/**
 * Plugin context interface
 */
interface PluginContext {
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  // Add more context APIs as needed
}

/**
 * Helper to create a plugin manifest
 */
export function createManifest(partial: Partial<PluginManifest>): PluginManifest {
  return {
    id: partial.id || '',
    name: partial.name || '',
    version: partial.version || '1.0.0',
    description: partial.description || '',
    author: partial.author || '',
    license: partial.license || 'MIT',
    keywords: partial.keywords || [],
    categories: partial.categories || [],
    engines: partial.engines || { nexusai: '>=1.0.0' },
    main: partial.main || 'index.js',
    permissions: partial.permissions || [],
    ...partial,
  };
}

/**
 * Built-in hook utilities
 */
export const hooks = {
  /**
   * Create a before-message-send hook
   */
  beforeMessageSend: (transform: (message: string) => string | Promise<string>) => {
    return async (event: HookEvent) => {
      if (event.type === 'before-message-send') {
        return await transform(event.payload.content);
      }
      return event.payload;
    };
  },

  /**
   * Create an after-message-receive hook
   */
  afterMessageReceive: (handler: (message: any) => any) => {
    return async (event: HookEvent) => {
      if (event.type === 'after-message-receive') {
        return handler(event.payload);
      }
      return event.payload;
    };
  },
};

/**
 * Storage helper for plugins
 */
export class PluginStorage {
  constructor(private prefix: string = '') {}

  async get<T>(key: string): Promise<T | null> {
    const fullKey = `${this.prefix}${key}`;
    const value = localStorage.getItem(fullKey);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    localStorage.setItem(fullKey, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    localStorage.removeItem(fullKey);
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    keys.forEach(k => localStorage.removeItem(k));
  }
}

/**
 * Event emitter for plugin communication
 */
export class PluginEvents {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  off(event: string, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(callback);
    }
  }
}

// Export singleton events
export const events = new PluginEvents();

// Default export
export default NexusAIPlugin;
