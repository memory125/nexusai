// MCP (Model Context Protocol) types and interfaces

export interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  transport: 'stdio' | 'http' | 'websocket';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  timeout?: number;
  autoApprove?: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  serverId: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  serverId: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
  serverId: string;
}

export interface MCPCallToolRequest {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPCallToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    resource?: MCPResource;
  }>;
  isError?: boolean;
}

export interface MCPServerStatus {
  id: string;
  connected: boolean;
  error?: string;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  lastConnected?: number;
}

// Built-in MCP Servers
export const BUILTIN_MCP_SERVERS: MCPServerConfig[] = [
  {
    id: 'filesystem',
    name: '文件系统',
    description: '读取和写入本地文件，支持目录浏览',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'git',
    name: 'Git 版本控制',
    description: '执行 Git 命令，查看 diff、提交历史',
    enabled: false,
    transport: 'stdio',
    command: 'uvx',
    args: ['mcp-server-git'],
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: '操作 GitHub 仓库、Issues、PRs',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: '',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'sqlite',
    name: 'SQLite 数据库',
    description: '查询和操作 SQLite 数据库',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite'],
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'fetch',
    name: '网页获取',
    description: '获取网页内容并转换为 Markdown',
    enabled: false,
    transport: 'stdio',
    command: 'uvx',
    args: ['mcp-server-fetch'],
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'puppeteer',
    name: '浏览器自动化',
    description: '使用 Puppeteer 进行浏览器操作',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    timeout: 60000,
    autoApprove: false,
  },
  {
    id: 'brave-search',
    name: 'Brave 搜索',
    description: '使用 Brave Search API 进行搜索',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: {
      BRAVE_API_KEY: '',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'memory',
    name: '知识图谱记忆',
    description: '基于知识图谱的长期记忆系统',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    timeout: 30000,
    autoApprove: false,
  },
];

// Tool permission levels
export type ToolPermission = 'ask' | 'allow' | 'deny';

export interface MCPToolPermission {
  toolName: string;
  serverId: string;
  permission: ToolPermission;
}

// MCP Store State
export interface MCPState {
  servers: MCPServerConfig[];
  statuses: Record<string, MCPServerStatus>;
  toolPermissions: MCPToolPermission[];
  globalAutoApprove: boolean;
}

// MCP Client interface
export interface MCPClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  listTools(): Promise<MCPTool[]>;
  listResources(): Promise<MCPResource[]>;
  listPrompts(): Promise<MCPPrompt[]>;
  callTool(request: MCPCallToolRequest): Promise<MCPCallToolResult>;
  readResource(uri: string): Promise<any>;
  getPrompt(name: string, args?: Record<string, string>): Promise<any>;
}
