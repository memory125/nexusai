// MCP Service - Manages MCP server connections and tool calls
// In browser environment, this communicates with Tauri backend
// For now, we'll implement a mock version that simulates MCP behavior

import type {
  MCPServerConfig,
  MCPTool,
  MCPCallToolRequest,
  MCPCallToolResult,
  MCPResource,
  MCPPrompt,
} from '../types/mcp';

export class MCPService {
  private connections: Map<string, MCPConnection> = new Map();
  private isTauri: boolean;

  constructor() {
    // Check if running in Tauri environment
    this.isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;
  }

  async connectServer(config: MCPServerConfig): Promise<void> {
    if (this.isTauri) {
      // In real Tauri app, use Rust backend
      return this.connectViaTauri(config);
    } else {
      // In browser, simulate connection for demo
      return this.simulateConnection(config);
    }
  }

  async disconnectServer(serverId: string): Promise<void> {
    if (this.isTauri) {
      // Call Tauri command
    }
    this.connections.delete(serverId);
  }

  async listTools(serverId: string): Promise<MCPTool[]> {
    const connection = this.connections.get(serverId);
    if (!connection) return [];

    if (this.isTauri) {
      // Call Tauri command
      return [];
    } else {
      // Return simulated tools
      return this.getSimulatedTools(serverId);
    }
  }

  async listResources(serverId: string): Promise<MCPResource[]> {
    const connection = this.connections.get(serverId);
    if (!connection) return [];
    return [];
  }

  async listPrompts(serverId: string): Promise<MCPPrompt[]> {
    const connection = this.connections.get(serverId);
    if (!connection) return [];
    return [];
  }

