import { useState, useEffect } from 'react';
import { usePluginStore } from '../stores/pluginStore';
import type { PluginManifest, MarketplacePlugin, PluginCategory } from '../types/plugin';
import {
  Puzzle,
  Download,
  Trash2,
  Settings,
  RefreshCw,
  X,
  Search,
  TrendingUp,
  Award,
  Grid,
  List,
  ExternalLink,
  Shield,
  AlertCircle,
  Play,
  Square,
  Package,
  Plus,
  ArrowUpDown,
} from 'lucide-react';

const categories: { id: PluginCategory | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'productivity', label: '生产力' },
  { id: 'developer-tools', label: '开发者工具' },
  { id: 'ai-enhancement', label: 'AI 增强' },
  { id: 'integration', label: '集成' },
  { id: 'utility', label: '实用工具' },
];

const formatDownloads = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
};

export function PluginPage() {
  const {
    plugins,
    marketplaceCache,
    installing,
    updating,
    uninstalling,
    error,
    installPlugin,
    uninstallPlugin,
    activatePlugin,
    deactivatePlugin,
    setPluginConfig,
    refreshMarketplace,
    searchMarketplace,
    getFeaturedPlugins,
    getTrendingPlugins,
    checkUpdateAvailable,
  } = usePluginStore();

  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed' | 'settings'>('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPlugin, setSelectedPlugin] = useState<PluginManifest | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'newest' | 'name'>('downloads');
  const [installedSearchQuery, setInstalledSearchQuery] = useState('');

  // Load marketplace on mount
  useEffect(() => {
    if (marketplaceCache.length === 0) {
      refreshMarketplace();
    }
  }, []);

  // Filter plugins based on search and category
  const getFilteredPlugins = () => {
    let result = marketplaceCache;

    if (searchQuery) {
      result = searchMarketplace(searchQuery);
    }

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.manifest.categories.includes(selectedCategory));
    }

    return result;
  };

  const handleInstall = async (manifest: PluginManifest) => {
    try {
      await installPlugin(manifest);
      // Auto-activate after install
      await activatePlugin(manifest.id);
    } catch (err) {
      console.error('Failed to install plugin:', err);
    }
  };

  const handleUninstall = async (id: string) => {
    try {
      await uninstallPlugin(id);
    } catch (err) {
      console.error('Failed to uninstall plugin:', err);
    }
  };

  const handleToggle = async (plugin: typeof plugins[0]) => {
    if (plugin.status === 'active') {
      await deactivatePlugin(plugin.manifest.id);
    } else {
      await activatePlugin(plugin.manifest.id);
    }
  };

  // Sort plugins
  const sortPlugins = (plugins: MarketplacePlugin[]) => {
    const sorted = [...plugins];
    switch (sortBy) {
      case 'downloads':
        return sorted.sort((a, b) => b.downloads - a.downloads);
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return sorted.sort((a, b) => new Date(b.manifest.version).getTime() - new Date(a.manifest.version).getTime());
      case 'name':
        return sorted.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
      default:
        return sorted;
    }
  };

  // Filter installed plugins
  const getFilteredInstalledPlugins = () => {
    let result = plugins;
    if (installedSearchQuery) {
      const query = installedSearchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.manifest.name.toLowerCase().includes(query) ||
          p.manifest.description.toLowerCase().includes(query)
      );
    }
    return result;
  };

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/20">
            <Puzzle className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">插件中心</h2>
            <p className="text-xs text-white/60">
              发现和使用插件扩展 NexusAI 功能
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">
            {plugins.filter((p) => p.status === 'active').length} 个运行中
          </span>
          <span className="text-sm text-white/60">|</span>
          <span className="text-sm text-white/60">{plugins.length} 个已安装</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'marketplace'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Download className="h-4 w-4" />
            插件市场
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'installed'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="h-4 w-4" />
            已安装
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="h-4 w-4" />
            设置
          </button>
        </div>

        {activeTab === 'marketplace' && (
          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="downloads" className="bg-slate-900">最多下载</option>
                <option value="rating" className="bg-slate-900">最高评分</option>
                <option value="newest" className="bg-slate-900">最新版本</option>
                <option value="name" className="bg-slate-900">名称</option>
              </select>
              <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40 pointer-events-none" />
            </div>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => refreshMarketplace()}
              disabled={!!installing}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${installing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索插件..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as PluginCategory | 'all')}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Section */}
            {!searchQuery && selectedCategory === 'all' && (
              <div>
                <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-400" />
                  精选插件
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {getFeaturedPlugins().slice(0, 3).map((plugin) => (
                    <PluginCard
                      key={plugin.manifest.id}
                      plugin={plugin}
                      installed={plugins.some((p) => p.manifest.id === plugin.manifest.id)}
                      onInstall={() => handleInstall(plugin.manifest)}
                      onClick={() => setSelectedPlugin(plugin.manifest)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Trending Section */}
            {!searchQuery && selectedCategory === 'all' && (
              <div>
                <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  热门趋势
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {getTrendingPlugins().slice(0, 3).map((plugin) => (
                    <PluginCard
                      key={plugin.manifest.id}
                      plugin={plugin}
                      installed={plugins.some((p) => p.manifest.id === plugin.manifest.id)}
                      onInstall={() => handleInstall(plugin.manifest)}
                      onClick={() => setSelectedPlugin(plugin.manifest)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Plugins */}
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-3">
                {searchQuery ? `搜索结果 (${getFilteredPlugins().length})` : `全部插件 (${getFilteredPlugins().length})`}
              </h3>
              <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-2'}>
                {sortPlugins(getFilteredPlugins()).map((plugin) => (
                  <PluginCard
                    key={plugin.manifest.id}
                    plugin={plugin}
                    installed={plugins.some((p) => p.manifest.id === plugin.manifest.id)}
                    installing={installing === plugin.manifest.id}
                    onInstall={() => handleInstall(plugin.manifest)}
                    onClick={() => setSelectedPlugin(plugin.manifest)}
                    compact={viewMode === 'list'}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'installed' && (
          <div className="space-y-4">
            {/* Search Installed Plugins */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={installedSearchQuery}
                onChange={(e) => setInstalledSearchQuery(e.target.value)}
                placeholder="搜索已安装插件..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            
            {getFilteredInstalledPlugins().length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-white/20 mb-4" />
                <p className="text-white/60">
                  {installedSearchQuery ? '没有找到匹配的插件' : '还没有安装任何插件'}
                </p>
                {!installedSearchQuery && (
                  <button
                    onClick={() => setActiveTab('marketplace')}
                    className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all"
                  >
                    浏览插件市场
                  </button>
                )}
              </div>
            ) : (
              getFilteredInstalledPlugins().map((plugin) => (
                <div
                  key={plugin.manifest.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-600/20">
                      <Puzzle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{plugin.manifest.name}</span>
                        <span className="text-xs text-white/40">v{plugin.manifest.version}</span>
                        {plugin.status === 'active' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                            运行中
                          </span>
                        )}
                        {plugin.status === 'error' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                            错误
                          </span>
                        )}
                        {checkUpdateAvailable(plugin.manifest.id) && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                            有更新
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/50">{plugin.manifest.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {plugin.manifest.configSchema && (
                      <button
                        onClick={() => {
                          setSelectedPlugin(plugin.manifest);
                          setShowConfigModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 transition-all"
                        title="配置"
                      >
                        <Settings className="h-4 w-4 text-white/60" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggle(plugin)}
                      disabled={updating === plugin.manifest.id}
                      className={`p-2 rounded-lg transition-all ${
                        plugin.status === 'active'
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {plugin.status === 'active' ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleUninstall(plugin.manifest.id)}
                      disabled={uninstalling === plugin.manifest.id}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-medium text-white mb-4">关于插件系统</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                NexusAI 插件系统允许开发者使用 JavaScript/TypeScript 创建扩展，
                为应用添加新功能。插件可以访问对话、模型、RAG 知识库、MCP 工具等 API。
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="font-medium text-white mb-1">权限控制</div>
                  <div className="text-white/50">每个插件都需要申请特定权限</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="font-medium text-white mb-1">热插拔</div>
                  <div className="text-white/50">无需重启即可启用/禁用插件</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="font-medium text-white mb-1">安全沙箱</div>
                  <div className="text-white/50">插件在隔离环境中运行</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="font-medium text-white mb-1">自动更新</div>
                  <div className="text-white/50">插件有新版本时自动提醒</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-medium text-white mb-4">开发文档</h3>
              <p className="text-sm text-white/60 mb-4">
                想要创建自己的插件？查看开发文档和示例代码。
              </p>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all">
                <ExternalLink className="h-4 w-4" />
                查看文档
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plugin Detail Modal */}
      {selectedPlugin && !showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/10 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20">
                  <Puzzle className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedPlugin.name}</h3>
                  <p className="text-sm text-white/60">
                    v{selectedPlugin.version} by {selectedPlugin.author}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedPlugin.categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlugin(null)}
                className="p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-1.5 text-white/70">
                <Download className="h-4 w-4" />
                <span className="text-sm">{formatDownloads(marketplaceCache.find(p => p.manifest.id === selectedPlugin.id)?.downloads || 0)} 次下载</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/70">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">{marketplaceCache.find(p => p.manifest.id === selectedPlugin.id)?.rating.toFixed(1) || '0.0'} 评分</span>
              </div>
            </div>

            <p className="text-white/80 mb-6">{selectedPlugin.description}</p>

            <div className="mb-6">
              <h4 className="font-medium text-white mb-3">所需权限</h4>
              <div className="flex flex-wrap gap-2">
                {selectedPlugin.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="text-xs px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  >
                    <Shield className="h-3 w-3 inline mr-1" />
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            {selectedPlugin.configSchema && (
              <div className="mb-6">
                <h4 className="font-medium text-white mb-3">配置选项</h4>
                <div className="space-y-2">
                  {Object.entries(selectedPlugin.configSchema.properties).map(([key, prop]) => (
                    <div key={key} className="p-3 rounded-lg bg-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{prop.title || key}</span>
                        <span className="text-xs text-white/40">{prop.type}</span>
                      </div>
                      {prop.description && (
                        <p className="text-xs text-white/50 mt-1">{prop.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {plugins.some((p) => p.manifest.id === selectedPlugin.id) ? (
                <>
                  <button
                    onClick={() => {
                      setShowConfigModal(true);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    配置
                  </button>
                  <button
                    onClick={() => handleUninstall(selectedPlugin.id)}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    卸载
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleInstall(selectedPlugin)}
                  disabled={installing === selectedPlugin.id}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  {installing === selectedPlugin.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    '安装'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && selectedPlugin && (
        <PluginConfigModal
          plugin={selectedPlugin}
          config={plugins.find((p) => p.manifest.id === selectedPlugin.id)?.config || {}}
          onSave={(config) => {
            setPluginConfig(selectedPlugin.id, config);
            setShowConfigModal(false);
          }}
          onClose={() => {
            setShowConfigModal(false);
            if (!plugins.some((p) => p.manifest.id === selectedPlugin.id)) {
              setSelectedPlugin(null);
            }
          }}
        />
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
          <button onClick={() => usePluginStore.setState({ error: null })}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Plugin Card Component
interface PluginCardProps {
  plugin: MarketplacePlugin;
  installed: boolean;
  installing?: boolean;
  onInstall: () => void;
  onClick: () => void;
  compact?: boolean;
}

function PluginCard({ plugin, installed, installing, onInstall, onClick, compact }: PluginCardProps) {
  if (compact) {
    return (
      <div
        onClick={onClick}
        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 cursor-pointer transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-600/20">
            <Puzzle className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <div className="font-medium text-white text-sm">{plugin.manifest.name}</div>
            <div className="text-xs text-white/50">{plugin.manifest.author}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {installed ? (
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
              已安装
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInstall();
              }}
              disabled={installing}
              className="px-3 py-1 rounded-lg bg-blue-500 text-white text-xs hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              {installing ? <RefreshCw className="h-3 w-3 animate-spin" /> : '安装'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20">
          <Puzzle className="h-6 w-6 text-blue-400" />
        </div>
        {installed ? (
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
            已安装
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInstall();
            }}
            disabled={installing}
            className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {installing ? <RefreshCw className="h-4 w-4 animate-spin" /> : '安装'}
          </button>
        )}
      </div>
      <h4 className="font-medium text-white mb-1">{plugin.manifest.name}</h4>
      <p className="text-sm text-white/50 mb-2 line-clamp-2">{plugin.manifest.description}</p>
      {/* Category Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {plugin.manifest.categories.slice(0, 2).map((cat) => (
          <span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50">
            {cat}
          </span>
        ))}
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50">
          v{plugin.manifest.version}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>{plugin.manifest.author}</span>
        <div className="flex items-center gap-2">
          <span>⭐ {plugin.rating.toFixed(1)}</span>
          <span>↓ {formatDownloads(plugin.downloads)}</span>
        </div>
      </div>
    </div>
  );
}

// Plugin Config Modal
interface PluginConfigModalProps {
  plugin: PluginManifest;
  config: Record<string, any>;
  onSave: (config: Record<string, any>) => void;
  onClose: () => void;
}

function PluginConfigModal({ plugin, config, onSave, onClose }: PluginConfigModalProps) {
  const [localConfig, setLocalConfig] = useState(config);

  if (!plugin.configSchema?.properties) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">配置 {plugin.name}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
              <X className="h-5 w-5 text-white/60" />
            </button>
          </div>
          <p className="text-white/60">此插件没有可配置的选项。</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">配置 {plugin.name}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(plugin.configSchema.properties).map(([key, prop]) => (
            <div key={key}>
              <label className="block text-sm text-white/80 mb-2">
                {prop.title || key}
                {plugin.configSchema?.required?.includes(key) && (
                  <span className="text-red-400 ml-1">*</span>
                )}
              </label>
              {prop.description && (
                <p className="text-xs text-white/50 mb-2">{prop.description}</p>
              )}

              {prop.type === 'boolean' && (
                <button
                  onClick={() =>
                    setLocalConfig({ ...localConfig, [key]: !localConfig[key] })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localConfig[key] ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localConfig[key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}

              {prop.type === 'string' && (
                <input
                  type="text"
                  value={localConfig[key] || ''}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, [key]: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                  placeholder={prop.default}
                />
              )}

              {prop.type === 'number' && (
                <input
                  type="number"
                  value={localConfig[key] || ''}
                  min={prop.min}
                  max={prop.max}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, [key]: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
              )}

              {prop.type === 'select' && prop.enum && (
                <select
                  value={localConfig[key] || prop.default}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, [key]: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                >
                  {prop.enum.map((option) => (
                    <option key={option} value={option} className="bg-slate-900">
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {prop.type === 'array' && (
                <div className="space-y-2">
                  {(localConfig[key] || []).map((item: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newArray = [...(localConfig[key] || [])];
                          newArray[index] = e.target.value;
                          setLocalConfig({ ...localConfig, [key]: newArray });
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                      />
                      <button
                        onClick={() => {
                          const newArray = (localConfig[key] || []).filter(
                            (_: any, i: number) => i !== index
                          );
                          setLocalConfig({ ...localConfig, [key]: newArray });
                        }}
                        className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setLocalConfig({
                        ...localConfig,
                        [key]: [...(localConfig[key] || []), ''],
                      })
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    添加
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all"
          >
            取消
          </button>
          <button
            onClick={() => onSave(localConfig)}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
