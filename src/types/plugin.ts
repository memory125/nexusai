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
  // 翻译与语言
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
  // 开发工具
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
  // 新增插件
  {
    id: 'code-review',
    name: '代码审查助手',
    version: '1.0.0',
    description: '自动审查代码，提供改进建议和安全分析',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['code-review', 'security', 'lint'],
    categories: ['developer-tools', 'ai-enhancement'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'chat:send-message',
      'storage:read',
      'mcp:use-tools',
    ],
  },
  {
    id: 'api-tester',
    name: 'API 测试工具',
    version: '1.0.0',
    description: '在对话中直接测试 REST API 接口',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['api', 'testing', 'http', 'rest'],
    categories: ['developer-tools'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    ui: 'tester.js',
    permissions: [
      'network:fetch',
      'ui:sidebar',
      'storage:read',
      'storage:write',
    ],
  },
  {
    id: 'db-explorer',
    name: '数据库浏览器',
    version: '1.0.0',
    description: '浏览和查询数据库表结构和数据',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['database', 'sql', 'explorer'],
    categories: ['developer-tools'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    ui: 'explorer.js',
    permissions: [
      'ui:sidebar',
      'storage:read',
      'mcp:use-tools',
    ],
  },
  {
    id: 'terminal',
    name: '终端模拟器',
    version: '1.0.0',
    description: '在应用中直接执行终端命令',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['terminal', 'shell', 'command'],
    categories: ['developer-tools'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    ui: 'terminal.js',
    permissions: [
      'ui:sidebar',
      'system:file-system',
    ],
  },
  // AI 增强
  {
    id: 'smart-completion',
    name: '智能补全',
    version: '1.0.0',
    description: 'AI 驱动的智能输入补全和建议',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['completion', 'suggestion', 'ai'],
    categories: ['ai-enhancement'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'chat:modify-input',
      'chat:receive-message',
    ],
  },
  {
    id: 'context-memory',
    name: '上下文记忆',
    version: '1.0.0',
    description: '长期记住对话中的重要信息',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['memory', 'context', 'remember'],
    categories: ['ai-enhancement'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'chat:receive-message',
      'storage:read',
      'storage:write',
    ],
    configSchema: {
      type: 'object',
      properties: {
        maxMemories: {
          type: 'number',
          title: '最大记忆数',
          default: 100,
          min: 10,
          max: 1000,
        },
        importanceThreshold: {
          type: 'number',
          title: '重要度阈值',
          default: 0.7,
          min: 0,
          max: 1,
        },
      },
    },
  },
  {
    id: 'summarizer',
    name: '智能摘要',
    version: '1.0.0',
    description: '自动生成对话和文档的智能摘要',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['summarizer', 'summary', 'ai'],
    categories: ['ai-enhancement', 'productivity'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'chat:receive-message',
      'storage:read',
      'storage:write',
    ],
  },
  // 效率工具
  {
    id: 'quick-notes',
    name: '快速笔记',
    version: '1.0.0',
    description: '在对话中快速记录笔记和想法',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['notes', 'quick', 'capture'],
    categories: ['productivity', 'utility'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    ui: 'notes.js',
    permissions: [
      'ui:toolbar',
      'storage:read',
      'storage:write',
    ],
  },
  {
    id: 'bookmark-manager',
    name: '书签管理',
    version: '1.0.0',
    description: '管理和搜索对话中的重要信息书签',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['bookmark', 'save', 'organize'],
    categories: ['productivity', 'utility'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'chat:receive-message',
      'storage:read',
      'storage:write',
    ],
  },
  {
    id: 'task-manager',
    name: '任务管理',
    version: '1.0.0',
    description: '从对话中创建和管理任务',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['task', 'todo', 'manager'],
    categories: ['productivity'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    ui: 'tasks.js',
    permissions: [
      'ui:sidebar',
      'chat:receive-message',
      'storage:read',
      'storage:write',
    ],
  },
  {
    id: 'calendar',
    name: '日历助手',
    version: '1.0.0',
    description: '创建和管理日历事件，设置提醒',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['calendar', 'event', 'schedule'],
    categories: ['productivity'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    ui: 'calendar.js',
    permissions: [
      'ui:sidebar',
      'storage:read',
      'storage:write',
    ],
  },
  // 集成
  {
    id: 'github-integration',
    name: 'GitHub 集成',
    version: '1.0.0',
    description: '在对话中操作 GitHub 仓库和 PR',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['github', 'integration', 'pr'],
    categories: ['integration', 'developer-tools'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'chat:send-message',
      'mcp:use-tools',
      'storage:read',
      'storage:write',
    ],
  },
  {
    id: 'slack-integration',
    name: 'Slack 集成',
    version: '1.0.0',
    description: '发送消息到 Slack，创建提醒',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['slack', 'integration', 'notification'],
    categories: ['integration'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'network:fetch',
      'system:notification',
      'storage:read',
      'storage:write',
    ],
  },
  // 主题
  {
    id: 'dark-pro-theme',
    name: '深色专业主题',
    version: '1.0.0',
    description: '专业的深色主题，适合长时间使用',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['theme', 'dark', 'professional'],
    categories: ['theme'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'ui:sidebar',
    ],
  },
  {
    id: 'light-minimal-theme',
    name: '浅色极简主题',
    version: '1.0.0',
    description: '简洁清爽的浅色主题',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['theme', 'light', 'minimal'],
    categories: ['theme'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'ui:sidebar',
    ],
  },
  {
    id: 'ocean-theme',
    name: '海洋主题',
    version: '1.0.0',
    description: '宁静的蓝色海洋主题',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['theme', 'ocean', 'blue'],
    categories: ['theme'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'ui:sidebar',
    ],
  },
  // 实用工具
  {
    id: 'image-generator',
    name: '图像生成',
    version: '1.0.0',
    description: '在对话中生成 AI 图像',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['image', 'generation', 'ai', 'dalle'],
    categories: ['ai-enhancement', 'utility'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    ui: 'generator.js',
    permissions: [
      'network:fetch',
      'chat:send-message',
      'ui:sidebar',
    ],
  },
  {
    id: 'file-converter',
    name: '文件转换器',
    version: '1.0.0',
    description: '在对话中转换文件格式',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['converter', 'file', 'format'],
    categories: ['utility'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'system:file-system',
      'network:fetch',
    ],
  },
  {
    id: 'qrcode-generator',
    name: '二维码生成器',
    version: '1.0.0',
    description: '生成和扫描二维码',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['qrcode', 'generator', 'code'],
    categories: ['utility'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'chat:send-message',
    ],
  },
  {
    id: 'emoji-picker',
    name: '表情符号选择器',
    version: '1.0.0',
    description: '快速插入表情符号和 GIF',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['emoji', 'gif', 'sticker'],
    categories: ['utility'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'chat:modify-input',
    ],
  },
  {
    id: 'voice-input',
    name: '语音输入',
    version: '1.0.0',
    description: '语音转文字输入',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['voice', 'speech', 'input'],
    categories: ['productivity'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'chat:modify-input',
    ],
  },
  {
    id: 'markdown-preview',
    name: 'Markdown 预览',
    version: '1.0.0',
    description: '实时预览 Markdown 内容',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['markdown', 'preview', 'render'],
    categories: ['productivity', 'developer-tools'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'chat:receive-message',
    ],
  },
  {
    id: 'export-tools',
    name: '导出工具',
    version: '1.0.0',
    description: '将对话导出为多种格式',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['export', 'download', 'convert'],
    categories: ['utility'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'storage:read',
      'system:file-system',
    ],
  },
  {
    id: 'math-calculator',
    name: '数学计算器',
    version: '1.0.0',
    description: '执行数学计算和公式渲染',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['math', 'calculator', 'formula'],
    categories: ['utility', 'productivity'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'chat:modify-input',
    ],
  },
  {
    id: 'table-formatter',
    name: '表格格式化',
    version: '1.0.0',
    description: '创建和格式化表格数据',
    author: 'NexusAI Team',
    license: 'MIT',
    keywords: ['table', 'format', 'data'],
    categories: ['productivity'],
    engines: {
      nexusai: '>=1.5.0',
    },
    main: 'index.js',
    permissions: [
      'chat:modify-input',
    ],
  },
];
