import { useState, useEffect } from 'react';
import { usePluginStore } from '../stores/pluginStore';
import type { PluginManifest, MarketplacePlugin, PluginCategory } from '../types/plugin';
import { runCode, testApi, webSearch, analyzeText, calc, shortenUrl, notesOps, tasksOps, summarizeText, translateText } from '../services/pluginImplementations';
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
  Zap,
  Code2,
  Globe,
  Activity,
  Link2,
  Type,
  Calculator,
  ClipboardList,
  StickyNote,
  Languages,
  FileText,
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

  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed' | 'tools' | 'settings'>('marketplace');
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--t-accent-subtle)', border: '1px solid var(--t-accent-border)' }}>
            <Puzzle className="h-5 w-5" style={{ color: 'var(--t-accent-light)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--t-text)' }}>插件中心</h2>
            <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
              发现和使用插件扩展 NexusAI 功能
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--t-text-muted)' }}>
            {plugins.filter((p) => p.status === 'active').length} 个运行中
          </span>
          <span className="text-sm" style={{ color: 'var(--t-text-muted)' }}>|</span>
          <span className="text-sm" style={{ color: 'var(--t-text-muted)' }}>{plugins.length} 个已安装</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            style={{
              background: activeTab === 'marketplace' ? 'var(--t-accent-subtle)' : 'transparent',
              color: activeTab === 'marketplace' ? 'var(--t-accent-light)' : 'var(--t-text-muted)',
              border: `1px solid ${activeTab === 'marketplace' ? 'var(--t-accent-border)' : 'transparent'}`
            }}
          >
            <Download className="h-4 w-4" />
            插件市场
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            style={{
              background: activeTab === 'installed' ? 'var(--t-accent-subtle)' : 'transparent',
              color: activeTab === 'installed' ? 'var(--t-accent-light)' : 'var(--t-text-muted)',
              border: `1px solid ${activeTab === 'installed' ? 'var(--t-accent-border)' : 'transparent'}`
            }}
          >
            <Package className="h-4 w-4" />
            已安装
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            style={{
              background: activeTab === 'settings' ? 'var(--t-accent-subtle)' : 'transparent',
              color: activeTab === 'settings' ? 'var(--t-accent-light)' : 'var(--t-text-muted)',
              border: `1px solid ${activeTab === 'settings' ? 'var(--t-accent-border)' : 'transparent'}`
            }}
          >
            <Settings className="h-4 w-4" />
            设置
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            style={{
              background: activeTab === 'tools' ? 'var(--t-accent-subtle)' : 'transparent',
              color: activeTab === 'tools' ? 'var(--t-accent-light)' : 'var(--t-text-muted)',
              border: `1px solid ${activeTab === 'tools' ? 'var(--t-accent-border)' : 'transparent'}`
            }}
          >
            <Zap className="h-4 w-4" />
            实用工具
          </button>
        </div>

        {activeTab === 'marketplace' && (
          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-sm focus:outline-none cursor-pointer"
                style={{ background: 'var(--t-glass-card)', color: 'var(--t-text)', border: '1px solid var(--t-glass-border)' }}
              >
                <option value="downloads" style={{ background: 'var(--t-glass-card)' }}>最多下载</option>
                <option value="rating" style={{ background: 'var(--t-glass-card)' }}>最高评分</option>
                <option value="newest" style={{ background: 'var(--t-glass-card)' }}>最新版本</option>
                <option value="name" style={{ background: 'var(--t-glass-card)' }}>名称</option>
              </select>
              <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--t-text-muted)' }} />
            </div>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all`}
              style={{
                background: viewMode === 'grid' ? 'var(--t-accent-subtle)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--t-accent-light)' : 'var(--t-text-muted)'
              }}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all`}
              style={{
                background: viewMode === 'list' ? 'var(--t-accent-subtle)' : 'transparent',
                color: viewMode === 'list' ? 'var(--t-accent-light)' : 'var(--t-text-muted)'
              }}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => refreshMarketplace()}
              disabled={!!installing}
              className="p-2 rounded-lg transition-all disabled:opacity-50"
              style={{ color: 'var(--t-text-muted)' }}
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--t-text-muted)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索插件..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none"
                  style={{ background: 'var(--t-glass-card)', color: 'var(--t-text)', border: '1px solid var(--t-glass-border)' }}
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as PluginCategory | 'all')}
                className="px-4 py-2 rounded-lg focus:outline-none"
                style={{ background: 'var(--t-glass-card)', color: 'var(--t-text)', border: '1px solid var(--t-glass-border)' }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} style={{ background: 'var(--t-glass-card)' }}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Section */}
            {!searchQuery && selectedCategory === 'all' && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--t-text-secondary)' }}>
                  <Award className="h-4 w-4" style={{ color: '#fbbf24' }} />
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
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--t-text-secondary)' }}>
                  <TrendingUp className="h-4 w-4" style={{ color: '#4ade80' }} />
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
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--t-text-secondary)' }}>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--t-text-muted)' }} />
              <input
                type="text"
                value={installedSearchQuery}
                onChange={(e) => setInstalledSearchQuery(e.target.value)}
                placeholder="搜索已安装插件..."
                className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none"
                style={{ background: 'var(--t-glass-card)', color: 'var(--t-text)', border: '1px solid var(--t-glass-border)' }}
              />
            </div>
            
            {getFilteredInstalledPlugins().length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--t-text-muted)' }} />
                <p style={{ color: 'var(--t-text-muted)' }}>
                  {installedSearchQuery ? '没有找到匹配的插件' : '还没有安装任何插件'}
                </p>
                {!installedSearchQuery && (
                  <button
                    onClick={() => setActiveTab('marketplace')}
                    className="mt-4 px-4 py-2 rounded-lg transition-all"
                    style={{ background: 'var(--t-accent)', color: 'white' }}
                  >
                    浏览插件市场
                  </button>
                )}
              </div>
            ) : (
              getFilteredInstalledPlugins().map((plugin) => (
                <div
                  key={plugin.manifest.id}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'var(--t-accent-subtle)' }}>
                      <Puzzle className="h-5 w-5" style={{ color: 'var(--t-accent-light)' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium" style={{ color: 'var(--t-text)' }}>{plugin.manifest.name}</span>
                        <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>v{plugin.manifest.version}</span>
                        {plugin.status === 'active' && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
                            运行中
                          </span>
                        )}
                        {plugin.status === 'error' && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                            错误
                          </span>
                        )}
                        {checkUpdateAvailable(plugin.manifest.id) && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(234,179,8,0.2)', color: '#eab308' }}>
                            有更新
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--t-text-muted)' }}>{plugin.manifest.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {plugin.manifest.configSchema && (
                      <button
                        onClick={() => {
                          setSelectedPlugin(plugin.manifest);
                          setShowConfigModal(true);
                        }}
                        className="p-2 rounded-lg transition-all"
                        style={{ color: 'var(--t-text-muted)' }}
                        title="配置"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggle(plugin)}
                      disabled={updating === plugin.manifest.id}
                      className={`p-2 rounded-lg transition-all`}
                      style={{
                        background: plugin.status === 'active' ? 'rgba(34,197,94,0.1)' : 'var(--t-glass-card)',
                        color: plugin.status === 'active' ? '#4ade80' : 'var(--t-text-muted)'
                      }}
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
                      className="p-2 rounded-lg transition-all"
                      style={{ color: 'var(--t-text-muted)' }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tools' && <PluginToolsPanel />}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl" style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}>
              <h3 className="font-medium mb-4" style={{ color: 'var(--t-text)' }}>关于插件系统</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--t-text-secondary)' }}>
                NexusAI 插件系统允许开发者使用 JavaScript/TypeScript 创建扩展，
                为应用添加新功能。插件可以访问对话、模型、RAG 知识库、MCP 工具等 API。
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg" style={{ background: 'var(--t-glass-input)' }}>
                  <div className="font-medium mb-1" style={{ color: 'var(--t-text)' }}>权限控制</div>
                  <div style={{ color: 'var(--t-text-muted)' }}>每个插件都需要申请特定权限</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'var(--t-glass-input)' }}>
                  <div className="font-medium mb-1" style={{ color: 'var(--t-text)' }}>热插拔</div>
                  <div style={{ color: 'var(--t-text-muted)' }}>无需重启即可启用/禁用插件</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'var(--t-glass-input)' }}>
                  <div className="font-medium mb-1" style={{ color: 'var(--t-text)' }}>安全沙箱</div>
                  <div style={{ color: 'var(--t-text-muted)' }}>插件在隔离环境中运行</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'var(--t-glass-input)' }}>
                  <div className="font-medium mb-1" style={{ color: 'var(--t-text)' }}>自动更新</div>
                  <div style={{ color: 'var(--t-text-muted)' }}>插件有新版本时自动提醒</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl" style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}>
              <h3 className="font-medium mb-4" style={{ color: 'var(--t-text)' }}>开发文档</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--t-text-secondary)' }}>
                想要创建自己的插件？查看开发文档和示例代码。
              </p>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: 'var(--t-accent)', color: 'white' }}>
                <ExternalLink className="h-4 w-4" />
                查看文档
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plugin Detail Modal */}
      {selectedPlugin && !showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl p-6" style={{ background: 'var(--t-glass-bg)', border: '1px solid var(--t-glass-border)' }}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl" style={{ background: 'var(--t-accent-subtle)' }}>
                  <Puzzle className="h-8 w-8" style={{ color: 'var(--t-accent-light)' }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--t-text)' }}>{selectedPlugin.name}</h3>
                  <p className="text-sm" style={{ color: 'var(--t-text-secondary)' }}>
                    v{selectedPlugin.version} by {selectedPlugin.author}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedPlugin.categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--t-glass-input)', color: 'var(--t-text-muted)' }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlugin(null)}
                className="p-2 rounded-lg transition-all"
                style={{ color: 'var(--t-text-muted)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 p-3 rounded-lg" style={{ background: 'var(--t-glass-input)' }}>
              <div className="flex items-center gap-1.5" style={{ color: 'var(--t-text-secondary)' }}>
                <Download className="h-4 w-4" />
                <span className="text-sm">{formatDownloads(marketplaceCache.find(p => p.manifest.id === selectedPlugin.id)?.downloads || 0)} 次下载</span>
              </div>
              <div className="flex items-center gap-1.5" style={{ color: 'var(--t-text-secondary)' }}>
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">{marketplaceCache.find(p => p.manifest.id === selectedPlugin.id)?.rating.toFixed(1) || '0.0'} 评分</span>
              </div>
            </div>

            <p className="mb-6" style={{ color: 'var(--t-text-secondary)' }}>{selectedPlugin.description}</p>

            <div className="mb-6">
              <h4 className="font-medium mb-3" style={{ color: 'var(--t-text)' }}>所需权限</h4>
              <div className="flex flex-wrap gap-2">
                {selectedPlugin.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', border: '1px solid rgba(234,179,8,0.2)' }}
                  >
                    <Shield className="h-3 w-3 inline mr-1" />
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            {selectedPlugin.configSchema && (
              <div className="mb-6">
                <h4 className="font-medium mb-3" style={{ color: 'var(--t-text)' }}>配置选项</h4>
                <div className="space-y-2">
                  {Object.entries(selectedPlugin.configSchema.properties).map(([key, prop]) => (
                    <div key={key} className="p-3 rounded-lg" style={{ background: 'var(--t-glass-input)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{prop.title || key}</span>
                        <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{prop.type}</span>
                      </div>
                      {prop.description && (
                        <p className="text-xs mt-1" style={{ color: 'var(--t-text-muted)' }}>{prop.description}</p>
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
                    className="flex-1 px-4 py-2 rounded-lg transition-all"
                    style={{ background: 'var(--t-glass-card)', color: 'var(--t-text)' }}
                  >
                    配置
                  </button>
                  <button
                    onClick={() => handleUninstall(selectedPlugin.id)}
                    className="flex-1 px-4 py-2 rounded-lg transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                  >
                    卸载
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleInstall(selectedPlugin)}
                  disabled={installing === selectedPlugin.id}
                  className="flex-1 px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                  style={{ background: 'var(--t-accent)', color: 'white' }}
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

// ========== Plugin Tools Panel - 8 real working tools ==========
type ToolId = 'code-runner' | 'api-tester' | 'web-search' | 'word-counter' | 'calculator' | 'url-shortener' | 'quick-notes' | 'task-manager' | 'translator' | 'summarizer';

const TOOL_DEFS: Array<{ id: ToolId; name: string; description: string; icon: any; color: string }> = [
  { id: 'code-runner', name: '代码运行器', description: '浏览器沙箱执行 JavaScript,带超时保护', icon: Code2, color: 'blue' },
  { id: 'api-tester', name: 'API 测试', description: 'HTTP 请求测试,返回状态/头/体/耗时', icon: Activity, color: 'purple' },
  { id: 'web-search', name: 'Web 搜索', description: 'DuckDuckGo / Google 真实搜索', icon: Globe, color: 'emerald' },
  { id: 'word-counter', name: '字数统计', description: '字符/词数/行数/句数/阅读时间/高频词', icon: Type, color: 'amber' },
  { id: 'calculator', name: '计算器', description: '支持三角函数/对数/π/e/数学常量', icon: Calculator, color: 'pink' },
  { id: 'url-shortener', name: 'URL 缩短', description: 'is.gd 真实短链服务', icon: Link2, color: 'cyan' },
  { id: 'quick-notes', name: '快速笔记', description: 'localStorage 持久化 CRUD', icon: StickyNote, color: 'yellow' },
  { id: 'task-manager', name: '任务管理', description: '待办清单 + 优先级 + 完成状态', icon: ClipboardList, color: 'rose' },
  { id: 'translator', name: 'AI 翻译', description: '调用当前对话模型翻译', icon: Languages, color: 'indigo' },
  { id: 'summarizer', name: 'AI 摘要', description: '调用当前对话模型生成摘要', icon: FileText, color: 'teal' },
];

function PluginToolsPanel() {
  const [activeTool, setActiveTool] = useState<ToolId>('code-runner');

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl" style={{ background: 'var(--t-accent-subtle)', border: '1px solid var(--t-accent-border)' }}>
        <h3 className="font-medium flex items-center gap-2 mb-1" style={{ color: 'var(--t-text)' }}>
          <Zap className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
          实用工具箱
        </h3>
        <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
          10 个真实可用的工具 · 所有数据在浏览器本地处理 · 无需后端服务
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {TOOL_DEFS.map(t => {
          const Icon = t.icon;
          const active = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              className="flex flex-col items-start gap-1 p-3 rounded-lg text-left transition-all"
              style={{
                background: active ? 'var(--t-accent-subtle)' : 'var(--t-glass-card)',
                border: `1px solid ${active ? 'var(--t-accent-border)' : 'var(--t-glass-border)'}`,
              }}
            >
              <Icon className="h-4 w-4" style={{ color: active ? 'var(--t-accent-light)' : 'var(--t-text-muted)' }} />
              <div className="text-xs font-medium" style={{ color: 'var(--t-text)' }}>{t.name}</div>
            </button>
          );
        })}
      </div>

      <div className="p-5 rounded-xl" style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}>
        {activeTool === 'code-runner' && <CodeRunnerTool />}
        {activeTool === 'api-tester' && <ApiTesterTool />}
        {activeTool === 'web-search' && <WebSearchTool />}
        {activeTool === 'word-counter' && <WordCounterTool />}
        {activeTool === 'calculator' && <CalculatorTool />}
        {activeTool === 'url-shortener' && <UrlShortenerTool />}
        {activeTool === 'quick-notes' && <QuickNotesTool />}
        {activeTool === 'task-manager' && <TaskManagerTool />}
        {activeTool === 'translator' && <TranslatorTool />}
        {activeTool === 'summarizer' && <SummarizerTool />}
      </div>
    </div>
  );
}

function CodeRunnerTool() {
  const [code, setCode] = useState('// 试试: console.log("hello");\nconst arr = [1, 2, 3, 4, 5];\nconsole.log("sum:", arr.reduce((a, b) => a + b, 0));\nconsole.log("even:", arr.filter(x => x % 2 === 0));');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const run = async () => {
    setRunning(true);
    const r = await runCode('javascript', code, 5000);
    setOutput((r.output || '') + (r.error ? `\n❌ ${r.error}` : ''));
    setDuration(r.durationMs);
    setRunning(false);
  };

  return (
    <div>
      <h4 className="font-medium mb-3" style={{ color: 'var(--t-text)' }}>JavaScript 代码执行 (5秒超时)</h4>
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        className="w-full p-3 rounded-lg font-mono text-xs"
        rows={10}
        style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--t-text)', border: '1px solid var(--t-glass-border)' }}
      />
      <div className="flex items-center gap-2 mt-2">
        <button onClick={run} disabled={running} className="px-4 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm disabled:opacity-50 flex items-center gap-1.5">
          {running ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          {running ? '执行中' : '运行'}
        </button>
        {duration !== null && <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>耗时 {duration}ms</span>}
      </div>
      {output && (
        <pre className="mt-3 p-3 rounded-lg text-xs font-mono overflow-auto max-h-64" style={{ background: 'rgba(0,0,0,0.4)', color: '#a5f3fc' }}>
          {output}
        </pre>
      )}
    </div>
  );
}

function ApiTesterTool() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://api.github.com/repos/memory125/nexusai');
  const [headers, setHeaders] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await testApi({ method, url, headers, body });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  };

  return (
    <div>
      <h4 className="font-medium mb-3" style={{ color: 'var(--t-text)' }}>HTTP API 测试</h4>
      <div className="flex gap-2 mb-2">
        <select value={method} onChange={e => setMethod(e.target.value)} className="px-2 py-2 rounded-lg text-sm" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }}>
          {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input value={url} onChange={e => setUrl(e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }} />
        <button onClick={run} disabled={loading} className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm disabled:opacity-50 flex items-center gap-1.5">
          {loading ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          {loading ? '请求中' : '发送'}
        </button>
      </div>
      <details className="text-xs mb-2">
        <summary style={{ color: 'var(--t-text-secondary)', cursor: 'pointer' }}>Headers / Body</summary>
        <textarea value={headers} onChange={e => setHeaders(e.target.value)} placeholder='{"Authorization": "Bearer ..."}' rows={2} className="mt-1 w-full p-2 rounded font-mono" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--t-text)' }} />
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="请求体" rows={2} className="mt-1 w-full p-2 rounded font-mono" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--t-text)' }} />
      </details>
      {error && <div className="text-xs text-red-400">⚠️ {error}</div>}
      {result && (
        <div className="rounded-lg p-3 space-y-1 text-xs" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded font-bold ${result.ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{result.status} {result.statusText}</span>
            <span style={{ color: 'var(--t-text-muted)' }}>耗时 {result.durationMs}ms</span>
            <span style={{ color: 'var(--t-text-muted)' }}>{result.sizeBytes}B</span>
          </div>
          <pre className="mt-2 p-2 rounded overflow-auto max-h-48 text-xs font-mono" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--t-text-secondary)' }}>
            {result.bodyJson ? JSON.stringify(result.bodyJson, null, 2) : result.bodyText}
          </pre>
        </div>
      )}
    </div>
  );
}

function WebSearchTool() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ title: string; url: string; snippet: string }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await webSearch(query, 8);
      setResults(r);
      if (r.length === 0) setErr('未找到结果');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  };

  return (
    <div>
      <h4 className="font-medium mb-3" style={{ color: 'var(--t-text)' }}>真实 Web 搜索 (DuckDuckGo / Google)</h4>
      <div className="flex gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="输入搜索关键词..." className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }} />
        <button onClick={search} disabled={loading} className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm disabled:opacity-50 flex items-center gap-1.5">
          {loading ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
          {loading ? '搜索中' : '搜索'}
        </button>
      </div>
      {err && <div className="mt-2 text-xs text-amber-400">⚠️ {err}</div>}
      {results && results.length > 0 && (
        <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline" style={{ color: 'var(--t-accent-light)' }}>{r.title}</a>
              <div className="text-xs truncate" style={{ color: 'var(--t-text-muted)' }}>{r.url}</div>
              {r.snippet && <p className="text-xs mt-1" style={{ color: 'var(--t-text-secondary)' }}>{r.snippet}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WordCounterTool() {
  const [text, setText] = useState('');
  const stats = text ? analyzeText(text) : null;
  return (
    <div>
      <h4 className="font-medium mb-3" style={{ color: 'var(--t-text)' }}>文本分析</h4>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={6} placeholder="粘贴或输入文本..." className="w-full p-3 rounded-lg text-sm" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }} />
      {stats && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <Stat label="字符(含空格)" value={stats.chars} />
          <Stat label="字符(无空格)" value={stats.charsNoSpace} />
          <Stat label="词数" value={stats.words} />
          <Stat label="行数" value={stats.lines} />
          <Stat label="句数" value={stats.sentences} />
          <Stat label="段落" value={stats.paragraphs} />
          <Stat label="阅读时间" value={`${stats.readingMinutes} 分钟`} />
          <Stat label="Top 5 词" value={stats.topWords.map(([w]) => w).join(', ') || '-'} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)' }}>
      <div className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>{label}</div>
      <div className="font-mono font-medium" style={{ color: 'var(--t-text)' }}>{value}</div>
    </div>
  );
}

function CalculatorTool() {
  const [expr, setExpr] = useState('2 * (3 + 4) / 5');
  const r = calc(expr);
  return (
    <div>
      <h4 className="font-medium mb-3" style={{ color: 'var(--t-text)' }}>科学计算器 (支持 + − × ÷ sin cos tan log √ π e)</h4>
      <input value={expr} onChange={e => setExpr(e.target.value)} placeholder="数学表达式" className="w-full p-3 rounded-lg text-sm font-mono" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }} />
      <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="text-xs mb-1" style={{ color: 'var(--t-text-muted)' }}>结果</div>
        {r.ok ? (
          <div className="text-2xl font-mono font-bold" style={{ color: '#a5f3fc' }}>{r.value}</div>
        ) : (
          <div className="text-sm text-red-400">⚠️ {r.error}</div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1 text-xs">
        {['π', 'e', 'sin(π/2)', 'cos(0)', 'sqrt(144)', 'log(100)', 'pow(2,10)'].map(s => (
          <button key={s} onClick={() => setExpr(s)} className="px-2 py-1 rounded" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text-secondary)' }}>{s}</button>
        ))}
      </div>
    </div>
  );
}

function UrlShortenerTool() {
  const [url, setUrl] = useState('https://github.com/memory125/nexusai');
  const [result, setResult] = useState<{ ok: boolean; shortUrl?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    const r = await shortenUrl(url);
    setResult(r);
    setLoading(false);
  };
  return (
    <div>
      <h4 className="font-medium mb-3" style={{ color: 'var(--t-text)' }}>URL 短链 (is.gd)</h4>
      <div className="flex gap-2">
        <input value={url} onChange={e => setUrl(e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }} />
        <button onClick={run} disabled={loading} className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm disabled:opacity-50 flex items-center gap-1.5">
          {loading ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
          缩短
        </button>
      </div>
      {result?.ok && (
        <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>短链</div>
          <a href={result.shortUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-sm" style={{ color: 'var(--t-accent-light)' }}>{result.shortUrl}</a>
        </div>
      )}
      {result && !result.ok && <div className="mt-2 text-xs text-red-400">⚠️ {result.error}</div>}
    </div>
  );
}

function QuickNotesTool() {
  const [notes, setNotes] = useState(notesOps.list());
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [search, setSearch] = useState('');

  const refresh = () => setNotes(notesOps.list());
  const add = () => {
    if (!draft.trim()) return;
    notesOps.add(draft);
    setDraft('');
    refresh();
  };
  const save = (id: string) => {
    notesOps.update(id, editText);
    setEditing(null);
    refresh();
  };
  const remove = (id: string) => { notesOps.remove(id); refresh(); };
  const filtered = search ? notes.filter(n => n.content.toLowerCase().includes(search.toLowerCase())) : notes;

  return (
    <div>
      <h4 className="font-medium mb-3" style={{ color: 'var(--t-text)' }}>快速笔记 (localStorage 持久化)</h4>
      <div className="flex gap-2 mb-2">
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="新笔记..." className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }} />
        <button onClick={add} className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm">添加</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索..." className="w-full px-3 py-1.5 rounded-lg text-xs mb-2" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }} />
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filtered.length === 0 && <div className="text-center text-xs py-4" style={{ color: 'var(--t-text-muted)' }}>{notes.length === 0 ? '还没有笔记' : '没有匹配的笔记'}</div>}
        {filtered.map(n => (
          <div key={n.id} className="p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
            {editing === n.id ? (
              <div>
                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} className="w-full p-2 rounded text-xs" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--t-text)' }} />
                <div className="flex gap-2 mt-1">
                  <button onClick={() => save(n.id)} className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">保存</button>
                  <button onClick={() => setEditing(null)} className="px-2 py-1 rounded text-xs" style={{ color: 'var(--t-text-muted)' }}>取消</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--t-text)' }}>{n.content}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
                  <span>{new Date(n.updatedAt).toLocaleString()}</span>
                  <button onClick={() => { setEditing(n.id); setEditText(n.content); }} className="hover:underline">编辑</button>
                  <button onClick={() => remove(n.id)} className="hover:underline text-red-400">删除</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskManagerTool() {
  const [tasks, setTasks] = useState(tasksOps.list());
  const [draft, setDraft] = useState('');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium');
  const refresh = () => setTasks(tasksOps.list());
  const add = () => { if (draft.trim()) { tasksOps.add(draft, priority); setDraft(''); refresh(); } };
  const remaining = tasks.filter(t => !t.done).length;
  return (
    <div>
      <h4 className="font-medium mb-3 flex items-center justify-between" style={{ color: 'var(--t-text)' }}>
        <span>任务管理</span>
        <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{remaining} 待办 / {tasks.length} 总数</span>
      </h4>
      <div className="flex gap-2 mb-2">
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="新任务..." className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }} />
        <select value={priority} onChange={e => setPriority(e.target.value as any)} className="px-2 py-2 rounded-lg text-sm" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }}>
          <option value="low">低</option><option value="medium">中</option><option value="high">高</option>
        </select>
        <button onClick={add} className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm">添加</button>
      </div>
      {tasks.length > 0 && (
        <button onClick={() => { tasksOps.clearDone(); refresh(); }} className="text-xs mb-2" style={{ color: 'var(--t-text-muted)' }}>清除已完成</button>
      )}
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {tasks.length === 0 && <div className="text-center text-xs py-4" style={{ color: 'var(--t-text-muted)' }}>还没有任务</div>}
        {tasks.map(t => (
          <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: t.done ? 'rgba(34,197,94,0.05)' : 'rgba(0,0,0,0.2)' }}>
            <input type="checkbox" checked={t.done} onChange={() => { tasksOps.toggle(t.id); refresh(); }} className="rounded" />
            <span className={`flex-1 text-sm ${t.done ? 'line-through' : ''}`} style={{ color: t.done ? 'var(--t-text-muted)' : 'var(--t-text)' }}>{t.title}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${t.priority === 'high' ? 'bg-red-500/20 text-red-400' : t.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20'}`} style={{ color: t.priority === 'low' ? 'var(--t-text-muted)' : undefined }}>{t.priority}</span>
            <button onClick={() => { tasksOps.remove(t.id); refresh(); }} className="text-xs text-red-400 hover:underline">删除</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TranslatorTool() {
  const [text, setText] = useState('');
  const [target, setTarget] = useState('英文');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await translateText(text, target);
      setResult(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  };
  return (
    <div>
      <h4 className="font-medium mb-3" style={{ color: 'var(--t-text)' }}>AI 翻译 (使用当前对话模型)</h4>
      <div className="flex gap-2 mb-2">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="要翻译的文本..." className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }} />
        <select value={target} onChange={e => setTarget(e.target.value)} className="px-2 py-2 rounded-lg text-sm" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }}>
          {['英文', '中文', '日文', '韩文', '法文', '德文', '西班牙文', '俄文'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <button onClick={run} disabled={loading} className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm disabled:opacity-50 flex items-center gap-1.5">
          {loading ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
          翻译
        </button>
      </div>
      {err && <div className="text-xs text-red-400">⚠️ {err}</div>}
      {result && <pre className="mt-2 p-3 rounded-lg text-sm whitespace-pre-wrap" style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--t-text)' }}>{result}</pre>}
    </div>
  );
}

function SummarizerTool() {
  const [text, setText] = useState('');
  const [max, setMax] = useState(200);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await summarizeText(text, max);
      setResult(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  };
  return (
    <div>
      <h4 className="font-medium mb-3" style={{ color: 'var(--t-text)' }}>AI 摘要 (使用当前对话模型)</h4>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={5} placeholder="要摘要的长文本..." className="w-full p-3 rounded-lg text-sm" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }} />
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>最大字数</span>
        <input type="number" value={max} onChange={e => setMax(Number(e.target.value))} min={50} max={1000} className="w-20 px-2 py-1 rounded text-sm" style={{ background: 'var(--t-glass-bg)', color: 'var(--t-text)' }} />
        <button onClick={run} disabled={loading} className="px-4 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm disabled:opacity-50 flex items-center gap-1.5">
          {loading ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
          摘要
        </button>
      </div>
      {err && <div className="mt-2 text-xs text-red-400">⚠️ {err}</div>}
      {result && <pre className="mt-2 p-3 rounded-lg text-sm whitespace-pre-wrap" style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--t-text)' }}>{result}</pre>}
    </div>
  );
}

function PluginCard({ plugin, installed, installing, onInstall, onClick, compact }: PluginCardProps) {
  if (compact) {
    return (
      <div
        onClick={onClick}
        className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all"
        style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--t-accent-subtle)' }}>
            <Puzzle className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
          </div>
          <div>
            <div className="font-medium text-sm" style={{ color: 'var(--t-text)' }}>{plugin.manifest.name}</div>
            <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{plugin.manifest.author}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {installed ? (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
              已安装
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInstall();
              }}
              disabled={installing}
              className="px-3 py-1 rounded-lg text-xs transition-all disabled:opacity-50"
              style={{ background: 'var(--t-accent)', color: 'white' }}
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
      className="group p-4 rounded-xl cursor-pointer transition-all"
      style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'var(--t-accent-subtle)' }}>
          <Puzzle className="h-6 w-6" style={{ color: 'var(--t-accent-light)' }} />
        </div>
        {installed ? (
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
            已安装
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInstall();
            }}
            disabled={installing}
            className="px-3 py-1.5 rounded-lg text-sm transition-all disabled:opacity-50"
            style={{ background: 'var(--t-accent)', color: 'white' }}
          >
            {installing ? <RefreshCw className="h-4 w-4 animate-spin" /> : '安装'}
          </button>
        )}
      </div>
      <h4 className="font-medium mb-1" style={{ color: 'var(--t-text)' }}>{plugin.manifest.name}</h4>
      <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--t-text-muted)' }}>{plugin.manifest.description}</p>
      {/* Category Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {plugin.manifest.categories.slice(0, 2).map((cat) => (
          <span key={cat} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--t-glass-input)', color: 'var(--t-text-muted)' }}>
            {cat}
          </span>
        ))}
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--t-glass-input)', color: 'var(--t-text-muted)' }}>
          v{plugin.manifest.version}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--t-text-muted)' }}>
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
