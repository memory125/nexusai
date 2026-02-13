import { useState, useEffect } from 'react';
import { useMCPStore } from '../stores/mcpStore';
import { getMCPService } from '../services/mcpService';
import type { MCPServerConfig, MCPTool, ToolPermission } from '../types/mcp';
import { BUILTIN_MCP_SERVERS } from '../types/mcp';
import {
  Plug,
  Server,
  Settings,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Wrench,
  Shield,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Terminal,
  Globe,
  Lock,
} from 'lucide-react';

export function MCPPage() {
  const {
    servers,
    statuses,
    toolPermissions,
    globalAutoApprove,
    addServer,
    updateServer,
    removeServer,
    toggleServer,
    setServerConnected,
    setServerTools,
    setToolPermission,
    setGlobalAutoApprove,
    getAllTools,
    getConnectedServers,
  } = useMCPStore();

  const [activeTab, setActiveTab] = useState<'servers' | 'tools' | 'settings'>('servers');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServerConfig | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());

  // Form states for adding/editing server
  const [formData, setFormData] = useState<Partial<MCPServerConfig>>({
    name: '',
    description: '',
    transport: 'stdio',
    command: '',
    args: [],
    env: {},
    url: '',
    timeout: 30000,
    autoApprove: false,
  });

  const mcpService = getMCPService();
  const allTools = getAllTools();
  const connectedServers = getConnectedServers();

  const handleConnect = async (server: MCPServerConfig) => {
    setConnecting(server.id);
    try {
      await mcpService.connectServer(server);
      const tools = await mcpService.listTools(server.id);
      setServerConnected(server.id, true);
      setServerTools(server.id, tools);
    } catch (error) {
      setServerConnected(server.id, false, String(error));
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (serverId: string) => {
    await mcpService.disconnectServer(serverId);
    setServerConnected(serverId, false);
  };

  const handleAddServer = () => {
    if (formData.name && (formData.command || formData.url)) {
      addServer(formData as Omit<MCPServerConfig, 'id'>);
      setShowAddModal(false);
      setFormData({
        name: '',
        description: '',
        transport: 'stdio',
        command: '',
        args: [],
        env: {},
        url: '',
        timeout: 30000,
        autoApprove: false,
      });
    }
  };

  const toggleExpand = (serverId: string) => {
    const newExpanded = new Set(expandedServers);
    if (newExpanded.has(serverId)) {
      newExpanded.delete(serverId);
    } else {
      newExpanded.add(serverId);
    }
    setExpandedServers(newExpanded);
  };

  const getPermissionBadge = (permission: ToolPermission) => {
    switch (permission) {
      case 'allow':
        return <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">允许</span>;
      case 'deny':
        return <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">拒绝</span>;
      default:
        return <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">询问</span>;
    }
  };

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20">
            <Plug className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">MCP 工具服务</h2>
            <p className="text-xs text-white/60">
              Model Context Protocol - 连接外部工具和 API
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">
            {connectedServers.length} 个已连接
          </span>
          <span className="text-sm text-white/60">|</span>
          <span className="text-sm text-white/60">{allTools.length} 个工具</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('servers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'servers'
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Server className="h-4 w-4" />
          服务器
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'tools'
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Wrench className="h-4 w-4" />
          工具权限
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="h-4 w-4" />
          设置
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'servers' && (
          <div className="space-y-4">
            {/* Add Server Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>添加 MCP 服务器</span>
            </button>

            {/* Server List */}
            {servers.map((server) => {
              const status = statuses[server.id];
              const isExpanded = expandedServers.has(server.id);

              return (
                <div
                  key={server.id}
                  className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          status?.connected
                            ? 'bg-green-500/20 text-green-400'
                            : server.enabled
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {status?.connected ? (
                          <Power className="h-5 w-5" />
                        ) : (
                          <PowerOff className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{server.name}</h3>
                        <p className="text-xs text-white/50">{server.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {status?.connected && (
                            <span className="text-xs text-green-400">
                              {status.tools?.length || 0} 个工具
                            </span>
                          )}
                          {status?.error && (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              连接失败
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status?.connected ? (
                        <button
                          onClick={() => handleDisconnect(server.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                        >
                          <PowerOff className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(server)}
                          disabled={!server.enabled || connecting === server.id}
                          className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50"
                        >
                          {connecting === server.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => toggleExpand(server.id)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-all"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-white/60" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-white/60" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleServer(server.id)}
                        className={`p-2 rounded-lg transition-all ${
                          server.enabled
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {server.enabled ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && status?.tools && (
                    <div className="border-t border-white/10 p-4">
                      <h4 className="text-sm font-medium text-white/80 mb-3">可用工具</h4>
                      <div className="space-y-2">
                        {status.tools.map((tool) => (
                          <div
                            key={tool.name}
                            className="p-3 rounded-lg bg-white/5 text-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white">{tool.name}</span>
                              {getPermissionBadge(
                                toolPermissions.find(
                                  (p) => p.toolName === tool.name && p.serverId === server.id
                                )?.permission || 'ask'
                              )}
                            </div>
                            <p className="text-xs text-white/50">{tool.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-violet-400" />
                <div>
                  <h3 className="font-medium text-white">全局自动批准</h3>
                  <p className="text-xs text-white/50">自动执行所有工具调用，不询问确认</p>
                </div>
              </div>
              <button
                onClick={() => setGlobalAutoApprove(!globalAutoApprove)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  globalAutoApprove ? 'bg-violet-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    globalAutoApprove ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              {allTools.map((tool) => {
                const permission =
                  toolPermissions.find(
                    (p) => p.toolName === tool.name && p.serverId === tool.serverId
                  )?.permission || 'ask';

                return (
                  <div
                    key={`${tool.serverId}-${tool.name}`}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-white/40" />
                          <span className="font-medium text-white">{tool.name}</span>
                          <span className="text-xs text-white/40">({tool.serverId})</span>
                        </div>
                        <p className="text-sm text-white/60 mt-1">{tool.description}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {(['ask', 'allow', 'deny'] as ToolPermission[]).map((p) => (
                          <button
                            key={p}
                            onClick={() => setToolPermission(tool.name, tool.serverId, p)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                              permission === p
                                ? p === 'allow'
                                  ? 'bg-green-500/20 text-green-400'
                                  : p === 'deny'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                                : 'text-white/40 hover:text-white/60'
                            }`}
                          >
                            {p === 'allow' ? '允许' : p === 'deny' ? '拒绝' : '询问'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-medium text-white mb-4">关于 MCP</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Model Context Protocol (MCP) 是 Anthropic 推出的开放协议，
                允许 AI 助手通过标准化的方式连接到外部数据源和工具。
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Terminal className="h-4 w-4" />
                  <span>支持 stdio、HTTP、WebSocket 传输</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Globe className="h-4 w-4" />
                  <span>内置 8 个常用 MCP 服务器</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Lock className="h-4 w-4" />
                  <span>细粒度的工具权限控制</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-medium text-white mb-4">内置服务器</h3>
              <div className="grid grid-cols-2 gap-3">
                {BUILTIN_MCP_SERVERS.map((server) => (
                  <div
                    key={server.id}
                    className="p-3 rounded-lg bg-white/5 text-sm"
                  >
                    <div className="font-medium text-white">{server.name}</div>
                    <div className="text-xs text-white/50 mt-1">
                      {server.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Server Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">添加 MCP 服务器</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                  placeholder="例如：文件系统"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">描述</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                  placeholder="简要描述服务器功能"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">传输方式</label>
                <select
                  value={formData.transport}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transport: e.target.value as 'stdio' | 'http' | 'websocket',
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
                >
                  <option value="stdio">stdio (标准输入输出)</option>
                  <option value="http">HTTP</option>
                  <option value="websocket">WebSocket</option>
                </select>
              </div>
              {formData.transport === 'stdio' ? (
                <div>
                  <label className="block text-sm text-white/60 mb-2">命令</label>
                  <input
                    type="text"
                    value={formData.command}
                    onChange={(e) =>
                      setFormData({ ...formData, command: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                    placeholder="例如：npx -y @modelcontextprotocol/server-filesystem"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-white/60 mb-2">URL</label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                    placeholder="例如：http://localhost:3000/sse"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleAddServer}
                  className="px-4 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-all"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
