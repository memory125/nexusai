import { useState } from 'react';
import { useStore, modelProviders } from '../store';
import { Cpu, Check, ExternalLink, Info, Server, Wifi, WifiOff, RefreshCw, Terminal, Download, Plus, HardDrive, MonitorSpeaker, ChevronDown, Zap } from 'lucide-react';
import { ProviderIcon } from './ProviderIcons';

function VLLMSection() {
  const {
    selectedProvider, selectedModel, setSelectedProvider, setSelectedModel,
    vllmEndpoint, setVllmEndpoint, vllmStatus, setVllmStatus,
    vllmCustomModel, setVllmCustomModel, apiKeys, setApiKey,
  } = useStore();

  const provider = modelProviders.find(p => p.id === 'vllm')!;
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);

  const isCurrentProvider = selectedProvider === 'vllm';
  const displayedModels = showAllModels ? provider.models : provider.models.slice(0, 6);

  const testConnection = () => {
    setVllmStatus('connecting');
    // Simulate connection test
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setVllmStatus(success ? 'connected' : 'error');
    }, 1500);
  };

  const addCustomModel = () => {
    if (!vllmCustomModel.trim()) return;
    setSelectedProvider('vllm');
    setSelectedModel(vllmCustomModel.trim());
    setShowCustomInput(false);
  };

  const statusConfig = {
    idle: { color: 'var(--t-text-muted)', bg: 'var(--t-glass-card)', text: '未连接', icon: <WifiOff className="h-3 w-3" /> },
    connecting: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', text: '连接中...', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
    connected: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', text: '已连接', icon: <Wifi className="h-3 w-3" /> },
    error: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', text: '连接失败', icon: <WifiOff className="h-3 w-3" /> },
  };

  const status = statusConfig[vllmStatus];

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden animate-fade-in"
      style={{ animationDelay: `${modelProviders.length * 60}ms` }}
    >
      {/* vLLM Header */}
      <div className="relative overflow-hidden">
        {/* Gradient accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, #7c3aed, #ec4899, #f59e0b)',
          }}
        />

        <div className="p-5 pt-6">
          <div className="flex items-start gap-4">
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.15))',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <ProviderIcon id="vllm" size={36} />
              {/* Pulse indicator */}
              {vllmStatus === 'connected' && (
                <div className="absolute -top-0.5 -right-0.5 h-3 w-3">
                  <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
                  <div className="absolute inset-0.5 rounded-full bg-green-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold" style={{ color: 'var(--t-text)' }}>vLLM</h3>
                <span
                  className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.15))',
                    color: '#a855f7',
                    border: '1px solid rgba(168,85,247,0.2)',
                  }}
                >
                  🚀 高性能推理
                </span>
                {isCurrentProvider && (
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: 'var(--t-badge-bg)', color: 'var(--t-badge-text)' }}
                  >
                    当前使用
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--t-text-secondary)' }}>
                高性能大模型推理引擎，支持并发请求、PagedAttention，速度提升 10-20 倍
              </p>
            </div>

            {/* Connection Status Badge */}
            <div
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 shrink-0"
              style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}25` }}
            >
              {status.icon}
              <span className="text-[10px] font-medium">{status.text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* vLLM Expanded Content */}
      <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--t-glass-border)' }}>

        {/* Features Highlights */}
        <div className="grid grid-cols-4 gap-2 py-4">
          {[
            { icon: <Zap className="h-3.5 w-3.5" />, label: '极速推理', desc: 'PagedAttention' },
            { icon: <Server className="h-3.5 w-3.5" />, label: '高并发', desc: 'Continuous Batching' },
            { icon: <Cpu className="h-3.5 w-3.5" />, label: 'GPU 优化', desc: 'CUDA 内核优化' },
            { icon: <MonitorSpeaker className="h-3.5 w-3.5" />, label: 'OpenAI API', desc: '兼容接口' },
          ].map((feat, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center rounded-xl p-2.5"
              style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}
            >
              <div className="mb-1" style={{ color: 'var(--t-accent-light)' }}>{feat.icon}</div>
              <span className="text-[10px] font-medium" style={{ color: 'var(--t-text)' }}>{feat.label}</span>
              <span className="text-[9px]" style={{ color: 'var(--t-text-muted)' }}>{feat.desc}</span>
            </div>
          ))}
        </div>

        {/* Server Configuration */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="h-3.5 w-3.5" style={{ color: 'var(--t-accent-light)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>服务器配置</span>
          </div>

          {/* Endpoint URL */}
          <div className="mb-3">
            <label className="mb-1.5 block text-[10px] font-medium" style={{ color: 'var(--t-text-secondary)' }}>
              vLLM 服务地址
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--t-text-muted)' }} />
                <input
                  type="text"
                  value={vllmEndpoint}
                  onChange={e => setVllmEndpoint(e.target.value)}
                  className="glass-input w-full rounded-lg py-2.5 pl-9 pr-3 text-xs font-mono"
                  placeholder="http://localhost:8000"
                />
              </div>
              <button
                onClick={testConnection}
                disabled={vllmStatus === 'connecting'}
                className="glass-btn flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium shrink-0 disabled:opacity-50"
              >
                {vllmStatus === 'connecting' ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wifi className="h-3.5 w-3.5" />
                )}
                测试连接
              </button>
            </div>
          </div>

          {/* Connection status message */}
          {vllmStatus === 'connected' && (
            <div className="flex items-center gap-2 rounded-lg p-2.5 animate-fade-in" style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-[10px] text-green-400">
                已成功连接到 vLLM 服务 ({vllmEndpoint})
              </span>
            </div>
          )}
          {vllmStatus === 'error' && (
            <div className="flex items-start gap-2 rounded-lg p-2.5 animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
              <WifiOff className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-red-400 block">
                  无法连接到 vLLM 服务，请检查：
                </span>
                <ul className="text-[10px] text-red-400/70 mt-1 ml-3 list-disc space-y-0.5">
                  <li>确认 vLLM 已安装并正在运行</li>
                  <li>终端运行 <code className="font-mono px-1 rounded" style={{ background: 'rgba(239,68,68,0.1)' }}>python -m vllm.entrypoints.openai.api_server</code></li>
                  <li>检查端口号是否正确 (默认 8000)</li>
                </ul>
              </div>
            </div>
          )}

          {/* API Key (optional) */}
          <div className="mt-3">
            <label className="mb-1.5 block text-[10px] font-medium" style={{ color: 'var(--t-text-secondary)' }}>
              API Key <span style={{ color: 'var(--t-text-muted)' }}>(可选 - 远程部署时使用)</span>
            </label>
            <input
              type="password"
              value={apiKeys['vllm'] || ''}
              onChange={e => setApiKey('vllm', e.target.value)}
              className="glass-input w-full rounded-lg py-2 px-3 text-xs"
              placeholder="本地部署无需填写..."
            />
          </div>
        </div>

        {/* Quick Start Guide */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(236,72,153,0.05))',
            border: '1px solid rgba(124,58,237,0.1)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-3.5 w-3.5" style={{ color: '#a855f7' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>快速开始</span>
          </div>
          <div className="space-y-2">
            {[
              { step: '1', text: '安装 vLLM', cmd: 'pip install vllm' },
              { step: '2', text: '启动服务', cmd: 'python -m vllm.entrypoints.openai.api_server --model meta-llama/Llama-3.1-8B-Instruct' },
              { step: '3', text: '测试连接', cmd: 'curl http://localhost:8000/v1/models' },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3">
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))',
                    color: '#a855f7',
                  }}
                >
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-medium" style={{ color: 'var(--t-text-secondary)' }}>{item.text}</span>
                  <code
                    className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{ background: 'var(--t-code-bg)', color: 'var(--t-code-text)' }}
                  >
                    {item.cmd}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Model Input */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                可用模型
              </span>
              <span className="text-[10px] rounded-md px-1.5 py-0.5" style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent-text)' }}>
                {provider.models.length}
              </span>
            </div>
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="glass-btn flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium"
            >
              <Plus className="h-3 w-3" />
              自定义模型
            </button>
          </div>

          {showCustomInput && (
            <div className="flex gap-2 mb-3 animate-fade-in">
              <input
                type="text"
                value={vllmCustomModel}
                onChange={e => setVllmCustomModel(e.target.value)}
                className="glass-input flex-1 rounded-lg py-2 px-3 text-xs font-mono"
                placeholder="输入模型名称，如 meta-llama/Llama-3.1-8B-Instruct..."
                onKeyDown={e => e.key === 'Enter' && addCustomModel()}
              />
              <button
                onClick={addCustomModel}
                disabled={!vllmCustomModel.trim()}
                className="glass-btn-primary rounded-lg px-4 py-2 text-xs font-medium disabled:opacity-40"
              >
                使用
              </button>
            </div>
          )}
        </div>

        {/* Models Grid */}
        <div className="space-y-1.5">
          {displayedModels.map(model => {
            const isSelected = selectedModel === model.id && selectedProvider === 'vllm';
            // Categorize models
            let category = '通用';
            let categoryColor = 'var(--t-accent-light)';
            if (model.id.includes('coder') || model.id.includes('code')) {
              category = '代码';
              categoryColor = '#22c55e';
            } else if (model.id.includes('embed')) {
              category = '嵌入';
              categoryColor = '#8b5cf6';
            } else if (model.id.includes('R1')) {
              category = '推理';
              categoryColor = '#f59e0b';
            } else if (model.id.includes('Phi')) {
              category = '轻量';
              categoryColor = '#06b6d4';
            }

            return (
              <button
                key={model.id}
                onClick={() => { setSelectedProvider('vllm'); setSelectedModel(model.id); }}
                className="w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all group"
                style={{
                  background: isSelected ? 'var(--t-accent-subtle)' : 'var(--t-glass-card)',
                  border: `1px solid ${isSelected ? 'var(--t-accent-border)' : 'transparent'}`,
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))'
                      : 'var(--t-glass-card)',
                    border: '1px solid var(--t-glass-border)',
                  }}
                >
                  <ProviderIcon id="vllm" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>{model.name}</h4>
                    {isSelected && <Check className="h-3.5 w-3.5" style={{ color: 'var(--t-accent-light)' }} />}
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-medium"
                      style={{ background: `${categoryColor}15`, color: categoryColor, border: `1px solid ${categoryColor}25` }}
                    >
                      {category}
                    </span>
                  </div>
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--t-text-muted)' }}>{model.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--t-text-secondary)' }}>
                    <Info className="h-3 w-3" />
                    {model.contextWindow}
                  </div>
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: '#22c55e' }}
                  >
                    {model.pricing}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Show more / less */}
        {provider.models.length > 6 && (
          <button
            onClick={() => setShowAllModels(!showAllModels)}
            className="w-full mt-2 flex items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-medium transition-all"
            style={{ color: 'var(--t-accent-light)' }}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllModels ? 'rotate-180' : ''}`} />
            {showAllModels ? '收起' : `显示全部 ${provider.models.length} 个模型`}
          </button>
        )}

        {/* Custom model in use notice */}
        {selectedProvider === 'vllm' && !provider.models.find(m => m.id === selectedModel) && (
          <div
            className="mt-3 flex items-center gap-2 rounded-xl p-3 animate-fade-in"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.08))',
              border: '1px solid rgba(124,58,237,0.15)',
            }}
          >
            <Terminal className="h-3.5 w-3.5 shrink-0" style={{ color: '#a855f7' }} />
            <span className="text-[10px]" style={{ color: 'var(--t-text-secondary)' }}>
              当前使用自定义模型: <code className="font-mono font-medium" style={{ color: '#a855f7' }}>{selectedModel}</code>
            </span>
          </div>
        )}

        {/* vLLM docs link */}
        <div className="mt-3 flex items-center justify-center">
          <a
            href="https://docs.vllm.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] transition-colors"
            style={{ color: 'var(--t-text-muted)' }}
          >
            了解更多关于 vLLM
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

