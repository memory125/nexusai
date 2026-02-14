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
  // 文件与开发
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
  // 新增服务器
  {
    id: 'postgres',
    name: 'PostgreSQL 数据库',
    description: '连接和查询 PostgreSQL 数据库',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'mysql',
    name: 'MySQL 数据库',
    description: '连接和查询 MySQL 数据库',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-mysql'],
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    description: '连接和操作 MongoDB 数据库',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-mongodb'],
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'redis',
    name: 'Redis 缓存',
    description: '操作 Redis 缓存和键值存储',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-redis'],
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'slack',
    name: 'Slack 集成',
    description: '发送消息到 Slack 频道和用户',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: {
      SLACK_BOT_TOKEN: '',
      SLACK_TEAM_ID: '',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'sentry',
    name: 'Sentry 错误追踪',
    description: '查询和管理 Sentry 错误报告',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sentry'],
    env: {
      SENTRY_AUTH_TOKEN: '',
      SENTRY_ORG: '',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'aws-kb',
    name: 'AWS Knowledge Base',
    description: '查询 AWS Knowledge Base 知识库',
    enabled: false,
    transport: 'http',
    url: '',
    env: {
      AWS_ACCESS_KEY_ID: '',
      AWS_SECRET_ACCESS_KEY: '',
      AWS_REGION: 'us-east-1',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'everart',
    name: 'EverART 图像生成',
    description: '使用 EverART API 生成图像',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-everart'],
    env: {
      EVERART_API_KEY: '',
    },
    timeout: 60000,
    autoApprove: false,
  },
  {
    id: 'time',
    name: '时间工具',
    description: '获取当前时间、时区转换和日期计算',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-time'],
    timeout: 10000,
    autoApprove: false,
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: '地图查询、路线规划和地点搜索',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-google-maps'],
    env: {
      GOOGLE_MAPS_API_KEY: '',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: '操作 GitLab 仓库、Issues、MRs',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-gitlab'],
    env: {
      GITLAB_PERSONAL_ACCESS_TOKEN: '',
      GITLAB_URL: 'https://gitlab.com',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'jira',
    name: 'Jira',
    description: '管理和操作 Jira issues 和 projects',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-jira'],
    env: {
      JIRA_API_TOKEN: '',
      JIRA_EMAIL: '',
      JIRA_INSTANCE_URL: '',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: '读写 Notion 页面和数据库',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-notion'],
    env: {
      NOTION_API_KEY: '',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'linear',
    name: 'Linear',
    description: '管理 Linear issues 和工作流',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-linear'],
    env: {
      LINEAR_API_KEY: '',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'openapi',
    name: 'OpenAPI 工具',
    description: '调用任意 OpenAPI 接口',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-openapi'],
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'aws-kb-retrieval',
    name: 'AWS KB Retrieval',
    description: '从 AWS Knowledge Base 检索内容',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-aws-kb-retrieval-server'],
    env: {
      AWS_ACCESS_KEY_ID: '',
      AWS_SECRET_ACCESS_KEY: '',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'everything',
    name: 'everything (本地搜索)',
    description: '快速搜索本地文件内容',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-everything'],
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'sentry',
    name: 'Sentry 错误追踪',
    description: '查询和管理 Sentry 错误报告',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sentry'],
    env: {
      SENTRY_AUTH_TOKEN: '',
      SENTRY_ORG: '',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'aws',
    name: 'AWS 云服务',
    description: '操作 AWS S3、EC2 等服务',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-aws'],
    env: {
      AWS_ACCESS_KEY_ID: '',
      AWS_SECRET_ACCESS_KEY: '',
      AWS_REGION: 'us-east-1',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'docker',
    name: 'Docker 容器',
    description: '管理和操作 Docker 容器与镜像',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-docker'],
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: '管理和操作 Kubernetes 集群',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-kubernetes'],
    env: {
      KUBECONFIG: '',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'PostgreSQL 数据库连接和查询',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgresql'],
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'sequential-thinking',
    name: '顺序思考',
    description: '用于复杂问题的顺序分析和推理',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'github-repos',
    name: 'GitHub 仓库',
    description: '操作 GitHub 仓库、文件和内容',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github-repos'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: '',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'slack-channel',
    name: 'Slack 频道',
    description: '管理和搜索 Slack 频道消息',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack-channel'],
    env: {
      SLACK_BOT_TOKEN: '',
    },
    timeout: 30000,
    autoApprove: false,
  },
  {
    id: 'gitleaks',
    name: 'GitLeaks 安全扫描',
    description: '扫描代码库中的敏感信息和密钥',
    enabled: false,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-gitleaks'],
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
