// Plugin Runtime - Sandboxed plugin execution environment
// Uses Web Worker for isolation

import type { PluginManifest, PluginHook, PluginInstance } from '../types/plugin';

export interface PluginRuntimeContext {
  pluginId: string;
  config: Record<string, any>;
  permissions: string[];
  // APIs exposed to plugins
  storage: StorageAPI;
  chat: ChatAPI;
  models: ModelsAPI;
  rag: RAGAPI;
  system: SystemAPI;
  mcp: MCPAPI;
}

export interface StorageAPI {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export interface ChatAPI {
  sendMessage: (content: string) => Promise<void>;
  onMessage: (callback: (message: any) => void) => void;
  modifyInput: (transform: (input: string) => string) => void;
}

export interface ModelsAPI {
  list: () => Promise<any[]>;
  call: (modelId: string, options: any) => Promise<any>;
}

export interface RAGAPI {
  search: (query: string, options?: any) => Promise<any[]>;
  listKnowledgeBases: () => Promise<any[]>;
}

export interface SystemAPI {
  clipboard: {
    read: () => Promise<string>;
    write: (text: string) => Promise<void>;
  };
  notification: (title: string, body?: string) => Promise<void>;
  openFile: () => Promise<string | null>;
  saveFile: (content: string, defaultName?: string) => Promise<string | null>;
}

export interface MCPAPI {
  listTools: () => Promise<any[]>;
  callTool: (toolName: string, args: any) => Promise<any>;
}

export interface HookEvent {
  type: PluginHook;
  payload: any;
  timestamp: number;
}

export type HookCallback = (event: HookEvent) => Promise<any> | any;

class PluginRuntime {
  private runtimes: Map<string, Worker> = new Map();
  private contexts: Map<string, PluginRuntimeContext> = new Map();
  private hookHandlers: Map<string, Map<PluginHook, HookCallback[]>> = new Map();
  
  // Event emitter for hooks
  private eventEmitter: Map<PluginHook, Set<(data: any) => Promise<any>>> = new Map();

  /**
   * Initialize plugin runtime with manifest and code
   */
  async loadPlugin(instance: PluginInstance): Promise<void> {
    const { manifest, config } = instance;
    
    // Create context for this plugin
    const context = this.createContext(manifest, config);
    this.contexts.set(manifest.id, context);
    
    // Register hook handlers from manifest
    if (manifest.hooks) {
      this.registerHooks(manifest.id, manifest.hooks);
    }
    
    console.log(`[PluginRuntime] Loaded plugin: ${manifest.name}`);
  }

