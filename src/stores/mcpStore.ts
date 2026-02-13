import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  MCPServerConfig,
  MCPServerStatus,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPToolPermission,
  ToolPermission,
} from '../types/mcp';
import { BUILTIN_MCP_SERVERS } from '../types/mcp';

export interface MCPStoreState {
  // Servers configuration
  servers: MCPServerConfig[];
  
  // Runtime statuses
  statuses: Record<string, MCPServerStatus>;
  
  // Tool permissions
  toolPermissions: MCPToolPermission[];
  
  // Global settings
  globalAutoApprove: boolean;
  
  // Actions
  addServer: (server: Omit<MCPServerConfig, 'id'>) => string;
  updateServer: (id: string, updates: Partial<MCPServerConfig>) => void;
  removeServer: (id: string) => void;
  toggleServer: (id: string) => void;
  
  // Status management
  updateServerStatus: (id: string, status: Partial<MCPServerStatus>) => void;
  setServerConnected: (id: string, connected: boolean, error?: string) => void;
  setServerTools: (id: string, tools: MCPTool[]) => void;
  setServerResources: (id: string, resources: MCPResource[]) => void;
  setServerPrompts: (id: string, prompts: MCPPrompt[]) => void;
  clearServerStatus: (id: string) => void;
  
  // Permission management
  setToolPermission: (toolName: string, serverId: string, permission: ToolPermission) => void;
  getToolPermission: (toolName: string, serverId: string) => ToolPermission;
  setGlobalAutoApprove: (autoApprove: boolean) => void;
  
  // Getters
  getEnabledServers: () => MCPServerConfig[];
  getAllTools: () => MCPTool[];
  getAllResources: () => MCPResource[];
  getAllPrompts: () => MCPPrompt[];
  getConnectedServers: () => MCPServerStatus[];
}

export const useMCPStore = create<MCPStoreState>()(
  persist(
    (set, get) => ({
      // Initialize with built-in servers
      servers: [...BUILTIN_MCP_SERVERS],
      statuses: {},
      toolPermissions: [],
      globalAutoApprove: false,

      // Server CRUD
      addServer: (server) => {
        const id = `mcp_${Date.now()}`;
        const newServer: MCPServerConfig = {
          ...server,
          id,
        };
        set((state) => ({
          servers: [...state.servers, newServer],
        }));
        return id;
      },

      updateServer: (id, updates) => {
        set((state) => ({
          servers: state.servers.map((server) =>
            server.id === id ? { ...server, ...updates } : server
          ),
        }));
      },

      removeServer: (id) => {
        set((state) => ({
          servers: state.servers.filter((server) => server.id !== id),
          statuses: Object.fromEntries(
            Object.entries(state.statuses).filter(([key]) => key !== id)
          ),
        }));
      },

      toggleServer: (id) => {
        set((state) => ({
          servers: state.servers.map((server) =>
            server.id === id ? { ...server, enabled: !server.enabled } : server
          ),
        }));
      },

      // Status management
      updateServerStatus: (id, status) => {
        set((state) => ({
          statuses: {
            ...state.statuses,
            [id]: {
              ...state.statuses[id],
              id,
              ...status,
            } as MCPServerStatus,
          },
        }));
      },

      setServerConnected: (id, connected, error) => {
        set((state) => ({
          statuses: {
            ...state.statuses,
            [id]: {
              ...state.statuses[id],
              id,
              connected,
              error,
              lastConnected: connected ? Date.now() : state.statuses[id]?.lastConnected,
            } as MCPServerStatus,
          },
        }));
      },

      setServerTools: (id, tools) => {
        set((state) => ({
          statuses: {
            ...state.statuses,
            [id]: {
              ...state.statuses[id],
              id,
              tools,
            } as MCPServerStatus,
          },
        }));
      },

      setServerResources: (id, resources) => {
        set((state) => ({
          statuses: {
            ...state.statuses,
            [id]: {
              ...state.statuses[id],
              id,
              resources,
            } as MCPServerStatus,
          },
        }));
      },

      setServerPrompts: (id, prompts) => {
        set((state) => ({
          statuses: {
            ...state.statuses,
            [id]: {
              ...state.statuses[id],
              id,
              prompts,
            } as MCPServerStatus,
          },
        }));
      },

      clearServerStatus: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.statuses;
          return { statuses: rest };
        });
      },

      // Permission management
      setToolPermission: (toolName, serverId, permission) => {
        set((state) => {
          const existingIndex = state.toolPermissions.findIndex(
            (p) => p.toolName === toolName && p.serverId === serverId
          );
          
          if (existingIndex >= 0) {
            const newPermissions = [...state.toolPermissions];
            newPermissions[existingIndex] = { toolName, serverId, permission };
            return { toolPermissions: newPermissions };
          }
          
          return {
            toolPermissions: [
              ...state.toolPermissions,
              { toolName, serverId, permission },
            ],
          };
        });
      },

      getToolPermission: (toolName, serverId) => {
        const state = get();
        const permission = state.toolPermissions.find(
          (p) => p.toolName === toolName && p.serverId === serverId
        );
        return permission?.permission || 'ask';
      },

      setGlobalAutoApprove: (autoApprove) => {
        set({ globalAutoApprove: autoApprove });
      },

      // Getters
      getEnabledServers: () => {
        return get().servers.filter((server) => server.enabled);
      },

      getAllTools: () => {
        const { statuses } = get();
        return Object.values(statuses).flatMap((status) => status.tools || []);
      },

      getAllResources: () => {
        const { statuses } = get();
        return Object.values(statuses).flatMap((status) => status.resources || []);
      },

      getAllPrompts: () => {
        const { statuses } = get();
        return Object.values(statuses).flatMap((status) => status.prompts || []);
      },

      getConnectedServers: () => {
        const { statuses } = get();
        return Object.values(statuses).filter((status) => status.connected);
      },
    }),
    {
      name: 'nexusai-mcp-config',
      partialize: (state) => ({
        servers: state.servers,
        toolPermissions: state.toolPermissions,
        globalAutoApprove: state.globalAutoApprove,
      }),
    }
  )
);
