// Plugin system types and interfaces

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license: string;
  icon?: string;
  keywords: string[];
  categories: PluginCategory[];
  
  // Engine requirements
  engines: {
    nexusai: string;
    node?: string;
  };
  
  // Entry points
  main: string;
  ui?: string;
  
  // Capabilities
  permissions: PluginPermission[];
  
  // Hooks
  hooks?: PluginHook[];
  
  // Config schema
  configSchema?: ConfigSchema;
  
  // Dependencies
  dependencies?: Record<string, string>;
  
  // Screenshots for marketplace
  screenshots?: string[];
  
  // Pricing (for marketplace)
  pricing?: {
    type: 'free' | 'paid' | 'subscription';
    price?: number;
    currency?: string;
  };
}

export type PluginCategory = 
  | 'productivity'
  | 'developer-tools'
  | 'ai-enhancement'
  | 'integration'
  | 'theme'
  | 'utility'
  | 'custom';

export type PluginPermission =
  | 'storage:read'
  | 'storage:write'
  | 'network:fetch'
  | 'ui:sidebar'
  | 'ui:toolbar'
  | 'ui:context-menu'
  | 'chat:send-message'
  | 'chat:receive-message'
  | 'chat:modify-input'
  | 'models:access'
  | 'system:clipboard'
  | 'system:notification'
  | 'system:file-system'
  | 'mcp:use-tools'
  | 'rag:access-knowledge-base';

export type PluginHook = 
  | 'before-message-send'
  | 'after-message-receive'
  | 'on-conversation-start'
  | 'on-conversation-end'
  | 'on-plugin-load'
  | 'on-plugin-unload'
  | 'on-theme-change'
  | 'on-settings-change';

export interface ConfigSchema {
  type: 'object';
  properties: Record<string, ConfigProperty>;
  required?: string[];
}

export interface ConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'select';
  title?: string;
  description?: string;
  default?: any;
  enum?: any[];
  items?: ConfigProperty;
  properties?: Record<string, ConfigProperty>;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface PluginInstance {
  manifest: PluginManifest;
  status: PluginStatus;
  config: Record<string, any>;
  runtime?: PluginRuntime;
  error?: string;
  installedAt: number;
  updatedAt: number;
  size: number;
}

export type PluginStatus = 
  | 'installed'
  | 'active'
  | 'inactive'
  | 'error'
  | 'updating'
  | 'uninstalling';

export interface PluginRuntime {
  // JavaScript module
  module?: any;
  // UI component (if provided)
  uiComponent?: React.ComponentType;
  // Cleanup function
  dispose?: () => void;
  // Hook handlers
  hooks: Partial<Record<PluginHook, Function[]>>;
}

// Plugin API exposed to plugins
export interface PluginAPI {
  // Manifest
  manifest: PluginManifest;
  
  // Storage
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    remove: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  
  // UI
  ui: {
    showNotification: (options: NotificationOptions) => void;
    showModal: (content: React.ReactNode) => void;
    hideModal: () => void;
    registerSidebarItem: (item: SidebarItem) => () => void;
    registerToolbarButton: (button: ToolbarButton) => () => void;
    registerContextMenu: (menu: ContextMenuItem) => () => void;
  };
  
  // Chat
  chat: {
    sendMessage: (content: string, options?: SendMessageOptions) => Promise<void>;
    onMessageSend: (handler: (message: string) => string | void) => () => void;
    onMessageReceive: (handler: (message: any) => void) => () => void;
  };
  
  // Models
  models: {
    getAvailableModels: () => Promise<ModelInfo[]>;
    invokeModel: (modelId: string, prompt: string) => Promise<string>;
  };
  
  // System
  system: {
    copyToClipboard: (text: string) => Promise<void>;
    readClipboard: () => Promise<string>;
    openExternal: (url: string) => void;
  };
  
  // RAG
  rag: {
    queryKnowledgeBase: (kbId: string, query: string) => Promise<any>;
    getKnowledgeBases: () => Promise<any[]>;
  };
  
  // MCP
  mcp: {
    callTool: (serverId: string, toolName: string, args: any) => Promise<any>;
    getAvailableTools: () => Promise<any[]>;
  };
  
  // Events
  events: {
    on: (event: string, handler: Function) => () => void;
    emit: (event: string, data?: any) => void;
  };
  
