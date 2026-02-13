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
