import { useState } from 'react';
import { useStore, modelProviders, themeConfigs } from '../store';
import type { ThemeId } from '../store';
import { Settings, User, Key, Palette, Bell, Shield, LogOut, Check, Monitor, Sun, Moon, Sparkles } from 'lucide-react';
import { ProviderIcon } from './ProviderIcons';

function ThemeCard({ themeId, name, description, preview, isActive, onClick }: {
  themeId: ThemeId;
  name: string;
  description: string;
  preview: { bg1: string; bg2: string; bg3: string; accent: string };
  isActive: boolean;
  onClick: () => void;
}) {
  const isLight = themeId.startsWith('light');

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-300 ${
        isActive
          ? 'ring-2 shadow-lg scale-[1.02]'
          : 'hover:scale-[1.01]'
      }`}
      style={{
        boxShadow: isActive ? `0 0 24px ${preview.accent}30, 0 0 0 2px ${preview.accent}` : undefined,
      }}
    >
      {/* Gradient border wrapper */}
      <div
        className="absolute inset-0 rounded-2xl opacity-60 transition-opacity group-hover:opacity-100"
        style={{
          background: isActive
            ? `linear-gradient(135deg, ${preview.bg3}, ${preview.accent})`
            : `linear-gradient(135deg, ${preview.bg3}40, ${preview.accent}20)`,
        }}
      />

      {/* Card content */}
      <div
        className="relative rounded-2xl p-4 transition-all"
        style={{
          background: isLight ? '#f8f9fb' : preview.bg1,
        }}
      >
        {/* Theme preview canvas */}
        <div
          className="relative mb-3 h-20 overflow-hidden rounded-xl"
          style={{
            background: isLight
              ? `linear-gradient(135deg, ${preview.bg1}, ${preview.bg2})`
              : `linear-gradient(135deg, ${preview.bg1}, ${preview.bg2})`,
          }}
        >
          {/* Mini orbs */}
          <div
            className="absolute -top-3 -left-3 h-14 w-14 rounded-full opacity-40"
            style={{ background: preview.bg3, filter: 'blur(12px)' }}
          />
          <div
            className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full opacity-30"
            style={{ background: preview.accent, filter: 'blur(10px)' }}
          />

          {/* Mini UI mock */}
          <div className="absolute inset-2 flex gap-1.5">
            {/* Mini sidebar */}
            <div
              className="w-8 rounded-lg flex flex-col gap-1 p-1"
              style={{
                background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <div className="h-1.5 w-full rounded-full" style={{ background: preview.accent }} />
              <div className="h-1 w-full rounded-full" style={{ background: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }} />
              <div className="h-1 w-full rounded-full" style={{ background: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }} />
              <div className="h-1 w-full rounded-full" style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }} />
            </div>
            {/* Mini content */}
            <div className="flex-1 flex flex-col gap-1">
              <div
                className="flex-1 rounded-lg p-1.5 flex flex-col justify-end gap-1"
                style={{
                  background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {/* Chat bubbles */}
                <div className="flex justify-end">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: '60%',
                      background: `linear-gradient(135deg, ${preview.bg3}, ${preview.accent})`,
                    }}
                  />
                </div>
                <div className="flex justify-start">
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: '75%',
                      background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                    }}
                  />
                </div>
              </div>
              {/* Mini input */}
              <div
                className="h-3 rounded-lg"
                style={{
                  background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                }}
              />
            </div>
          </div>

          {/* Active checkmark */}
          {isActive && (
            <div
              className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full"
              style={{ background: preview.accent }}
            >
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Theme info */}
        <div className="flex items-start justify-between">
          <div>
            <h4
              className="text-xs font-semibold"
              style={{ color: isLight ? '#1e293b' : '#f1f5f9' }}
            >
              {name}
            </h4>
            <p
              className="text-[10px] mt-0.5 leading-relaxed"
              style={{ color: isLight ? '#64748b' : '#94a3b8' }}
            >
              {description}
            </p>
          </div>
          {/* Accent color dots */}
          <div className="flex gap-1 mt-0.5">
            <div className="h-3 w-3 rounded-full border border-white/10" style={{ background: preview.bg3 }} />
            <div className="h-3 w-3 rounded-full border border-white/10" style={{ background: preview.accent }} />
          </div>
        </div>
      </div>
    </button>
  );
}

export function SettingsPage() {
  const { user, logout, selectedProvider, selectedModel, apiKeys, theme, setTheme } = useStore();
  const currentProvider = modelProviders.find(p => p.id === selectedProvider);
  const currentModel = currentProvider?.models.find(m => m.id === selectedModel);
  const configuredKeys = Object.entries(apiKeys).filter(([, v]) => v);

  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    '消息提醒': true,
    '自动保存': true,
    '流式输出': true,
    '历史记录': false,
  });

  const togglePreference = (key: string) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Separate themes into categories
  const darkThemes = themeConfigs.filter(t => !t.id.startsWith('light'));
  const lightThemes = themeConfigs.filter(t => t.id.startsWith('light'));

  const currentTheme = themeConfigs.find(t => t.id === theme);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-white/5" style={{ borderColor: 'var(--t-glass-border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: 'var(--t-accent-subtle)',
              border: '1px solid var(--t-accent-border)',
            }}
          >
            <Settings className="h-5 w-5" style={{ color: 'var(--t-accent-light)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--t-text)' }}>设置</h2>
            <p className="text-xs" style={{ color: 'var(--t-text-secondary)' }}>管理账号、主题和应用偏好</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ============================
              THEME SECTION (Primary)
              ============================ */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Palette className="h-4.5 w-4.5" style={{ color: 'var(--t-accent-light)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>外观主题</h3>
              </div>
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-1.5"
                style={{
                  background: 'var(--t-accent-subtle)',
                  border: '1px solid var(--t-accent-border)',
                }}
              >
                <Sparkles className="h-3 w-3" style={{ color: 'var(--t-accent-light)' }} />
                <span className="text-[10px] font-medium" style={{ color: 'var(--t-accent-text)' }}>
                  当前: {currentTheme?.name}
                </span>
              </div>
            </div>

            {/* Quick toggle: Dark / Light */}
            <div className="flex items-center gap-2 mb-5 p-1 rounded-xl" style={{ background: 'var(--t-glass-card)' }}>
              <button
                onClick={() => { if (theme.startsWith('light')) setTheme('midnight'); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-all"
                style={{
                  background: !theme.startsWith('light') ? 'var(--t-accent-subtle)' : 'transparent',
                  color: !theme.startsWith('light') ? 'var(--t-text)' : 'var(--t-text-muted)',
                }}
              >
                <Moon className="h-3.5 w-3.5" />
                深色模式
              </button>
              <button
                onClick={() => { if (!theme.startsWith('light')) setTheme('light'); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-all"
                style={{
                  background: theme.startsWith('light') ? 'var(--t-accent-subtle)' : 'transparent',
                  color: theme.startsWith('light') ? 'var(--t-text)' : 'var(--t-text-muted)',
                }}
              >
                <Sun className="h-3.5 w-3.5" />
                浅色模式
              </button>
            </div>

            {/* Dark themes */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Moon className="h-3 w-3" style={{ color: 'var(--t-text-muted)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                  深色主题
                </span>
                <span className="text-[10px] rounded-md px-1.5 py-0.5" style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent-text)' }}>
                  {darkThemes.length}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--t-glass-border)' }} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {darkThemes.map(t => (
                  <ThemeCard
                    key={t.id}
                    themeId={t.id}
                    name={t.name}
                    description={t.description}
                    preview={t.preview}
                    isActive={theme === t.id}
                    onClick={() => setTheme(t.id)}
                  />
                ))}
              </div>
            </div>

            {/* Light themes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sun className="h-3 w-3" style={{ color: 'var(--t-text-muted)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                  浅色主题
                </span>
                <span className="text-[10px] rounded-md px-1.5 py-0.5" style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent-text)' }}>
                  {lightThemes.length}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--t-glass-border)' }} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {lightThemes.map(t => (
                  <ThemeCard
                    key={t.id}
                    themeId={t.id}
                    name={t.name}
                    description={t.description}
                    preview={t.preview}
                    isActive={theme === t.id}
                    onClick={() => setTheme(t.id)}
                  />
                ))}
              </div>
            </div>

            {/* Auto detect hint */}
            <div
              className="mt-4 flex items-center gap-2 rounded-xl p-3"
              style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}
            >
              <Monitor className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--t-text-muted)' }} />
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--t-text-muted)' }}>
                主题更改即时生效，毛玻璃效果和动态光晕将自动适配所选主题的色彩体系
              </p>
            </div>
          </div>

          {/* Profile */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>个人信息</h3>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, var(--t-gradient-from), var(--t-gradient-to))`,
                  boxShadow: `0 8px 24px var(--t-accent-glow)`,
                }}
              >
                {user?.avatar}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{user?.username}</h4>
                <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{user?.email}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--t-text-muted)' }}>
                  注册时间: {new Date(user?.createdAt || '').toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          </div>

          {/* Current Model */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
                <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" />
                <path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
              </svg>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>当前模型</h3>
            </div>
            <div
              className="flex items-center gap-3 rounded-xl p-4"
              style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}
            >
              <ProviderIcon id={selectedProvider} size={36} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{currentModel?.name}</p>
                <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                  {currentProvider?.name} · {currentModel?.contextWindow} · {currentModel?.pricing}
                </p>
              </div>
            </div>
          </div>

          {/* API Keys Status */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>API 密钥状态</h3>
            </div>
            <div className="space-y-2">
              {modelProviders.map(provider => {
                const isOllama = provider.id === 'ollama';
                const hasKey = configuredKeys.some(([k]) => k === provider.id);
                return (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between rounded-lg p-3"
                    style={{ background: 'var(--t-glass-card)' }}
                  >
                    <div className="flex items-center gap-2">
                      <ProviderIcon id={provider.id} size={20} />
                      <span className="text-xs" style={{ color: 'var(--t-text)' }}>{provider.name}</span>
                      {isOllama && (
                        <span className="text-[9px] rounded px-1.5 py-0.5 font-medium"
                          style={{
                            background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(34,197,94,0.1))',
                            color: '#f59e0b',
                          }}
                        >
                          本地
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-md ${
                      isOllama
                        ? ''
                        : hasKey
                          ? 'bg-green-500/15 text-green-400'
                          : ''
                    }`}
                      style={
                        isOllama
                          ? { background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }
                          : !hasKey
                            ? { background: 'var(--t-glass-card)', color: 'var(--t-text-muted)' }
                            : {}
                      }
                    >
                      {isOllama ? '本地部署' : hasKey ? '已配置' : '未配置'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preferences */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>偏好设置</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: '消息提醒', desc: '接收新消息时显示通知' },
                { label: '自动保存', desc: '自动保存对话记录' },
                { label: '流式输出', desc: '实时显示模型输出' },
                { label: '历史记录', desc: '保留最近30天的对话记录' },
              ].map(pref => {
                const isChecked = preferences[pref.label] ?? false;
                return (
                  <div
                    key={pref.label}
                    className="flex items-center justify-between rounded-lg p-3"
                    style={{ background: 'var(--t-glass-card)' }}
                  >
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--t-text)' }}>{pref.label}</p>
                      <p className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>{pref.desc}</p>
                    </div>
                    <button
                      onClick={() => togglePreference(pref.label)}
                      className="relative h-5 w-9 rounded-full cursor-pointer transition-colors duration-200"
                      style={{
                        background: isChecked ? 'var(--t-accent)' : 'var(--t-glass-border)',
                      }}
                    >
                      <div
                        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                        style={{ transform: isChecked ? 'translateX(16px)' : 'translateX(2px)' }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security / Logout */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-green-400" />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>安全</h3>
            </div>
            <button
              onClick={logout}
              className="glass-btn-danger flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-medium w-full justify-center cursor-pointer transition-all"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