  // Logger
  logger: {
    log: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
}

export interface NotificationOptions {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  component: React.ComponentType;
}

export interface ToolbarButton {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  tooltip?: string;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  when?: (context: any) => boolean;
  action: (context: any) => void;
}

export interface SendMessageOptions {
  model?: string;
  agent?: string;
  skills?: string[];
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

// Plugin marketplace types
export interface MarketplacePlugin {
  manifest: PluginManifest;
  downloads: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  trending: boolean;
  installed?: boolean;
  updateAvailable?: boolean;
}

export interface PluginReview {
  id: string;
  pluginId: string;
  userId: string;
  username: string;
  avatar: string;
  rating: number;
  comment: string;
  createdAt: number;
  helpful: number;
}

// Built-in example plugins
export const EXAMPLE_PLUGINS: PluginManifest[] = [
  {
    id: 'translator',
    name: '实时翻译',
    version: '1.0.0',
    description: '自动检测并翻译消息内容，支持 100+ 语言',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['translation', 'language', 'i18n'],
    categories: ['productivity', 'ai-enhancement'],
    engines: {
      nexusai: '>=1.4.0',
    },
    main: 'index.js',
    permissions: [
      'chat:receive-message',
      'chat:modify-input',
      'network:fetch',
      'storage:read',
      'storage:write',
    ],
    configSchema: {
      type: 'object',
      properties: {
        targetLanguage: {
          type: 'select',
          title: '目标语言',
          description: '自动翻译到该语言',
          default: 'zh-CN',
          enum: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES'],
        },
        autoTranslate: {
          type: 'boolean',
          title: '自动翻译',
          description: '收到消息时自动翻译',
          default: true,
        },
        showOriginal: {
          type: 'boolean',
          title: '显示原文',
          description: '同时显示原文和译文',
          default: false,
        },
      },
    },
  },
  {
    id: 'code-runner',
    name: '代码运行器',
    version: '1.0.0',
    description: '在对话中直接执行代码片段，支持 Python、JavaScript',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['code', 'execution', 'python', 'javascript'],
    categories: ['developer-tools'],
    engines: {
      nexusai: '>=1.4.0',
    },
    main: 'index.js',
    ui: 'panel.js',
    permissions: [
      'chat:send-message',
      'chat:receive-message',
      'ui:sidebar',
      'system:file-system',
    ],
    configSchema: {
      type: 'object',
      properties: {
        timeout: {
          type: 'number',
          title: '执行超时',
          description: '代码执行超时时间（秒）',
          default: 30,
          min: 5,
          max: 300,
        },
        allowedLanguages: {
          type: 'array',
          title: '允许的语言',
          items: {
            type: 'select',
            enum: ['python', 'javascript', 'typescript', 'bash'],
          },
          default: ['python', 'javascript'],
        },
      },
    },
  },
  {
    id: 'web-search-enhanced',
    name: '增强搜索',
    version: '1.0.0',
    description: '集成多个搜索引擎，提供更全面的搜索结果',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['search', 'web', 'google', 'bing'],
    categories: ['productivity', 'integration'],
    engines: {
      nexusai: '>=1.4.0',
    },
    main: 'index.js',
    permissions: [
      'network:fetch',
      'chat:send-message',
      'storage:read',
    ],
    configSchema: {
      type: 'object',
      properties: {
        searchEngines: {
          type: 'array',
          title: '搜索引擎',
          items: {
            type: 'select',
            enum: ['google', 'bing', 'brave', 'duckduckgo'],
          },
          default: ['google'],
        },
        maxResults: {
          type: 'number',
          title: '最大结果数',
          default: 10,
          min: 5,
          max: 50,
        },
      },
    },
  },
  {
    id: 'conversation-analytics',
    name: '对话分析',
    version: '1.0.0',
    description: '分析对话数据，提供统计报告和可视化',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['analytics', 'statistics', 'visualization'],
    categories: ['productivity', 'utility'],
    engines: {
      nexusai: '>=1.4.0',
    },
    main: 'index.js',
    ui: 'dashboard.js',
    permissions: [
      'storage:read',
      'ui:sidebar',
      'chat:receive-message',
    ],
  },
  {
    id: 'prompt-templates',
    name: '提示词模板',
    version: '1.0.0',
    description: '管理和使用预设的提示词模板，提高对话效率',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['prompt', 'templates', 'productivity'],
    categories: ['productivity', 'ai-enhancement'],
    engines: {
      nexusai: '>=1.4.0',
    },
    main: 'index.js',
    ui: 'templates.js',
    permissions: [
      'chat:modify-input',
      'storage:read',
      'storage:write',
      'ui:toolbar',
    ],
  },
];