  /**
   * Unload plugin and cleanup
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    // Cleanup runtime
    const worker = this.runtimes.get(pluginId);
    if (worker) {
      worker.terminate();
      this.runtimes.delete(pluginId);
    }
    
    // Cleanup context
    this.contexts.delete(pluginId);
    
    // Cleanup hook handlers
    this.hookHandlers.delete(pluginId);
    
    console.log(`[PluginRuntime] Unloaded plugin: ${pluginId}`);
  }

  /**
   * Execute a hook across all active plugins
   */
  async executeHook<T = any>(
    hook: PluginHook,
    payload: T
  ): Promise<any[]> {
    const results: any[] = [];
    
    // Get all plugins that have this hook registered
    for (const [pluginId, handlers] of this.hookHandlers) {
      const hooks = handlers.get(hook);
      if (hooks) {
        for (const callback of hooks) {
          try {
            const result = await callback({
              type: hook,
              payload,
              timestamp: Date.now(),
            });
            results.push({ pluginId, result });
          } catch (error) {
            console.error(`[PluginRuntime] Hook error in ${pluginId}:`, error);
            results.push({ pluginId, error: String(error) });
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Subscribe to global hook events (for built-in system hooks)
   */
  subscribeToHook(hook: PluginHook, callback: (data: any) => Promise<any>): () => void {
    if (!this.eventEmitter.has(hook)) {
      this.eventEmitter.set(hook, new Set());
    }
    this.eventEmitter.get(hook)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.get(hook)?.delete(callback);
    };
  }

  /**
   * Check if plugin has a specific permission
   */
  hasPermission(pluginId: string, permission: string): boolean {
    const context = this.contexts.get(pluginId);
    return context?.permissions.includes(permission) || false;
  }

  /**
   * Get plugin's runtime context
   */
  getContext(pluginId: string): PluginRuntimeContext | undefined {
    return this.contexts.get(pluginId);
  }

  /**
   * Create sandboxed context for plugin
   */
  private createContext(manifest: PluginManifest, config: Record<string, any>): PluginRuntimeContext {
    return {
      pluginId: manifest.id,
      config,
      permissions: manifest.permissions,
      storage: this.createStorageAPI(manifest.id),
      chat: this.createChatAPI(manifest.id),
      models: this.createModelsAPI(manifest.id),
      rag: this.createRAGAPI(manifest.id),
      system: this.createSystemAPI(manifest.id),
      mcp: this.createMCPAPI(manifest.id),
    };
  }

  private createStorageAPI(pluginId: string): StorageAPI {
    const prefix = `plugin_${pluginId}_`;
    return {
      get: async (key: string) => {
        if (!this.hasPermission(pluginId, 'storage:read')) {
          throw new Error('Permission denied: storage:read');
        }
        return localStorage.getItem(prefix + key);
      },
      set: async (key: string, value: any) => {
        if (!this.hasPermission(pluginId, 'storage:write')) {
          throw new Error('Permission denied: storage:write');
        }
        localStorage.setItem(prefix + key, JSON.stringify(value));
      },
      delete: async (key: string) => {
        if (!this.hasPermission(pluginId, 'storage:write')) {
          throw new Error('Permission denied: storage:write');
        }
        localStorage.removeItem(prefix + key);
      },
    };
  }

  private createChatAPI(pluginId: string): ChatAPI {
    return {
      sendMessage: async (content: string) => {
        if (!this.hasPermission(pluginId, 'chat:send-message')) {
          throw new Error('Permission denied: chat:send-message');
        }
        // Will be connected to actual chat system
        window.dispatchEvent(new CustomEvent('plugin:send-message', { 
          detail: { pluginId, content } 
        }));
      },
      onMessage: (callback: (message: any) => void) => {
        if (!this.hasPermission(pluginId, 'chat:receive-message')) {
          throw new Error('Permission denied: chat:receive-message');
        }
        window.addEventListener('plugin:message', (e: any) => {
          if (e.detail?.pluginId === pluginId || !e.detail?.pluginId) {
            callback(e.detail?.message);
          }
        });
      },
      modifyInput: (transform: (input: string) => string) => {
        if (!this.hasPermission(pluginId, 'chat:modify-input')) {
          throw new Error('Permission denied: chat:modify-input');
        }
        window.addEventListener('plugin:modify-input', (e: any) => {
          e.detail.input = transform(e.detail.input);
        }, { once: true });
      },
    };
  }

  private createModelsAPI(pluginId: string): ModelsAPI {
    return {
      list: async () => {
        // Dispatch event to get available models
        window.dispatchEvent(new CustomEvent('plugin:list-models', { 
          detail: { pluginId } 
        }));
        return [];
      },
      call: async (modelId: string, options: any) => {
        if (!this.hasPermission(pluginId, 'models:access')) {
          throw new Error('Permission denied: models:access');
        }
        window.dispatchEvent(new CustomEvent('plugin:call-model', { 
          detail: { pluginId, modelId, options } 
        }));
        return null;
      },
    };
  }

  private createRAGAPI(pluginId: string): RAGAPI {
    return {
      search: async (_query: string, _options?: any) => {
        if (!this.hasPermission(pluginId, 'rag:access-knowledge-base')) {
          throw new Error('Permission denied: rag:access-knowledge-base');
        }
        // Will be connected to actual RAG service
        return [];
      },
      listKnowledgeBases: async () => {
        if (!this.hasPermission(pluginId, 'rag:access-knowledge-base')) {
          throw new Error('Permission denied: rag:access-knowledge-base');
        }
        return [];
      },
    };
  }

  private createSystemAPI(pluginId: string): SystemAPI {
    return {
      clipboard: {
        read: async () => {
          if (!this.hasPermission(pluginId, 'system:clipboard')) {
            throw new Error('Permission denied: system:clipboard');
          }
          return navigator.clipboard.readText();
        },
        write: async (text: string) => {
          if (!this.hasPermission(pluginId, 'system:clipboard')) {
            throw new Error('Permission denied: system:clipboard');
          }
          return navigator.clipboard.writeText(text);
        },
      },
      notification: async (title: string, body?: string) => {
        if (!this.hasPermission(pluginId, 'system:notification')) {
          throw new Error('Permission denied: system:notification');
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body });
        }
      },
      openFile: async () => {
        if (!this.hasPermission(pluginId, 'system:file-system')) {
          throw new Error('Permission denied: system:file-system');
        }
        // File picker implementation would go here
        return null;
      },
      saveFile: async (_content: string, _defaultName?: string) => {
        if (!this.hasPermission(pluginId, 'system:file-system')) {
          throw new Error('Permission denied: system:file-system');
        }
        // File save implementation would go here
        return null;
      },
    };
  }

  private createMCPAPI(pluginId: string): MCPAPI {
    return {
      listTools: async () => {
        if (!this.hasPermission(pluginId, 'mcp:use-tools')) {
          throw new Error('Permission denied: mcp:use-tools');
        }
        return [];
      },
      callTool: async (_toolName: string, _args: any) => {
        if (!this.hasPermission(pluginId, 'mcp:use-tools')) {
          throw new Error('Permission denied: mcp:use-tools');
        }
        // Will be connected to actual MCP service
        return null;
      },
    };
  }

  /**
   * Register hooks from plugin manifest
   */
  private registerHooks(pluginId: string, hooks: PluginHook[]): void {
    if (!this.hookHandlers.has(pluginId)) {
      this.hookHandlers.set(pluginId, new Map());
    }
    
    const handlers = this.hookHandlers.get(pluginId)!;
    
    for (const hook of hooks) {
      if (!handlers.has(hook)) {
        handlers.set(hook, []);
      }
      // Add default handler that will be replaced by actual plugin code
      handlers.get(hook)!.push(async (event) => {
        console.log(`[PluginRuntime] ${pluginId} handled hook: ${hook}`, event.payload);
        return null;
      });
    }
  }
}

// Singleton instance
export const pluginRuntime = new PluginRuntime();

// Export for use in plugins
export default pluginRuntime;
