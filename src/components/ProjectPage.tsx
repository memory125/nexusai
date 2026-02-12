import { useState } from 'react';
import {
  FolderGit2, GitBranch, GitCommit, GitPullRequest, Tag, FileCode,
  Copy, Check, ChevronDown, ChevronRight, Clock, Users, Star,
  AlertCircle, CheckCircle2, Circle, Plus, ExternalLink, Terminal,
  BookOpen, FileText, Shield, Code2, Folder, Package, Layers
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  icon?: string;
  children?: FileNode[];
  size?: string;
  description?: string;
}

const projectTree: FileNode[] = [
  {
    name: 'src', type: 'folder', children: [
      {
        name: 'components', type: 'folder', children: [
          { name: 'AuthPage.tsx', type: 'file', size: '4.2KB', description: '登录/注册页面' },
          { name: 'Sidebar.tsx', type: 'file', size: '5.1KB', description: '侧边栏导航' },
          { name: 'ChatPage.tsx', type: 'file', size: '8.3KB', description: '对话页面' },
          { name: 'AgentsPage.tsx', type: 'file', size: '4.8KB', description: 'AI Agents 页面' },
          { name: 'SkillsPage.tsx', type: 'file', size: '4.5KB', description: 'Skills 技能管理' },
          { name: 'ModelsPage.tsx', type: 'file', size: '12.6KB', description: '模型市场 + Ollama' },
          { name: 'SettingsPage.tsx', type: 'file', size: '11.2KB', description: '设置 (主题/偏好)' },
          { name: 'ProjectPage.tsx', type: 'file', size: '15.4KB', description: '项目管理仪表盘' },
        ]
      },
      {
        name: 'utils', type: 'folder', children: [
          { name: 'cn.ts', type: 'file', size: '0.2KB', description: 'className 工具函数' },
        ]
      },
      { name: 'App.tsx', type: 'file', size: '3.1KB', description: '根组件 + Theme' },
      { name: 'main.tsx', type: 'file', size: '0.3KB', description: '应用入口' },
      { name: 'store.ts', type: 'file', size: '14.8KB', description: 'Zustand 状态管理' },
      { name: 'index.css', type: 'file', size: '18.5KB', description: '13套主题 CSS 变量' },
    ]
  },
  { name: 'index.html', type: 'file', size: '0.3KB', description: '入口 HTML' },
  { name: 'package.json', type: 'file', size: '0.6KB', description: '依赖配置' },
  { name: 'vite.config.ts', type: 'file', size: '0.5KB', description: 'Vite 构建配置' },
  { name: 'tsconfig.json', type: 'file', size: '0.5KB', description: 'TypeScript 配置' },
  { name: 'README.md', type: 'file', size: '5.2KB', description: '项目文档' },
  { name: 'CHANGELOG.md', type: 'file', size: '1.1KB', description: '变更日志' },
  { name: 'CONTRIBUTING.md', type: 'file', size: '2.4KB', description: '贡献指南' },
  { name: 'LICENSE', type: 'file', size: '1.1KB', description: 'MIT License' },
  { name: '.gitignore', type: 'file', size: '0.3KB', description: 'Git 忽略规则' },
];

const commits = [
  { hash: 'a3f8c21', message: '🦙 feat: 添加 Ollama 本地模型支持 (14个模型)', author: 'dev', time: '2 小时前', tag: 'v1.2.0' },
  { hash: 'b7e1d93', message: '🎨 feat: 新增 5 个浅色主题 (总计13套)', author: 'dev', time: '5 小时前', tag: '' },
  { hash: 'c4a2f56', message: '🌙 feat: 添加主题系统 (7深色 + 1浅色)', author: 'dev', time: '8 小时前', tag: 'v1.1.0' },
  { hash: 'd9b3e78', message: '⚡ feat: Skills 技能系统 12项可配置', author: 'dev', time: '12 小时前', tag: '' },
  { hash: 'e5c4f01', message: '🤖 feat: AI Agents 8个专业预设', author: 'dev', time: '1 天前', tag: '' },
  { hash: 'f6d5a23', message: '💬 feat: 多轮对话 + Markdown 渲染', author: 'dev', time: '1 天前', tag: '' },
  { hash: '12e6b34', message: '🔐 feat: 用户登录/注册/注销系统', author: 'dev', time: '2 天前', tag: '' },
  { hash: '23f7c45', message: '🚀 init: 项目初始化 React + Vite + Tailwind', author: 'dev', time: '2 天前', tag: 'v1.0.0' },
];