function OllamaSection() {
  const {
    selectedProvider, selectedModel, setSelectedProvider, setSelectedModel,
    ollamaEndpoint, setOllamaEndpoint, ollamaStatus, setOllamaStatus,
    ollamaCustomModel, setOllamaCustomModel, apiKeys, setApiKey,
  } = useStore();

  const provider = modelProviders.find(p => p.id === 'ollama')!;
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);

  const isCurrentProvider = selectedProvider === 'ollama';
  const displayedModels = showAllModels ? provider.models : provider.models.slice(0, 6);

  const testConnection = () => {
    setOllamaStatus('connecting');
    // Simulate connection test
    setTimeout(() => {
      const success = Math.random() > 0.3; // simulate
      setOllamaStatus(success ? 'connected' : 'error');
    }, 1500);
  };

  const addCustomModel = () => {
    if (!ollamaCustomModel.trim()) return;
    setSelectedProvider('ollama');
    setSelectedModel(ollamaCustomModel.trim());
    setShowCustomInput(false);
  };

  const statusConfig = {
    idle: { color: 'var(--t-text-muted)', bg: 'var(--t-glass-card)', text: '未连接', icon: <WifiOff className="h-3 w-3" /> },
    connecting: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', text: '连接中...', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
    connected: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', text: '已连接', icon: <Wifi className="h-3 w-3" /> },
    error: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', text: '连接失败', icon: <WifiOff className="h-3 w-3" /> },
  };

  const status = statusConfig[ollamaStatus];

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden animate-fade-in"
      style={{ animationDelay: `${modelProviders.length * 60}ms` }}
    >
      {/* Ollama Header - Special Design */}
      <div className="relative overflow-hidden">
        {/* Gradient accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, #f97316, #f59e0b, #eab308, #84cc16, #22c55e, #14b8a6)',
          }}
        />

        <div className="p-5 pt-6">
          <div className="flex items-start gap-4">
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(34,197,94,0.15))',
                border: '1px solid rgba(249,115,22,0.2)',
              }}
            >
              <ProviderIcon id="ollama" size={36} />
              {/* Pulse indicator */}
              {ollamaStatus === 'connected' && (
                <div className="absolute -top-0.5 -right-0.5 h-3 w-3">
                  <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
                  <div className="absolute inset-0.5 rounded-full bg-green-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold" style={{ color: 'var(--t-text)' }}>Ollama</h3>
                <span
                  className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(34,197,94,0.15))',
                    color: '#f59e0b',
                    border: '1px solid rgba(245,158,11,0.2)',
                  }}
                >
                  🖥️ 本地部署
                </span>
                {isCurrentProvider && (
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: 'var(--t-badge-bg)', color: 'var(--t-badge-text)' }}
                  >
                    当前使用
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--t-text-secondary)' }}>
                在本地运行开源大模型，完全离线、数据私密、零成本
              </p>
            </div>

            {/* Connection Status Badge */}
            <div
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 shrink-0"
              style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}25` }}
            >
              {status.icon}
              <span className="text-[10px] font-medium">{status.text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ollama Expanded Content */}
      <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--t-glass-border)' }}>

        {/* Features Highlights */}
        <div className="grid grid-cols-4 gap-2 py-4">
          {[
            { icon: <HardDrive className="h-3.5 w-3.5" />, label: '本地运行', desc: '无需网络' },
            { icon: <Server className="h-3.5 w-3.5" />, label: '数据私密', desc: '不上传数据' },
            { icon: <Download className="h-3.5 w-3.5" />, label: '一键拉取', desc: 'ollama pull' },
            { icon: <MonitorSpeaker className="h-3.5 w-3.5" />, label: '零成本', desc: '完全免费' },
          ].map((feat, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center rounded-xl p-2.5"
              style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}
            >
              <div className="mb-1" style={{ color: 'var(--t-accent-light)' }}>{feat.icon}</div>
              <span className="text-[10px] font-medium" style={{ color: 'var(--t-text)' }}>{feat.label}</span>
              <span className="text-[9px]" style={{ color: 'var(--t-text-muted)' }}>{feat.desc}</span>
            </div>
          ))}
        </div>

        {/* Server Configuration */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="h-3.5 w-3.5" style={{ color: 'var(--t-accent-light)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>服务器配置</span>
          </div>

          {/* Endpoint URL */}
          <div className="mb-3">
            <label className="mb-1.5 block text-[10px] font-medium" style={{ color: 'var(--t-text-secondary)' }}>
              Ollama 服务地址
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--t-text-muted)' }} />
                <input
                  type="text"
                  value={ollamaEndpoint}
                  onChange={e => setOllamaEndpoint(e.target.value)}
                  className="glass-input w-full rounded-lg py-2.5 pl-9 pr-3 text-xs font-mono"
                  placeholder="http://localhost:11434"
                />
              </div>
              <button
                onClick={testConnection}
                disabled={ollamaStatus === 'connecting'}
                className="glass-btn flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium shrink-0 disabled:opacity-50"
              >
                {ollamaStatus === 'connecting' ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wifi className="h-3.5 w-3.5" />
                )}
                测试连接
              </button>
            </div>
          </div>

          {/* Connection status message */}
          {ollamaStatus === 'connected' && (
            <div className="flex items-center gap-2 rounded-lg p-2.5 animate-fade-in" style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-[10px] text-green-400">
                已成功连接到 Ollama 服务 ({ollamaEndpoint})
              </span>
            </div>
          )}
          {ollamaStatus === 'error' && (
            <div className="flex items-start gap-2 rounded-lg p-2.5 animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
              <WifiOff className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-red-400 block">
                  无法连接到 Ollama 服务，请检查：
                </span>
                <ul className="text-[10px] text-red-400/70 mt-1 ml-3 list-disc space-y-0.5">
                  <li>确认 Ollama 已安装并正在运行</li>
                  <li>终端运行 <code className="font-mono px-1 rounded" style={{ background: 'rgba(239,68,68,0.1)' }}>ollama serve</code> 启动服务</li>
                  <li>检查端口号是否正确 (默认 11434)</li>
                </ul>
              </div>
            </div>
          )}

          {/* API Key (optional for remote Ollama) */}
          <div className="mt-3">
            <label className="mb-1.5 block text-[10px] font-medium" style={{ color: 'var(--t-text-secondary)' }}>
              API Key <span style={{ color: 'var(--t-text-muted)' }}>(可选 - 远程部署时使用)</span>
            </label>
            <input
              type="password"
              value={apiKeys['ollama'] || ''}
              onChange={e => setApiKey('ollama', e.target.value)}
              className="glass-input w-full rounded-lg py-2 px-3 text-xs"
              placeholder="本地部署无需填写..."
            />
          </div>
        </div>

        {/* Quick Start Guide */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.05), rgba(34,197,94,0.05))',
            border: '1px solid rgba(249,115,22,0.1)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>快速开始</span>
          </div>
          <div className="space-y-2">
            {[
              { step: '1', text: '安装 Ollama', cmd: 'curl -fsSL https://ollama.com/install.sh | sh' },
              { step: '2', text: '拉取模型', cmd: 'ollama pull llama3.3' },
              { step: '3', text: '启动服务', cmd: 'ollama serve' },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3">
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(34,197,94,0.2))',
                    color: '#f59e0b',
                  }}
                >
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-medium" style={{ color: 'var(--t-text-secondary)' }}>{item.text}</span>
                  <code
                    className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{ background: 'var(--t-code-bg)', color: 'var(--t-code-text)' }}
                  >
                    {item.cmd}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Model Input */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                可用模型
              </span>
              <span className="text-[10px] rounded-md px-1.5 py-0.5" style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent-text)' }}>
                {provider.models.length}
              </span>
            </div>
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="glass-btn flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium"
            >
              <Plus className="h-3 w-3" />
              自定义模型
            </button>
          </div>

          {showCustomInput && (
            <div className="flex gap-2 mb-3 animate-fade-in">
              <input
                type="text"
                value={ollamaCustomModel}
                onChange={e => setOllamaCustomModel(e.target.value)}
                className="glass-input flex-1 rounded-lg py-2 px-3 text-xs font-mono"
                placeholder="输入模型名称，如 llama3:latest, wizardcoder:13b..."
                onKeyDown={e => e.key === 'Enter' && addCustomModel()}
              />
              <button
                onClick={addCustomModel}
                disabled={!ollamaCustomModel.trim()}
                className="glass-btn-primary rounded-lg px-4 py-2 text-xs font-medium disabled:opacity-40"
              >
                使用
              </button>
            </div>
          )}
        </div>

        {/* Models Grid - Special Layout for Ollama */}
        <div className="space-y-1.5">
          {displayedModels.map(model => {
            const isSelected = selectedModel === model.id && selectedProvider === 'ollama';
            // Categorize models
            let category = '通用';
            let categoryColor = 'var(--t-accent-light)';
            if (model.id.includes('coder') || model.id.includes('codellama')) {
              category = '代码';
              categoryColor = '#22c55e';
            } else if (model.id.includes('embed')) {
              category = '嵌入';
              categoryColor = '#8b5cf6';
            } else if (model.id.includes('r1')) {
              category = '推理';
              categoryColor = '#f59e0b';
            }

            // Size hint
            let sizeHint = '';
            if (model.id.includes('70b') || model.id.includes('72b')) sizeHint = '~40GB';
            else if (model.id.includes('14b')) sizeHint = '~8GB';
            else if (model.id.includes('8b') || model.id.includes('7b') || model.name.includes('7B')) sizeHint = '~4GB';
            else if (model.id.includes('8x7b')) sizeHint = '~26GB';

            return (
              <button
                key={model.id}
                onClick={() => { setSelectedProvider('ollama'); setSelectedModel(model.id); }}
                className="w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all group"
                style={{
                  background: isSelected ? 'var(--t-accent-subtle)' : 'var(--t-glass-card)',
                  border: `1px solid ${isSelected ? 'var(--t-accent-border)' : 'transparent'}`,
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(34,197,94,0.2))'
                      : 'var(--t-glass-card)',
                    border: '1px solid var(--t-glass-border)',
                  }}
                >
                  <ProviderIcon id="ollama" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>{model.name}</h4>
                    {isSelected && <Check className="h-3.5 w-3.5" style={{ color: 'var(--t-accent-light)' }} />}
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-medium"
                      style={{ background: `${categoryColor}15`, color: categoryColor, border: `1px solid ${categoryColor}25` }}
                    >
                      {category}
                    </span>
                  </div>
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--t-text-muted)' }}>{model.description}</p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--t-text-secondary)' }}>
                    <Info className="h-3 w-3" />
                    {model.contextWindow}
                  </div>
                  {sizeHint && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--t-glass-card)', color: 'var(--t-text-muted)' }}>
                      ~{sizeHint}
                    </span>
                  )}
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: '#22c55e' }}
                  >
                    {model.pricing}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Show more / less */}
        {provider.models.length > 6 && (
          <button
            onClick={() => setShowAllModels(!showAllModels)}
            className="w-full mt-2 flex items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-medium transition-all"
            style={{ color: 'var(--t-accent-light)' }}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllModels ? 'rotate-180' : ''}`} />
            {showAllModels ? '收起' : `显示全部 ${provider.models.length} 个模型`}
          </button>
        )}

        {/* Custom model in use notice */}
        {selectedProvider === 'ollama' && !provider.models.find(m => m.id === selectedModel) && (
          <div
            className="mt-3 flex items-center gap-2 rounded-xl p-3 animate-fade-in"
            style={{
              background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(34,197,94,0.08))',
              border: '1px solid rgba(249,115,22,0.15)',
            }}
          >
            <Terminal className="h-3.5 w-3.5 shrink-0" style={{ color: '#f59e0b' }} />
            <span className="text-[10px]" style={{ color: 'var(--t-text-secondary)' }}>
              当前使用自定义模型: <code className="font-mono font-medium" style={{ color: '#f59e0b' }}>{selectedModel}</code>
            </span>
          </div>
        )}

        {/* Ollama link */}
        <div className="mt-3 flex items-center justify-center">
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] transition-colors"
            style={{ color: 'var(--t-text-muted)' }}
          >
            了解更多关于 Ollama
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function ModelsPage() {
  const { selectedProvider, selectedModel, setSelectedProvider, setSelectedModel, apiKeys, setApiKey } = useStore();
  const [expandedProvider, setExpandedProvider] = useState<string | null>(selectedProvider);

  // Filter out ollama from the regular providers list since it has its own section
  const regularProviders = modelProviders.filter(p => p.id !== 'ollama');

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4" style={{ borderBottom: '1px solid var(--t-glass-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20"
            >
              <Cpu className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--t-text)' }}>模型市场</h2>
              <p className="text-xs" style={{ color: 'var(--t-text-secondary)' }}>浏览和选择来自各厂商的大语言模型</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-medium"
              style={{ background: 'var(--t-glass-card)', color: 'var(--t-text-secondary)', border: '1px solid var(--t-glass-border)' }}
            >
              <Cpu className="h-3 w-3" />
              {modelProviders.reduce((sum, p) => sum + p.models.length, 0)} 个模型
            </span>
            <span
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-medium"
              style={{ background: 'var(--t-glass-card)', color: 'var(--t-text-secondary)', border: '1px solid var(--t-glass-border)' }}
            >
              <Server className="h-3 w-3" />
              {modelProviders.length} 个厂商
            </span>
          </div>
        </div>
      </div>

      {/* Providers */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* Cloud Providers Section */}
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="h-3 w-3" style={{ color: 'var(--t-text-muted)' }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
              云端模型厂商
            </span>
            <span className="text-[10px] rounded-md px-1.5 py-0.5" style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent-text)' }}>
              {regularProviders.length}
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--t-glass-border)' }} />
          </div>

          {regularProviders.map((provider, i) => {
            const isExpanded = expandedProvider === provider.id;
            const hasKey = !!apiKeys[provider.id];
            return (
              <div
                key={provider.id}
                className="glass-card rounded-2xl overflow-hidden animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Provider Header */}
                <button
                  onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                  className="w-full flex items-center gap-4 p-5 text-left transition-all"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: `${provider.color}15`, border: `1px solid ${provider.color}30` }}
                  >
                    <ProviderIcon id={provider.id} size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>{provider.name}</h3>
                      {selectedProvider === provider.id && (
                        <span
                          className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: 'var(--t-badge-bg)', color: 'var(--t-badge-text)' }}
                        >
                          当前使用
                        </span>
                      )}
                      {hasKey && (
                        <span className="rounded-md bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-300">
                          已配置
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--t-text-muted)' }}>
                      {provider.models.length} 个可用模型
                    </p>
                  </div>
                  <div className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg className="h-4 w-4" style={{ color: 'var(--t-text-muted)' }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-5 animate-fade-in" style={{ borderTop: '1px solid var(--t-glass-border)' }}>
                    {/* API Key Input */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--t-text-secondary)' }}>API Key</label>
                        <input
                          type="password"
                          value={apiKeys[provider.id] || ''}
                          onChange={e => setApiKey(provider.id, e.target.value)}
                          className="glass-input w-full rounded-lg py-2 px-3 text-xs"
                          placeholder={`输入 ${provider.name} API Key...`}
                        />
                      </div>
                      <a
                        href="#"
                        className="mt-5 flex items-center gap-1 text-[10px] transition-colors"
                        style={{ color: 'var(--t-accent-light)' }}
                      >
                        获取密钥 <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {/* Models */}
                    <div className="space-y-2">
                      {provider.models.map(model => {
                        const isSelected = selectedModel === model.id && selectedProvider === provider.id;
                        return (
                          <button
                            key={model.id}
                            onClick={() => { setSelectedProvider(provider.id); setSelectedModel(model.id); }}
                            className="w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all"
                            style={{
                              background: isSelected ? 'var(--t-accent-subtle)' : 'var(--t-glass-card)',
                              border: `1px solid ${isSelected ? 'var(--t-accent-border)' : 'transparent'}`,
                            }}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>{model.name}</h4>
                                {isSelected && <Check className="h-3.5 w-3.5" style={{ color: 'var(--t-accent-light)' }} />}
                              </div>
                              <p className="text-[10px] mt-0.5" style={{ color: 'var(--t-text-muted)' }}>{model.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--t-text-secondary)' }}>
                                <Info className="h-3 w-3" />
                                {model.contextWindow}
                              </div>
                              <p className="text-[10px] mt-0.5" style={{ color: 'var(--t-text-muted)' }}>{model.pricing}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Local Model Section Divider */}
          <div className="flex items-center gap-2 mt-6 mb-1 pt-2">
            <Server className="h-3 w-3" style={{ color: 'var(--t-text-muted)' }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
              本地模型
            </span>
            <span
              className="text-[10px] rounded-md px-1.5 py-0.5 font-medium"
              style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(34,197,94,0.1))',
                color: '#f59e0b',
              }}
            >
              自部署
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--t-glass-border)' }} />
          </div>

          {/* vLLM Section */}
          <VLLMSection />

          {/* Ollama Special Section */}
          <OllamaSection />

        </div>
      </div>
    </div>
  );
}