  async callTool(
    serverId: string,
    request: MCPCallToolRequest
  ): Promise<MCPCallToolResult> {
    if (this.isTauri) {
      // Call Tauri backend
      try {
        const result = await (window as any).__TAURI__.invoke('mcp_call_tool', {
          serverId,
          toolName: request.name,
          arguments: request.arguments,
        });
        return result;
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error}` }],
          isError: true,
        };
      }
    } else {
      // Simulate tool call
      return this.simulateToolCall(serverId, request);
    }
  }

  async readResource(serverId: string, uri: string): Promise<any> {
    // Implementation for reading resources
    return null;
  }

  // Helper methods
  private async connectViaTauri(config: MCPServerConfig): Promise<void> {
    try {
      await (window as any).__TAURI__.invoke('mcp_connect_server', {
        config,
      });
      this.connections.set(config.id, { config, connected: true });
    } catch (error) {
      throw new Error(`Failed to connect to MCP server: ${error}`);
    }
  }

  private async simulateConnection(config: MCPServerConfig): Promise<void> {
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    this.connections.set(config.id, {
      config,
      connected: true,
    });
  }

  private getSimulatedTools(serverId: string): MCPTool[] {
    // Return simulated tools based on server type
    const toolSets: Record<string, MCPTool[]> = {
      filesystem: [
        {
          name: 'read_file',
          description: '读取文件内容',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '文件路径' },
            },
            required: ['path'],
          },
          serverId,
        },
        {
          name: 'write_file',
          description: '写入文件内容',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '文件路径' },
              content: { type: 'string', description: '文件内容' },
            },
            required: ['path', 'content'],
          },
          serverId,
        },
        {
          name: 'list_directory',
          description: '列出目录内容',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '目录路径' },
            },
            required: ['path'],
          },
          serverId,
        },
        {
          name: 'search_files',
          description: '搜索文件',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '搜索路径' },
              pattern: { type: 'string', description: '搜索模式' },
            },
            required: ['path', 'pattern'],
          },
          serverId,
        },
      ],
      git: [
        {
          name: 'git_status',
          description: '查看 Git 仓库状态',
          inputSchema: {
            type: 'object',
            properties: {
              repo_path: { type: 'string', description: '仓库路径' },
            },
            required: ['repo_path'],
          },
          serverId,
        },
        {
          name: 'git_diff',
          description: '查看 Git diff',
          inputSchema: {
            type: 'object',
            properties: {
              repo_path: { type: 'string', description: '仓库路径' },
              target: { type: 'string', description: '对比目标' },
            },
            required: ['repo_path'],
          },
          serverId,
        },
        {
          name: 'git_log',
          description: '查看 Git 提交历史',
          inputSchema: {
            type: 'object',
            properties: {
              repo_path: { type: 'string', description: '仓库路径' },
              max_count: { type: 'number', description: '最大条数' },
            },
            required: ['repo_path'],
          },
          serverId,
        },
      ],
      github: [
        {
          name: 'create_issue',
          description: '创建 GitHub Issue',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: '仓库所有者' },
              repo: { type: 'string', description: '仓库名称' },
              title: { type: 'string', description: '标题' },
              body: { type: 'string', description: '内容' },
            },
            required: ['owner', 'repo', 'title'],
          },
          serverId,
        },
        {
          name: 'search_code',
          description: '搜索代码',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: '搜索查询' },
              language: { type: 'string', description: '编程语言' },
            },
            required: ['query'],
          },
          serverId,
        },
      ],
      sqlite: [
        {
          name: 'query',
          description: '执行 SQL 查询',
          inputSchema: {
            type: 'object',
            properties: {
              database: { type: 'string', description: '数据库路径' },
              sql: { type: 'string', description: 'SQL 语句' },
            },
            required: ['database', 'sql'],
          },
          serverId,
        },
        {
          name: 'list_tables',
          description: '列出所有表',
          inputSchema: {
            type: 'object',
            properties: {
              database: { type: 'string', description: '数据库路径' },
            },
            required: ['database'],
          },
          serverId,
        },
      ],
      fetch: [
        {
          name: 'fetch_url',
          description: '获取网页内容',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: '网页 URL' },
              max_length: { type: 'number', description: '最大长度' },
            },
            required: ['url'],
          },
          serverId,
        },
      ],
      puppeteer: [
        {
          name: 'navigate',
          description: '导航到网页',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: '目标 URL' },
            },
            required: ['url'],
          },
          serverId,
        },
        {
          name: 'screenshot',
          description: '截图',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS 选择器' },
              fullPage: { type: 'boolean', description: '是否全页' },
            },
          },
          serverId,
        },
        {
          name: 'click',
          description: '点击元素',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS 选择器' },
            },
            required: ['selector'],
          },
          serverId,
        },
      ],
      'brave-search': [
        {
          name: 'web_search',
          description: '搜索网页',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: '搜索关键词' },
              count: { type: 'number', description: '结果数量' },
            },
            required: ['query'],
          },
          serverId,
        },
      ],
      memory: [
        {
          name: 'create_entities',
          description: '创建实体',
          inputSchema: {
            type: 'object',
            properties: {
              entities: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    entityType: { type: 'string' },
                    observations: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
            required: ['entities'],
          },
          serverId,
        },
        {
          name: 'search_nodes',
          description: '搜索知识节点',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: '搜索查询' },
            },
            required: ['query'],
          },
          serverId,
        },
      ],
      postgres: [
        {
          name: 'pg_query',
          description: '执行 PostgreSQL 查询',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'SQL 查询语句' },
            },
            required: ['query'],
          },
          serverId,
        },
        {
          name: 'pg_list_tables',
          description: '列出所有表',
          inputSchema: {
            type: 'object',
            properties: {
              schema: { type: 'string', description: '数据库模式', default: 'public' },
            },
          },
          serverId,
        },
      ],
      mysql: [
        {
          name: 'mysql_query',
          description: '执行 MySQL 查询',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'SQL 查询语句' },
            },
            required: ['query'],
          },
          serverId,
        },
      ],
      mongodb: [
        {
          name: 'mongodb_find',
          description: '查询 MongoDB 文档',
          inputSchema: {
            type: 'object',
            properties: {
              collection: { type: 'string', description: '集合名称' },
              filter: { type: 'object', description: '查询条件' },
              limit: { type: 'number', description: '返回数量' },
            },
            required: ['collection'],
          },
          serverId,
        },
        {
          name: 'mongodb_aggregate',
          description: 'MongoDB 聚合查询',
          inputSchema: {
            type: 'object',
            properties: {
              collection: { type: 'string', description: '集合名称' },
              pipeline: { type: 'array', description: '聚合管道' },
            },
            required: ['collection'],
          },
          serverId,
        },
      ],
      redis: [
        {
          name: 'redis_get',
          description: '获取 Redis 值',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: '键名' },
            },
            required: ['key'],
          },
          serverId,
        },
        {
          name: 'redis_set',
          description: '设置 Redis 值',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: '键名' },
              value: { type: 'string', description: '值' },
              ttl: { type: 'number', description: '过期时间(秒)' },
            },
            required: ['key', 'value'],
          },
          serverId,
        },
      ],
      slack: [
        {
          name: 'slack_post_message',
          description: '发送 Slack 消息',
          inputSchema: {
            type: 'object',
            properties: {
              channel: { type: 'string', description: '频道 ID' },
              text: { type: 'string', description: '消息内容' },
            },
            required: ['channel', 'text'],
          },
          serverId,
        },
        {
          name: 'slack_list_channels',
          description: '列出 Slack 频道',
          inputSchema: {
            type: 'object',
            properties: {},
          },
          serverId,
        },
      ],
      gitlab: [
        {
          name: 'gitlab_list_issues',
          description: '列出 GitLab Issues',
          inputSchema: {
            type: 'object',
            properties: {
              project_id: { type: 'string', description: '项目 ID' },
              state: { type: 'string', description: '状态', enum: ['opened', 'closed', 'all'] },
            },
          },
          serverId,
        },
        {
          name: 'gitlab_create_mr',
          description: '创建 Merge Request',
          inputSchema: {
            type: 'object',
            properties: {
              project_id: { type: 'string', description: '项目 ID' },
              source_branch: { type: 'string', description: '源分支' },
              target_branch: { type: 'string', description: '目标分支' },
              title: { type: 'string', description: '标题' },
            },
            required: ['project_id', 'source_branch', 'target_branch', 'title'],
          },
          serverId,
        },
      ],
      notion: [
        {
          name: 'notion_search',
          description: '搜索 Notion 页面',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: '搜索关键词' },
            },
            required: ['query'],
          },
          serverId,
        },
        {
          name: 'notion_get_page',
          description: '获取 Notion 页面',
          inputSchema: {
            type: 'object',
            properties: {
              page_id: { type: 'string', description: '页面 ID' },
            },
            required: ['page_id'],
          },
          serverId,
        },
      ],
      linear: [
        {
          name: 'linear_list_issues',
          description: '列出 Linear Issues',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: '团队 ID' },
              assigned_to_me: { type: 'boolean', description: '指派给我' },
            },
          },
          serverId,
        },
        {
          name: 'linear_create_issue',
          description: '创建 Linear Issue',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: '团队 ID' },
              title: { type: 'string', description: '标题' },
              description: { type: 'string', description: '描述' },
            },
            required: ['team_id', 'title'],
          },
          serverId,
        },
      ],
      time: [
        {
          name: 'get_current_time',
          description: '获取当前时间',
          inputSchema: {
            type: 'object',
            properties: {
              timezone: { type: 'string', description: '时区', default: 'UTC' },
            },
          },
          serverId,
        },
        {
          name: 'convert_timezone',
          description: '时区转换',
          inputSchema: {
            type: 'object',
            properties: {
              datetime: { type: 'string', description: '日期时间' },
              from_tz: { type: 'string', description: '源时区' },
              to_tz: { type: 'string', description: '目标时区' },
            },
            required: ['datetime', 'from_tz', 'to_tz'],
          },
          serverId,
        },
      ],
      'google-maps': [
        {
          name: 'geocode',
          description: '地址转坐标',
          inputSchema: {
            type: 'object',
            properties: {
              address: { type: 'string', description: '地址' },
            },
            required: ['address'],
          },
          serverId,
        },
        {
          name: 'directions',
          description: '路线规划',
          inputSchema: {
            type: 'object',
            properties: {
              origin: { type: 'string', description: '起点' },
              destination: { type: 'string', description: '终点' },
              mode: { type: 'string', description: '出行方式', enum: ['driving', 'walking', 'bicycling', 'transit'] },
            },
            required: ['origin', 'destination'],
          },
          serverId,
        },
      ],
      jira: [
        {
          name: 'jira_search',
          description: '搜索 Jira Issues',
          inputSchema: {
            type: 'object',
            properties: {
              jql: { type: 'string', description: 'JQL 查询' },
              max_results: { type: 'number', description: '最大结果数' },
            },
            required: ['jql'],
          },
          serverId,
        },
        {
          name: 'jira_create_issue',
          description: '创建 Jira Issue',
          inputSchema: {
            type: 'object',
            properties: {
              project_key: { type: 'string', description: '项目 Key' },
              summary: { type: 'string', description: '摘要' },
              description: { type: 'string', description: '描述' },
              issue_type: { type: 'string', description: '类型', default: 'Task' },
            },
            required: ['project_key', 'summary'],
          },
          serverId,
        },
      ],
      // Sentry
      sentry: [
        {
          name: 'sentry_list_issues',
          description: '列出 Sentry Issues',
          inputSchema: {
            type: 'object',
            properties: {
              project: { type: 'string', description: '项目 slug' },
              status: { type: 'string', description: '状态', enum: ['unresolved', 'resolved', 'ignored'] },
            },
          },
          serverId,
        },
        {
          name: 'sentry_get_event',
          description: '获取 Sentry Event 详情',
          inputSchema: {
            type: 'object',
            properties: {
              event_id: { type: 'string', description: 'Event ID' },
              project: { type: 'string', description: '项目 slug' },
            },
            required: ['event_id', 'project'],
          },
          serverId,
        },
      ],
      // AWS
      aws: [
        {
          name: 'aws_s3_list_buckets',
          description: '列出 S3 存储桶',
          inputSchema: {
            type: 'object',
            properties: {},
          },
          serverId,
        },
        {
          name: 'aws_s3_list_objects',
          description: '列出 S3 对象',
          inputSchema: {
            type: 'object',
            properties: {
              bucket: { type: 'string', description: '存储桶名称' },
              prefix: { type: 'string', description: '前缀' },
            },
            required: ['bucket'],
          },
          serverId,
        },
        {
          name: 'aws_ec2_list_instances',
          description: '列出 EC2 实例',
          inputSchema: {
            type: 'object',
            properties: {
              region: { type: 'string', description: 'AWS 区域' },
            },
          },
          serverId,
        },
      ],
      // Docker
      docker: [
        {
          name: 'docker_list_containers',
          description: '列出 Docker 容器',
          inputSchema: {
            type: 'object',
            properties: {
              all: { type: 'boolean', description: '包含已停止的容器', default: false },
            },
          },
          serverId,
        },
        {
          name: 'docker_list_images',
          description: '列出 Docker 镜像',
          inputSchema: {
            type: 'object',
            properties: {},
          },
          serverId,
        },
        {
          name: 'docker_inspect_container',
          description: '查看容器详情',
          inputSchema: {
            type: 'object',
            properties: {
              container_id: { type: 'string', description: '容器 ID' },
            },
            required: ['container_id'],
          },
          serverId,
        },
      ],
      // Kubernetes
      kubernetes: [
        {
          name: 'k8s_list_pods',
          description: '列出 Pods',
          inputSchema: {
            type: 'object',
            properties: {
              namespace: { type: 'string', description: '命名空间', default: 'default' },
            },
          },
          serverId,
        },
        {
          name: 'k8s_get_pod',
          description: '获取 Pod 详情',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Pod 名称' },
              namespace: { type: 'string', description: '命名空间', default: 'default' },
            },
            required: ['name'],
          },
          serverId,
        },
        {
          name: 'k8s_list_services',
          description: '列出 Services',
          inputSchema: {
            type: 'object',
            properties: {
              namespace: { type: 'string', description: '命名空间', default: 'default' },
            },
          },
          serverId,
        },
      ],
      // PostgreSQL additional
      postgresql: [
        {
          name: 'pg_describe_table',
          description: '描述表结构',
          inputSchema: {
            type: 'object',
            properties: {
              table: { type: 'string', description: '表名' },
              schema: { type: 'string', description: '模式', default: 'public' },
            },
            required: ['table'],
          },
          serverId,
        },
        {
          name: 'pg_explain',
          description: '执行 SQL EXPLAIN',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'SQL 查询' },
            },
            required: ['query'],
          },
          serverId,
        },
      ],
    };

      return toolSets[serverId] || [];
  }

  private async simulateToolCall(
    serverId: string,
    request: MCPCallToolRequest
  ): Promise<MCPCallToolResult> {
    // Simulate tool execution delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return simulated results based on tool name
    const mockResults: Record<string, string> = {
      read_file: `[模拟] 文件内容:\n这是 ${request.arguments.path} 的内容...`,
      write_file: `[模拟] 文件已写入: ${request.arguments.path}`,
      list_directory: `[模拟] 目录列表:\n- file1.txt\n- file2.js\n- folder1/`,
      search_files: `[模拟] 搜索结果:\n在 ${request.arguments.path} 中找到匹配 "${request.arguments.pattern}" 的文件`,
      git_status: `[模拟] Git 状态:\nOn branch main\nYour branch is up to date.`,
      git_diff: `[模拟] Git diff:\ndiff --git a/file.txt b/file.txt\n+ added line`,
      git_log: `[模拟] 最近提交:\nabc1234 Initial commit\ndef5678 Add feature`,
      create_issue: `[模拟] Issue 已创建: ${request.arguments.title}`,
      search_code: `[模拟] 代码搜索结果:\n找到 5 个匹配项`,
      query: `[模拟] SQL 查询结果:\n| id | name | value |\n| 1 | test | 100 |`,
      list_tables: `[模拟] 数据库表:\n- users\n- posts\n- comments`,
      fetch_url: `[模拟] 网页内容:\n标题: Example Page\n内容: 这是从 ${request.arguments.url} 获取的内容`,
      navigate: `[模拟] 已导航到: ${request.arguments.url}`,
      screenshot: `[模拟] 截图已保存`,
      click: `[模拟] 已点击元素: ${request.arguments.selector}`,
      web_search: `[模拟] 搜索结果:\n1. Example Result 1\n2. Example Result 2`,
      create_entities: `[模拟] 已创建 ${request.arguments.entities?.length || 0} 个实体`,
      search_nodes: `[模拟] 知识图谱搜索结果:\n找到相关实体`,
      // PostgreSQL
      pg_query: `[模拟] PostgreSQL 查询结果:\n| id | name | email |\n| 1 | Alice | alice@example.com |\n| 2 | Bob | bob@example.com`,
      pg_list_tables: `[模拟] PostgreSQL 表:\n- users\n- orders\n- products\n- sessions`,
      // MySQL
      mysql_query: `[模拟] MySQL 查询结果:\n| id | username | created_at |\n| 1 | user1 | 2024-01-01 |\n| 2 | user2 | 2024-01-02`,
      // MongoDB
      mongodb_find: `[模拟] MongoDB 文档:\n{ "_id": "xxx", "name": "Document 1", "status": "active" }`,
      mongodb_aggregate: `[模拟] MongoDB 聚合结果:\n{ "total": 100, "average": 45.5 }`,
      // Redis
      redis_get: `[模拟] Redis GET result:\nvalue_123`,
      redis_set: `[模拟] Redis SET success:\nOK`,
      // Slack
      slack_post_message: `[模拟] Slack 消息已发送:\nChannel: ${request.arguments.channel}\nMessage: ${request.arguments.text}`,
      slack_list_channels: `[模拟] Slack 频道列表:\n- #general\n- #random\n- #engineering`,
      // GitLab
      gitlab_list_issues: `[模拟] GitLab Issues:\n- #1: Fix bug in login\n- #2: Add new feature\n- #3: Update documentation`,
      gitlab_create_mr: `[模拟] Merge Request 已创建:\nTitle: ${request.arguments.title}\nSource: ${request.arguments.source_branch} → ${request.arguments.target_branch}`,
      // Notion
      notion_search: `[模拟] Notion 搜索结果:\n- Page: Project Plan\n- Page: Meeting Notes\n- Database: Tasks`,
      notion_get_page: `[模拟] Notion 页面内容:\n标题: ${request.arguments.page_id}\n内容: 页面详情...`,
      // Linear
      linear_list_issues: `[模拟] Linear Issues:\n- ENG-123: Implement login\n- ENG-124: Fix crash on startup\n- ENG-125: Update dependencies`,
      linear_create_issue: `[模拟] Linear Issue 已创建:\nTitle: ${request.arguments.title}\nTeam: ${request.arguments.team_id}`,
      // Time
      get_current_time: `[模拟] 当前时间:\n${new Date().toISOString()}`,
      convert_timezone: `[模拟] 时区转换结果:\n${request.arguments.datetime} (${request.arguments.from_tz}) → ${request.arguments.to_tz}`,
      // Google Maps
      geocode: `[模拟] 地理编码结果:\n地址: ${request.arguments.address}\n坐标: 37.7749, -122.4194`,
      directions: `[模拟] 路线规划结果:\n从 ${request.arguments.origin} 到 ${request.arguments.destination}\n距离: 5.2 km\n耗时: 15 分钟`,
      // Jira
      jira_search: `[模拟] Jira 搜索结果:\n- PROJ-123: Bug in payment\n- PROJ-124: Feature request\n- PROJ-125: Documentation update`,
      jira_create_issue: `[模拟] Jira Issue 已创建:\nKey: ${request.arguments.project_key}-XXX\nSummary: ${request.arguments.summary}`,
      // Sentry
      sentry_list_issues: `[模拟] Sentry Issues:\n- ERROR: Cannot read property 'undefined'\n- WARNING: Memory usage high\n- ERROR: Database connection timeout`,
      sentry_get_event: `[模拟] Sentry Event:\nEvent ID: ${request.arguments.event_id}\nLevel: error\nMessage: Cannot read property 'undefined'`,
      // AWS
      aws_s3_list_buckets: `[模拟] S3 存储桶:\n- my-bucket-1\n- my-bucket-2\n- logs-bucket`,
      aws_s3_list_objects: `[模拟] S3 对象:\n- folder1/file1.txt\n- folder1/file2.jpg\n- folder2/data.json`,
      aws_ec2_list_instances: `[模拟] EC2 实例:\n- i-1234567890abcdef0 (running)\n- i-0abcdef1234567890 (stopped)`,
      // Docker
      docker_list_containers: `[模拟] Docker 容器:\nCONTAINER ID  IMAGE        STATUS\nabc123def456  nginx        Up 2 hours\ndef456ghi789  postgres     Up 5 hours`,
      docker_list_images: `[模拟] Docker 镜像:\nREPOSITORY  TAG     SIZE\nnginx       latest  142MB\npostgres    15      379MB`,
      docker_inspect_container: `[模拟] 容器详情:\nID: ${request.arguments.container_id}\nName: my_container\nStatus: running\nPorts: 8080->80`,
      // Kubernetes
      k8s_list_pods: `[模拟] Kubernetes Pods:\nNAME        READY   STATUS    RESTARTS   AGE\nnginx-pod   1/1     Running   0          2d\napp-pod     2/2     Running   1          5d`,
      k8s_get_pod: `[模拟] Pod 详情:\nName: ${request.arguments.name}\nNamespace: ${request.arguments.namespace || 'default'}\nStatus: Running\nIP: 10.244.0.5`,
      k8s_list_services: `[模拟] Kubernetes Services:\nNAME        TYPE        CLUSTER-IP   PORT(S)\nkubernetes  ClusterIP   10.0.0.1    443/TCP\nnginx-svc   LoadBalancer 10.0.0.100 80/TCP`,
      // PostgreSQL additional
      pg_describe_table: `[模拟] 表结构:\nColumn     | Type        | Nullable\n-----------+-------------+----------\nid         | integer     | NO\nname       | varchar(255)| YES\ncreated_at | timestamp   | NO`,
      pg_explain: `[模拟] EXPLAIN 结果:\nSeq Scan on users  (cost=0.00..10.00 rows=1000 width=100)\n  Filter: (name = 'test')`,
    };

    const result = mockResults[request.name] || `[模拟] 工具 ${request.name} 执行成功`;

    return {
      content: [{ type: 'text', text: result }],
      isError: false,
    };
  }
}

interface MCPConnection {
  config: MCPServerConfig;
  connected: boolean;
  process?: any;
}

// Singleton instance
let mcpService: MCPService | null = null;

export function getMCPService(): MCPService {
  if (!mcpService) {
    mcpService = new MCPService();
  }
  return mcpService;
}