const issues = [
  { id: 1, title: '接入真实 API 调用', status: 'open', label: '功能', priority: '高' },
  { id: 2, title: '添加对话导出功能 (MD/PDF)', status: 'open', label: '功能', priority: '中' },
  { id: 3, title: '实现流式输出 (SSE)', status: 'open', label: '优化', priority: '高' },
  { id: 4, title: '添加暗色/亮色自动检测', status: 'closed', label: '功能', priority: '低' },
  { id: 5, title: '移动端响应式适配', status: 'open', label: '优化', priority: '中' },
  { id: 6, title: '国际化多语言支持 (i18n)', status: 'open', label: '功能', priority: '低' },
];

const techStack = [
  { name: 'React', version: '19.2.3', icon: '⚛️', color: '#61DAFB' },
  { name: 'TypeScript', version: '5.9.3', icon: '🔷', color: '#3178C6' },
  { name: 'Vite', version: '7.2.4', icon: '⚡', color: '#646CFF' },
  { name: 'Tailwind CSS', version: '4.1.17', icon: '🎨', color: '#06B6D4' },
  { name: 'Zustand', version: '5.0.11', icon: '🐻', color: '#443E38' },
  { name: 'Lucide React', version: '0.563', icon: '✨', color: '#F56565' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} className="flex h-6 w-6 items-center justify-center rounded-md transition-all hover:scale-110"
      style={{ background: 'var(--t-glass-card)', color: copied ? '#22c55e' : 'var(--t-text-muted)' }}>
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function FileTreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const isFolder = node.type === 'folder';

  const getFileIcon = (name: string) => {
    if (name.endsWith('.tsx')) return <Code2 className="h-3.5 w-3.5 text-blue-400" />;
    if (name.endsWith('.ts')) return <Code2 className="h-3.5 w-3.5 text-blue-300" />;
    if (name.endsWith('.css')) return <FileCode className="h-3.5 w-3.5 text-purple-400" />;
    if (name.endsWith('.json')) return <FileText className="h-3.5 w-3.5 text-yellow-400" />;
    if (name.endsWith('.html')) return <FileCode className="h-3.5 w-3.5 text-orange-400" />;
    if (name.endsWith('.md')) return <BookOpen className="h-3.5 w-3.5 text-cyan-400" />;
    return <FileText className="h-3.5 w-3.5" style={{ color: 'var(--t-text-muted)' }} />;
  };

  return (
    <div>
      <button
        onClick={() => isFolder && setOpen(!open)}
        className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-left transition-all hover:bg-white/5 group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isFolder ? (
          open ? <ChevronDown className="h-3 w-3 shrink-0" style={{ color: 'var(--t-text-muted)' }} /> :
            <ChevronRight className="h-3 w-3 shrink-0" style={{ color: 'var(--t-text-muted)' }} />
        ) : (
          <span className="w-3" />
        )}
        {isFolder ? (
          <Folder className="h-3.5 w-3.5 shrink-0" style={{ color: open ? 'var(--t-accent-light)' : 'var(--t-text-secondary)' }} />
        ) : getFileIcon(node.name)}
        <span className="text-[11px] font-mono flex-1" style={{ color: isFolder ? 'var(--t-text)' : 'var(--t-text-secondary)' }}>
          {node.name}
        </span>
        {node.size && (
          <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--t-text-muted)' }}>
            {node.size}
          </span>
        )}
        {node.description && (
          <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-[140px]" style={{ color: 'var(--t-text-muted)' }}>
            {node.description}
          </span>
        )}
      </button>
      {isFolder && open && node.children?.map((child, i) => (
        <FileTreeNode key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function CommandBlock({ command, description }: { command: string; description: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl p-3 group"
      style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Terminal className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--t-accent-light)' }} />
        <div className="flex-1 min-w-0">
          <code className="text-xs font-mono font-medium" style={{ color: 'var(--t-code-text)' }}>{command}</code>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--t-text-muted)' }}>{description}</p>
        </div>
      </div>
      <CopyButton text={command} />
    </div>
  );
}

export function ProjectPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'commits' | 'issues' | 'deploy'>('overview');

  const tabs = [
    { id: 'overview' as const, label: '概览', icon: <Layers className="h-3.5 w-3.5" /> },
    { id: 'files' as const, label: '文件', icon: <Folder className="h-3.5 w-3.5" /> },
    { id: 'commits' as const, label: '提交记录', icon: <GitCommit className="h-3.5 w-3.5" /> },
    { id: 'issues' as const, label: '任务', icon: <AlertCircle className="h-3.5 w-3.5" /> },
    { id: 'deploy' as const, label: '部署', icon: <Package className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0" style={{ borderBottom: '1px solid var(--t-glass-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--t-accent-subtle)', border: '1px solid var(--t-accent-border)' }}
            >
              <FolderGit2 className="h-5 w-5" style={{ color: 'var(--t-accent-light)' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold" style={{ color: 'var(--t-text)' }}>项目管理</h2>
                <span className="rounded-lg px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent-text)' }}>
                  v1.2.0
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--t-text-secondary)' }}>NexusAI 代码结构、版本控制与部署管理</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
              style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)', color: 'var(--t-text-secondary)' }}>
              <GitBranch className="h-3 w-3" />
              <span className="text-[10px] font-mono font-medium">main</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
              style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)', color: 'var(--t-text-secondary)' }}>
              <Star className="h-3 w-3" style={{ color: '#f59e0b' }} />
              <span className="text-[10px] font-medium">MIT</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-t-xl transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--t-accent-subtle)' : 'transparent',
                color: activeTab === tab.id ? 'var(--t-accent-text)' : 'var(--t-text-muted)',
                borderBottom: activeTab === tab.id ? `2px solid var(--t-accent)` : '2px solid transparent',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">

          {/* ======== OVERVIEW TAB ======== */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fade-in">
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '源文件', value: '11', icon: <FileCode className="h-4 w-4" />, color: 'var(--t-accent-light)' },
                  { label: '提交次数', value: `${commits.length}`, icon: <GitCommit className="h-4 w-4" />, color: '#22c55e' },
                  { label: '待办任务', value: `${issues.filter(i => i.status === 'open').length}`, icon: <AlertCircle className="h-4 w-4" />, color: '#f59e0b' },
                  { label: '依赖包', value: `${techStack.length}`, icon: <Package className="h-4 w-4" />, color: '#8b5cf6' },
                ].map((stat, i) => (
                  <div key={i} className="glass-card rounded-2xl p-4" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>{stat.label}</span>
                      <div style={{ color: stat.color }}>{stat.icon}</div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--t-text)' }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Tech Stack & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Tech Stack */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>技术栈</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {techStack.map(tech => (
                      <div
                        key={tech.name}
                        className="flex items-center gap-2.5 rounded-xl p-3"
                        style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}
                      >
                        <span className="text-lg">{tech.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold" style={{ color: 'var(--t-text)' }}>{tech.name}</p>
                          <p className="text-[9px] font-mono" style={{ color: tech.color }}>{tech.version}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Terminal className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>快速命令</h3>
                  </div>
                  <div className="space-y-2">
                    <CommandBlock command="npm run dev" description="启动开发服务器 (localhost:5173)" />
                    <CommandBlock command="npm run build" description="构建生产版本到 dist/" />
                    <CommandBlock command="npm run preview" description="预览构建结果" />
                  </div>
                </div>
              </div>

              {/* Git Quick Start */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FolderGit2 className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>Git 版本管理</h3>
                  <span className="text-[10px] rounded-md px-2 py-0.5" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>推荐</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Initialize */}
                  <div className="rounded-xl p-4" style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}>
                    <h4 className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--t-text)' }}>
                      <Plus className="h-3 w-3" />
                      初始化仓库
                    </h4>
                    <div className="space-y-1.5">
                      {[
                        'git init',
                        'git add .',
                        'git commit -m "🚀 NexusAI v1.2.0"',
                      ].map(cmd => (
                        <div key={cmd} className="flex items-center justify-between rounded-lg px-3 py-2"
                          style={{ background: 'var(--t-code-bg)' }}>
                          <code className="text-[10px] font-mono" style={{ color: 'var(--t-code-text)' }}>{cmd}</code>
                          <CopyButton text={cmd} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Push to remote */}
                  <div className="rounded-xl p-4" style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}>
                    <h4 className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--t-text)' }}>
                      <ExternalLink className="h-3 w-3" />
                      推送到远程
                    </h4>
                    <div className="space-y-1.5">
                      {[
                        'git remote add origin <url>',
                        'git branch -M main',
                        'git push -u origin main',
                      ].map(cmd => (
                        <div key={cmd} className="flex items-center justify-between rounded-lg px-3 py-2"
                          style={{ background: 'var(--t-code-bg)' }}>
                          <code className="text-[10px] font-mono" style={{ color: 'var(--t-code-text)' }}>{cmd}</code>
                          <CopyButton text={cmd} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* GitHub CLI */}
                <div className="mt-4 rounded-xl p-4"
                  style={{
                    background: 'linear-gradient(135deg, var(--t-accent-subtle), transparent)',
                    border: '1px solid var(--t-accent-border)',
                  }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">⚡</span>
                    <h4 className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>一键创建 GitHub 仓库 (GitHub CLI)</h4>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2.5"
                    style={{ background: 'var(--t-code-bg)' }}>
                    <code className="text-[10px] font-mono" style={{ color: 'var(--t-code-text)' }}>
                      gh repo create nexusai --public --source . --push
                    </code>
                    <CopyButton text="gh repo create nexusai --public --source . --push" />
                  </div>
                  <p className="text-[9px] mt-2" style={{ color: 'var(--t-text-muted)' }}>
                    需要先安装 <a href="https://cli.github.com" target="_blank" rel="noopener noreferrer" className="underline">GitHub CLI</a> 并执行 gh auth login
                  </p>
                </div>
              </div>

              {/* Latest Commits Preview */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <GitCommit className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>最近提交</h3>
                  </div>
                  <button onClick={() => setActiveTab('commits')} className="text-[10px] font-medium" style={{ color: 'var(--t-accent-light)' }}>
                    查看全部 →
                  </button>
                </div>
                <div className="space-y-1">
                  {commits.slice(0, 3).map(c => (
                    <div key={c.hash} className="flex items-center gap-3 rounded-lg p-2.5"
                      style={{ background: 'var(--t-glass-card)' }}>
                      <code className="text-[10px] font-mono shrink-0 px-2 py-1 rounded" style={{ background: 'var(--t-code-bg)', color: 'var(--t-accent-light)' }}>
                        {c.hash}
                      </code>
                      <span className="text-[11px] flex-1 truncate" style={{ color: 'var(--t-text-secondary)' }}>{c.message}</span>
                      {c.tag && (
                        <span className="text-[9px] font-medium rounded px-1.5 py-0.5 shrink-0"
                          style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent-text)' }}>
                          <Tag className="h-2.5 w-2.5 inline mr-0.5" />{c.tag}
                        </span>
                      )}
                      <span className="text-[9px] shrink-0" style={{ color: 'var(--t-text-muted)' }}>{c.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======== FILES TAB ======== */}
          {activeTab === 'files' && (
            <div className="animate-fade-in">
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>项目文件结构</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] rounded-lg px-2.5 py-1"
                      style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)', color: 'var(--t-text-muted)' }}>
                      <GitBranch className="h-3 w-3 inline mr-1" />main
                    </span>
                  </div>
                </div>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}
                >
                  {projectTree.map((node, i) => (
                    <FileTreeNode key={i} node={node} />
                  ))}
                </div>

                {/* File stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'TypeScript/TSX', count: 9, color: '#3178C6' },
                    { label: 'CSS', count: 1, color: '#A855F7' },
                    { label: 'Config/Docs', count: 6, color: '#22C55E' },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-xl p-3 text-center"
                      style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}>
                      <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.count}</p>
                      <p className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======== COMMITS TAB ======== */}
          {activeTab === 'commits' && (
            <div className="animate-fade-in">
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <GitCommit className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>提交历史</h3>
                    <span className="text-[10px] rounded-md px-1.5 py-0.5" style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent-text)' }}>
                      {commits.length} 次提交
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                    style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)', color: 'var(--t-text-muted)' }}>
                    <GitBranch className="h-3 w-3" />
                    <span className="text-[10px] font-mono">main</span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[19px] top-0 bottom-0 w-px" style={{ background: 'var(--t-glass-border)' }} />

                  <div className="space-y-1">
                    {commits.map((commit, i) => (
                      <div key={commit.hash} className="relative flex items-start gap-4 rounded-xl p-3 transition-all hover:bg-white/3"
                        style={{ animationDelay: `${i * 40}ms` }}>
                        {/* Dot */}
                        <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5"
                          style={{
                            background: commit.tag ? 'var(--t-accent)' : 'var(--t-glass-card)',
                            border: `2px solid ${commit.tag ? 'var(--t-accent-light)' : 'var(--t-glass-border)'}`,
                          }}>
                          {commit.tag ? <Tag className="h-2.5 w-2.5 text-white" /> : <Circle className="h-2 w-2" style={{ color: 'var(--t-text-muted)' }} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-[10px] font-mono shrink-0 px-2 py-0.5 rounded"
                              style={{ background: 'var(--t-code-bg)', color: 'var(--t-accent-light)' }}>
                              {commit.hash}
                            </code>
                            <p className="text-[11px] font-medium flex-1 min-w-0" style={{ color: 'var(--t-text)' }}>
                              {commit.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {commit.tag && (
                              <span className="text-[9px] font-semibold rounded px-1.5 py-0.5"
                                style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent-text)' }}>
                                {commit.tag}
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="h-2.5 w-2.5" style={{ color: 'var(--t-text-muted)' }} />
                              <span className="text-[9px]" style={{ color: 'var(--t-text-muted)' }}>{commit.author}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" style={{ color: 'var(--t-text-muted)' }} />
                              <span className="text-[9px]" style={{ color: 'var(--t-text-muted)' }}>{commit.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======== ISSUES TAB ======== */}
          {activeTab === 'issues' && (
            <div className="animate-fade-in space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{issues.filter(i => i.status === 'open').length}</p>
                  <p className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>待处理</p>
                </div>
                <div className="glass-card rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold" style={{ color: 'var(--t-text-muted)' }}>{issues.filter(i => i.status === 'closed').length}</p>
                  <p className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>已完成</p>
                </div>
                <div className="glass-card rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{issues.filter(i => i.priority === '高').length}</p>
                  <p className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>高优先级</p>
                </div>
              </div>

              {/* Issues List */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>开发任务</h3>
                  </div>
                  <button className="glass-btn flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium">
                    <Plus className="h-3 w-3" /> 新建任务
                  </button>
                </div>

                <div className="space-y-2">
                  {issues.map(issue => (
                    <div key={issue.id}
                      className="flex items-center gap-3 rounded-xl p-3.5 transition-all hover:bg-white/3"
                      style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}>
                      {issue.status === 'open' ? (
                        <Circle className="h-4 w-4 shrink-0 text-green-400" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--t-text-muted)' }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${issue.status === 'closed' ? 'line-through' : ''}`}
                          style={{ color: issue.status === 'closed' ? 'var(--t-text-muted)' : 'var(--t-text)' }}>
                          {issue.title}
                        </p>
                        <p className="text-[9px] mt-0.5" style={{ color: 'var(--t-text-muted)' }}>#{issue.id}</p>
                      </div>
                      <span className="text-[9px] rounded px-2 py-0.5 font-medium"
                        style={{
                          background: issue.label === '功能' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
                          color: issue.label === '功能' ? '#818cf8' : '#f59e0b',
                          border: `1px solid ${issue.label === '功能' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)'}`,
                        }}>
                        {issue.label}
                      </span>
                      <span className={`text-[9px] rounded px-2 py-0.5 font-medium ${
                        issue.priority === '高' ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : issue.priority === '中' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : ''
                      }`}
                        style={issue.priority === '低' ? { background: 'var(--t-glass-card)', color: 'var(--t-text-muted)', border: '1px solid var(--t-glass-border)' } : {}}>
                        {issue.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======== DEPLOY TAB ======== */}
          {activeTab === 'deploy' && (
            <div className="animate-fade-in space-y-5">
              {/* Build Status */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>构建状态</h3>
                </div>
                <div className="flex items-center gap-3 rounded-xl p-4"
                  style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-xs font-semibold text-green-400">构建成功</p>
                    <p className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>最近构建于 5 分钟前 · 产物大小 ~350KB gzipped</p>
                  </div>
                </div>
              </div>

              {/* Deployment Options */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ExternalLink className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>部署方案</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      name: 'Vercel',
                      icon: '▲',
                      desc: '零配置自动部署，GitHub 集成',
                      steps: ['连接 GitHub 仓库', '自动检测 Vite 项目', '一键部署'],
                      color: '#000',
                    },
                    {
                      name: 'Netlify',
                      icon: '◆',
                      desc: '持续部署，自定义域名',
                      steps: ['拖拽 dist/ 文件夹', '或连接 Git 仓库', '配置 Build: npm run build'],
                      color: '#00C7B7',
                    },
                    {
                      name: 'GitHub Pages',
                      icon: '🐙',
                      desc: '免费静态站点托管',
                      steps: ['npm run build', 'Push dist/ 到 gh-pages 分支', '配置 GitHub Pages 设置'],
                      color: '#333',
                    },
                    {
                      name: 'Docker',
                      icon: '🐳',
                      desc: '容器化部署，可私有化',
                      steps: ['创建 Dockerfile', 'docker build -t nexusai .', 'docker run -p 3000:80 nexusai'],
                      color: '#2496ED',
                    },
                  ].map(platform => (
                    <div key={platform.name} className="rounded-xl p-4"
                      style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{platform.icon}</span>
                        <h4 className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>{platform.name}</h4>
                      </div>
                      <p className="text-[10px] mb-3" style={{ color: 'var(--t-text-muted)' }}>{platform.desc}</p>
                      <div className="space-y-1.5">
                        {platform.steps.map((step, si) => (
                          <div key={si} className="flex items-center gap-2">
                            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold"
                              style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent-light)' }}>
                              {si + 1}
                            </div>
                            <span className="text-[10px]" style={{ color: 'var(--t-text-secondary)' }}>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environment */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>环境变量配置</h3>
                </div>
                <p className="text-[10px] mb-3" style={{ color: 'var(--t-text-muted)' }}>
                  在部署环境中配置以下变量（创建 .env.local 文件）：
                </p>
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--t-code-bg)', border: '1px solid var(--t-glass-border)' }}>
                  <div className="p-4 font-mono text-[10px] leading-relaxed" style={{ color: 'var(--t-code-text)' }}>
                    <div><span style={{ color: 'var(--t-text-muted)' }}># OpenAI</span></div>
                    <div>VITE_OPENAI_API_KEY=sk-...</div>
                    <div className="mt-1"><span style={{ color: 'var(--t-text-muted)' }}># Anthropic</span></div>
                    <div>VITE_ANTHROPIC_API_KEY=sk-ant-...</div>
                    <div className="mt-1"><span style={{ color: 'var(--t-text-muted)' }}># Ollama (可选)</span></div>
                    <div>VITE_OLLAMA_ENDPOINT=http://localhost:11434</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
