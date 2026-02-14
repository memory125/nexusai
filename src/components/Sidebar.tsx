import { useState } from 'react';
import { useStore } from '../store';
import {
  MessageSquare, Bot, Zap, Cpu, Settings, Plus, Trash2,
  PanelLeftClose, PanelLeftOpen, LogOut, ChevronRight, ChevronDown, FolderGit2, Database, Plug, Puzzle, Workflow, Globe, HardDrive, Globe2, Users, Folder, MoreVertical, Edit2, FolderPlus, Pin
} from 'lucide-react';
import type { Page } from '../store';

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: '对话', icon: <MessageSquare className="h-4.5 w-4.5" /> },
  { id: 'agents', label: 'Agents', icon: <Bot className="h-4.5 w-4.5" /> },
  { id: 'skills', label: 'Skills', icon: <Zap className="h-4.5 w-4.5" /> },
  { id: 'search', label: '智能搜索', icon: <Globe className="h-4.5 w-4.5" /> },
  { id: 'knowledge', label: '知识库', icon: <Database className="h-4.5 w-4.5" /> },
  { id: 'browser', label: '浏览器自动化', icon: <Globe2 className="h-4.5 w-4.5" /> },
  { id: 'models', label: '模型', icon: <Cpu className="h-4.5 w-4.5" /> },
  { id: 'project', label: '项目', icon: <FolderGit2 className="h-4.5 w-4.5" /> },
  { id: 'mcp', label: 'MCP', icon: <Plug className="h-4.5 w-4.5" /> },
  { id: 'plugins', label: '插件', icon: <Puzzle className="h-4.5 w-4.5" /> },
  { id: 'workflow', label: '工作流', icon: <Workflow className="h-4.5 w-4.5" /> },
  { id: 'team', label: '团队协作', icon: <Users className="h-4.5 w-4.5" /> },
  { id: 'data-management', label: '数据管理', icon: <HardDrive className="h-4.5 w-4.5" /> },
  { id: 'settings', label: '设置', icon: <Settings className="h-4.5 w-4.5" /> },
];

