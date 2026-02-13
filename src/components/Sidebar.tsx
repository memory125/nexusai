import { useStore } from '../store';
import {
  MessageSquare, Bot, Zap, Cpu, Settings, Plus, Trash2,
  PanelLeftClose, PanelLeftOpen, LogOut, ChevronRight, FolderGit2, Database, Plug, Puzzle
} from 'lucide-react';
import type { Page } from '../store';

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: '对话', icon: <MessageSquare className="h-4.5 w-4.5" /> },
  { id: 'agents', label: 'Agents', icon: <Bot className="h-4.5 w-4.5" /> },
  { id: 'skills', label: 'Skills', icon: <Zap className="h-4.5 w-4.5" /> },
  { id: 'knowledge', label: '知识库', icon: <Database className="h-4.5 w-4.5" /> },
  { id: 'models', label: '模型', icon: <Cpu className="h-4.5 w-4.5" /> },
  { id: 'project', label: '项目', icon: <FolderGit2 className="h-4.5 w-4.5" /> },
  { id: 'mcp', label: 'MCP', icon: <Plug className="h-4.5 w-4.5" /> },
  { id: 'plugins', label: '插件', icon: <Puzzle className="h-4.5 w-4.5" /> },
  { id: 'settings', label: '设置', icon: <Settings className="h-4.5 w-4.5" /> },
];

export function Sidebar() {
  const {
    sidebarOpen, toggleSidebar, currentPage, setCurrentPage,
    conversations, activeConversationId, setActiveConversation,
    createConversation, deleteConversation, user, logout,
  } = useStore();

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

        {/* Conversations List */}
        {sidebarOpen && currentPage === 'chat' && (
          <div className="flex-1 overflow-y-auto px-2 py-2 mt-2" style={{ borderTop: '1px solid var(--t-glass-border)' }}>
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
              历史对话
            </div>
            {conversations.length === 0 && (
              <p className="px-3 py-4 text-xs text-center" style={{ color: 'var(--t-text-muted)' }}>暂无对话记录</p>
            )}
            {conversations.map(conv => (
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