export function Sidebar() {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [showFolderMenu, setShowFolderMenu] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  
  const {
    sidebarOpen, toggleSidebar, currentPage, setCurrentPage,
    conversations, activeConversationId, setActiveConversation,
    createConversation, deleteConversation, user, logout,
    folders, createFolder, deleteFolder, updateFolder, moveToFolder,
    pinConversation, unpinConversation,
  } = useStore();

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
    }
  };

  const getConversationsInFolder = (folderId: string) => {
    return conversations.filter(c => c.folderId === folderId);
  };

  const uncategorizedConvs = conversations.filter(c => !c.folderId);

  return (
    <div
      className={`relative flex flex-col transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-72' : 'w-16'
      }`}
    >
      <div className="glass flex h-full flex-col rounded-2xl m-2 mr-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid var(--t-glass-border)' }}>
          {sidebarOpen && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: `linear-gradient(135deg, var(--t-gradient-from), var(--t-gradient-to))` }}
              >
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-sm" style={{ color: 'var(--t-text)' }}>NexusAI</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
            style={{ color: 'var(--t-text-secondary)' }}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-2">
          <button
            onClick={() => createConversation()}
            className="glass-btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium"
          >
            <Plus className="h-4 w-4" />
            {sidebarOpen && <span>新对话</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-2 space-y-0.5">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all"
              style={{
                background: currentPage === item.id ? 'var(--t-sidebar-active)' : 'transparent',
                color: currentPage === item.id ? 'var(--t-text)' : 'var(--t-text-secondary)',
              }}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && currentPage === item.id && (
                <ChevronRight className="ml-auto h-3 w-3" style={{ color: 'var(--t-text-muted)' }} />
              )}
            </button>
          ))}
        </nav>

        {/* Conversations List with Folders */}
        {sidebarOpen && currentPage === 'chat' && (
          <div className="flex-1 overflow-y-auto px-2 py-2 mt-2" style={{ borderTop: '1px solid var(--t-glass-border)' }}>
            {/* Folder Header with Create */}
            <div className="mb-2 flex items-center justify-between px-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                对话文件夹
              </div>
              <button
                onClick={handleCreateFolder}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                style={{ color: 'var(--t-text-muted)' }}
                title="新建文件夹"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* New Folder Input */}
            {newFolderName !== '' && (
              <div className="mb-2 px-3 flex items-center gap-2">
                <Folder className="h-3.5 w-3.5" style={{ color: '#6366f1' }} />
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setNewFolderName('');
                  }}
                  onBlur={handleCreateFolder}
                  placeholder="文件夹名称..."
                  className="flex-1 bg-white/5 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  style={{ color: 'var(--t-text)' }}
                  autoFocus
                />
              </div>
            )}

            {/* Pinned Conversations */}
            {(() => {
              const pinnedConvs = conversations.filter(c => c.pinned);
              if (pinnedConvs.length > 0) {
                return (
                  <div className="mb-2">
                    <div className="mb-1 px-3 py-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                      已置顶
                    </div>
                    {pinnedConvs.map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => setActiveConversation(conv.id)}
                        className="group flex items-center gap-2 rounded-lg px-3 py-2 text-xs cursor-pointer mb-0.5 transition-all"
                        style={{
                          background: activeConversationId === conv.id ? 'var(--t-sidebar-active)' : 'transparent',
                          color: activeConversationId === conv.id ? 'var(--t-text)' : 'var(--t-text-secondary)',
                        }}
                      >
                        <Pin className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                        <span className="flex-1 truncate">{conv.title}</span>
                        <button
                          onClick={e => { e.stopPropagation(); unpinConversation(conv.id); }}
                          className="hidden h-5 w-5 items-center justify-center rounded hover:text-amber-400 group-hover:flex transition-all"
                          style={{ color: 'var(--t-text-muted)' }}
                          title="取消置顶"
                        >
                          <Pin className="h-3 w-3" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                          className="hidden h-5 w-5 items-center justify-center rounded hover:text-red-400 group-hover:flex transition-all"
                          style={{ color: 'var(--t-text-muted)' }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            })()}

            {conversations.length === 0 && folders.length === 0 && (
              <p className="px-3 py-4 text-xs text-center" style={{ color: 'var(--t-text-muted)' }}>暂无对话记录</p>
            )}

            {/* Folders */}
            {folders.map(folder => {
              const folderConvs = getConversationsInFolder(folder.id);
              const isCollapsed = collapsedFolders.has(folder.id);
              
              return (
                <div key={folder.id} className="mb-1">
                  {/* Folder Header */}
                  <div
                    className="group flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs cursor-pointer"
                    onClick={() => toggleFolder(folder.id)}
                    style={{ color: 'var(--t-text-secondary)' }}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <Folder className="h-3.5 w-3.5 shrink-0" style={{ color: folder.color }} />
                    <span className="flex-1 truncate font-medium">{folder.name}</span>
                    <span className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
                      {folderConvs.length}
                    </span>
                    <div className="relative">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setShowFolderMenu(showFolderMenu === folder.id ? null : folder.id);
                        }}
                        className="hidden h-5 w-5 items-center justify-center rounded hover:bg-white/10 group-hover:flex transition-all"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </button>
                      {showFolderMenu === folder.id && (
                        <div className="absolute right-0 top-full mt-1 w-24 rounded-lg shadow-lg z-10 overflow-hidden" style={{ background: 'var(--t-glass-card)' }}>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setEditingFolder(folder.id);
                              setShowFolderMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-white/10"
                            style={{ color: 'var(--t-text)' }}
                          >
                            <Edit2 className="h-3 w-3" /> 重命名
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (confirm('确定删除此文件夹？对话将移至未分类。')) {
                                deleteFolder(folder.id);
                              }
                              setShowFolderMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-red-500/20 text-red-400"
                          >
                            <Trash2 className="h-3 w-3" /> 删除
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Folder Conversations */}
                  {!isCollapsed && folderConvs.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConversation(conv.id)}
                      className="group flex items-center gap-2 rounded-lg pl-8 pr-3 py-1.5 text-xs cursor-pointer mb-0.5 transition-all"
                      style={{
                        background: activeConversationId === conv.id ? 'var(--t-sidebar-active)' : 'transparent',
                        color: activeConversationId === conv.id ? 'var(--t-text)' : 'var(--t-text-secondary)',
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 truncate">{conv.title}</span>
                      <button
                        onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                        className="hidden h-5 w-5 items-center justify-center rounded hover:text-red-400 group-hover:flex transition-all"
                        style={{ color: 'var(--t-text-muted)' }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Uncategorized Conversations */}
            {uncategorizedConvs.length > 0 && (
              <div className="mt-2">
                <div className="mb-1 px-3 py-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                  未分类
                </div>
                {uncategorizedConvs.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    className="group flex items-center gap-2 rounded-lg px-3 py-2 text-xs cursor-pointer mb-0.5 transition-all"
                    style={{
                      background: activeConversationId === conv.id ? 'var(--t-sidebar-active)' : 'transparent',
                      color: activeConversationId === conv.id ? 'var(--t-text)' : 'var(--t-text-secondary)',
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{conv.title}</span>
                    <button
                      onClick={e => { e.stopPropagation(); pinConversation(conv.id); }}
                      className="hidden h-5 w-5 items-center justify-center rounded hover:text-amber-400 group-hover:flex transition-all"
                      style={{ color: 'var(--t-text-muted)' }}
                      title="置顶"
                    >
                      <Pin className="h-3 w-3" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                      className="hidden h-5 w-5 items-center justify-center rounded hover:text-red-400 group-hover:flex transition-all"
                      style={{ color: 'var(--t-text-muted)' }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Spacer */}
        {(!sidebarOpen || currentPage !== 'chat') && <div className="flex-1" />}

        {/* User */}
        <div className="p-2" style={{ borderTop: '1px solid var(--t-glass-border)' }}>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, var(--t-gradient-from), var(--t-gradient-to))` }}
            >
              {user?.avatar}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--t-text)' }}>{user?.username}</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--t-text-muted)' }}>{user?.email}</p>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={logout}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all"
                title="退出登录"
                style={{ color: 'var(--t-text-muted)' }}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
