import { useState, useRef } from 'react';
import { useKnowledgeBaseStore } from '../stores/knowledgeBaseStore';
import { useStore } from '../store';
import { RAGService } from '../services/ragService';
import { DocumentParser } from '../services/documentParser';
import { EMBEDDING_MODELS, EmbeddingConfig, EmbeddingService } from '../services/embeddingService';
import { Database, Plus, Trash2, Upload, X, Settings, Check, Key, Globe, Eye, FileText, Layers, Tag, Hash, Zap, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Document, DocumentChunk, getTagColor } from '../types/rag';

interface EmbeddingSettingsModalProps {
  config: EmbeddingConfig;
  onSave: (config: EmbeddingConfig) => void;
  onClose: () => void;
}

function EmbeddingSettingsModal({ config, onSave, onClose }: EmbeddingSettingsModalProps) {
  const [selectedModel, setSelectedModel] = useState(config.model);
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(config.baseUrl || '');
  const [ollamaModel, setOllamaModel] = useState(config.ollamaModel || '');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    dimensions?: number;
    durationMs?: number;
    sampleVector?: number[];
  } | null>(null);

  const selectedModelInfo = EMBEDDING_MODELS.find(m => m.id === selectedModel);

  const handleSave = () => {
    onSave({
      model: selectedModel,
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || undefined,
      ollamaModel: ollamaModel || selectedModelInfo?.defaultModelName || undefined,
    });
    onClose();
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const testConfig: EmbeddingConfig = {
        model: selectedModel,
        apiKey: apiKey || undefined,
        baseUrl: baseUrl || undefined,
        ollamaModel: ollamaModel || selectedModelInfo?.defaultModelName || undefined,
      };
      const service = new EmbeddingService(testConfig);
      const vec = await service.generateEmbedding('Hello, this is a test of the embedding model.');
      const duration = Math.round(performance.now() - start);
      setTestResult({
        ok: true,
        message: `✅ 连接成功`,
        dimensions: vec.length,
        durationMs: duration,
        sampleVector: vec.slice(0, 6).map((n) => Number(n.toFixed(4))),
      });
    } catch (e) {
      setTestResult({
        ok: false,
        message: e instanceof Error ? e.message : '测试失败',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="glass-card relative rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: 'var(--t-text)' }}>
            嵌入模型配置
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--t-text-muted)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Model Selection */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--t-text-secondary)' }}>
              选择嵌入模型
            </label>
            <div className="space-y-2">
              {EMBEDDING_MODELS.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`glass-card rounded-xl p-3 cursor-pointer transition-all ${
                    selectedModel === model.id ? 'ring-2' : ''
                  }`}
                  style={{
                    borderColor: selectedModel === model.id ? 'var(--t-accent)' : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>
                        {model.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--t-text-muted)' }}>
                        {model.description} · {model.dimensions}维 · 最大{model.maxTokens}tokens
                      </p>
                    </div>
                    {selectedModel === model.id && (
                      <Check className="h-5 w-5" style={{ color: 'var(--t-accent)' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Key Input (for OpenAI / Jina) */}
          {(selectedModelInfo?.provider === 'openai' || selectedModelInfo?.id === 'jina-embeddings-v3') && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--t-text-secondary)' }}>
                <Key className="h-3 w-3 inline mr-1" />
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="glass-input w-full rounded-lg py-2 px-3 text-sm"
                placeholder={selectedModelInfo?.id === 'jina-embeddings-v3' ? 'jina_...' : 'sk-...'}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--t-text-muted)' }}>
                您的 API Key 仅存储在本地浏览器中
              </p>
            </div>
          )}

          {/* Base URL Input (OpenAI / Ollama / LM Studio) */}
          {(selectedModelInfo?.provider === 'openai' || selectedModelInfo?.provider === 'ollama' || selectedModelInfo?.provider === 'lmstudio') && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--t-text-secondary)' }}>
                <Globe className="h-3 w-3 inline mr-1" />
                {selectedModelInfo?.provider === 'ollama'
                  ? 'Ollama 服务地址'
                  : selectedModelInfo?.provider === 'lmstudio'
                    ? 'LM Studio 服务地址'
                    : '自定义 Base URL (可选)'}
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="glass-input w-full rounded-lg py-2 px-3 text-sm"
                placeholder={
                  selectedModelInfo?.provider === 'ollama'
                    ? 'http://localhost:11434'
                    : selectedModelInfo?.provider === 'lmstudio'
                      ? 'http://localhost:2233'
                      : 'https://api.openai.com/v1'
                }
              />
            </div>
          )}

          {/* Ollama / LM Studio Model Name */}
          {(selectedModelInfo?.provider === 'ollama' || selectedModelInfo?.provider === 'lmstudio') && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--t-text-secondary)' }}>
                {selectedModelInfo?.provider === 'ollama' ? 'Ollama 模型名称' : 'LM Studio 模型名称'}
              </label>
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="glass-input w-full rounded-lg py-2 px-3 text-sm"
                placeholder={selectedModelInfo?.defaultModelName || 'nomic-embed-text'}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--t-text-muted)' }}>
                留空使用默认 <code>{selectedModelInfo?.defaultModelName}</code>。<br />
                {selectedModelInfo?.provider === 'ollama' ? (
                  <>首次使用前需运行 <code className="text-cyan-400">ollama pull {selectedModelInfo?.defaultModelName}</code>（默认端口 11434）</>
                ) : (
                  <>在 LM Studio Developer → Server 启用 OpenAI 兼容；模型名称按 LM Studio 显示填写（默认端口 1234，用户常用 2233）</>
                )}
              </p>
            </div>
          )}

          {/* HF API Token (optional) */}
          {selectedModelInfo?.id === 'sentence-transformers/all-MiniLM-L6-v2' && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--t-text-secondary)' }}>
                <Key className="h-3 w-3 inline mr-1" />
                HF Token (可选, 提高速率限制)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="glass-input w-full rounded-lg py-2 px-3 text-sm"
                placeholder="hf_..."
              />
            </div>
          )}

          {/* Current Config Display */}
          <div className="glass-card rounded-xl p-3" style={{ background: 'var(--t-accent-subtle)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--t-text-secondary)' }}>
              当前配置
            </p>
            <p className="text-sm" style={{ color: 'var(--t-text)' }}>
              模型: {selectedModelInfo?.name}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--t-text-muted)' }}>
              提供商: {
                selectedModelInfo?.provider === 'openai' ? 'OpenAI' :
                selectedModelInfo?.provider === 'huggingface' ? 'HuggingFace / Jina' :
                selectedModelInfo?.provider === 'ollama' ? 'Ollama (本地)' :
                selectedModelInfo?.provider === 'lmstudio' ? 'LM Studio (本地)' :
                selectedModelInfo?.provider === 'local' ? '本地哈希' : '未知'
              }
              {apiKey && ' · 已配置 API Key'}
              {baseUrl && ` · ${baseUrl}`}
              {ollamaModel && (selectedModelInfo?.provider === 'ollama' || selectedModelInfo?.provider === 'lmstudio') && ` · 模型 ${ollamaModel}`}
            </p>
          </div>

          <button
            onClick={handleTest}
            disabled={isTesting}
            className="glass-card w-full rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ color: 'var(--t-text)' }}
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                测试中…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                测试连接
              </>
            )}
          </button>

          {testResult && (
            <div
              className="glass-card rounded-xl p-3 text-xs"
              style={{
                background: testResult.ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                borderColor: testResult.ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
                color: testResult.ok ? 'rgb(134,239,172)' : 'rgb(252,165,165)',
              }}
            >
              <div className="flex items-start gap-2">
                {testResult.ok ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium whitespace-pre-wrap break-words">{testResult.message}</p>
                  {testResult.ok && (
                    <>
                      <p className="mt-1 opacity-80">
                        维度: <strong>{testResult.dimensions}</strong> · 耗时: <strong>{testResult.durationMs}ms</strong>
                      </p>
                      {testResult.sampleVector && (
                        <p className="mt-1 font-mono opacity-70 break-all">
                          [{testResult.sampleVector.join(', ')}, …]
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            className="glass-btn-primary w-full rounded-lg py-2.5 text-sm font-medium"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}

interface DocumentPreviewModalProps {
  document: Document;
  chunks: DocumentChunk[];
  onClose: () => void;
}

function DocumentPreviewModal({ document, chunks, onClose }: DocumentPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'chunks'>('content');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="glass-card relative rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--t-glass-border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--t-accent-subtle)' }}
            >
              <span className="text-xl">{DocumentParser.getFileIcon(document.type)}</span>
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--t-text)' }}>
                {document.name}
              </h3>
              <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                {DocumentParser.formatFileSize(document.size)} · {chunks.length} 个片段
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <X className="h-5 w-5" style={{ color: 'var(--t-text-muted)' }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-2 px-4 border-b" style={{ borderColor: 'var(--t-glass-border)' }}>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === 'content'
                ? 'font-medium'
                : ''
            }`}
            style={{
              background: activeTab === 'content' ? 'var(--t-accent-subtle)' : 'transparent',
              color: activeTab === 'content' ? 'var(--t-text)' : 'var(--t-text-muted)',
            }}
          >
            <FileText className="h-4 w-4" />
            原始内容
          </button>
          <button
            onClick={() => setActiveTab('chunks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === 'chunks'
                ? 'font-medium'
                : ''
            }`}
            style={{
              background: activeTab === 'chunks' ? 'var(--t-accent-subtle)' : 'transparent',
              color: activeTab === 'chunks' ? 'var(--t-text)' : 'var(--t-text-muted)',
            }}
          >
            <Layers className="h-4 w-4" />
            分块详情 ({chunks.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'content' ? (
            <div className="h-full overflow-y-auto p-4">
              <pre
                className="whitespace-pre-wrap font-mono text-sm leading-relaxed p-4 rounded-xl"
                style={{
                  background: 'var(--t-glass-bg)',
                  color: 'var(--t-text)',
                  minHeight: '100%',
                }}
              >
                {document.content}
              </pre>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4 space-y-3">
              {chunks.map((chunk, index) => (
                <div
                  key={chunk.id}
                  className="glass-card rounded-xl p-4"
                  style={{ borderLeft: '3px solid var(--t-accent)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-medium px-2 py-1 rounded"
                      style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent)' }}
                    >
                      片段 {index + 1} / {chunks.length}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                      {chunk.content.length} 字符
                    </span>
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--t-text-secondary)' }}
                  >
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'var(--t-glass-border)' }}>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--t-text-muted)' }}>
            <span>创建于 {new Date(document.createdAt).toLocaleString('zh-CN')}</span>
            {document.updatedAt !== document.createdAt && (
              <span>更新于 {new Date(document.updatedAt).toLocaleString('zh-CN')}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="glass-btn rounded-lg px-4 py-2 text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

export function KnowledgeBasePage() {
  const { embeddingConfig, setEmbeddingConfig } = useStore();

  const kb = useKnowledgeBaseStore();
  const {
    knowledgeBases,
    activeKnowledgeBaseId,
    selectedKnowledgeBaseIds,
    selectedTags,
    isUploading,
    uploadProgress,
    createKnowledgeBase,
    deleteKnowledgeBase,
    setActiveKnowledgeBase,
    toggleKnowledgeBaseSelection,
    setSelectedKnowledgeBases,
    setKnowledgeBaseTags,
    toggleTagSelection,
    setSelectedTags,
    getAllTags,
    getFilteredKnowledgeBases,
    addDocument,
    removeDocument,
    getActiveKnowledgeBase,
    setIsUploading,
    setUploadProgress,
  } = kb;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [newKBName, setNewKBName] = useState('');
  const [newKBDescription, setNewKBDescription] = useState('');
  const [newKBTags, setNewKBTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [editingKBId, setEditingKBId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeKB = getActiveKnowledgeBase();
  const allTags = getAllTags();
  const filteredKnowledgeBases = getFilteredKnowledgeBases();

  // Handle multi-select checkbox
  const handleKBCheckboxChange = (kbId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleKnowledgeBaseSelection(kbId);
  };

  // Select all KBs
  const handleSelectAll = () => {
    if (selectedKnowledgeBaseIds.length === filteredKnowledgeBases.length) {
      setSelectedKnowledgeBases([]);
    } else {
      setSelectedKnowledgeBases(filteredKnowledgeBases.map(kb => kb.id));
    }
  };

  // Handle tag input for new KB
  const handleAddTag = () => {
    if (newTagInput.trim() && !newKBTags.includes(newTagInput.trim())) {
      setNewKBTags([...newKBTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewKBTags(newKBTags.filter(t => t !== tag));
  };

  const handleCreateKB = () => {
    if (newKBName.trim()) {
      createKnowledgeBase(newKBName.trim(), newKBDescription.trim(), newKBTags);
      setNewKBName('');
      setNewKBDescription('');
      setNewKBTags([]);
      setShowCreateModal(false);
    }
  };

  const handleOpenTagModal = (kbId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const kb = knowledgeBases.find(k => k.id === kbId);
    if (kb) {
      setEditingKBId(kbId);
      setNewKBTags(kb.tags);
      setShowTagModal(true);
    }
  };

  const handleSaveTags = () => {
    if (editingKBId) {
      setKnowledgeBaseTags(editingKBId, newKBTags);
      setShowTagModal(false);
      setEditingKBId(null);
      setNewKBTags([]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeKnowledgeBaseId) return;

    setIsUploading(true);
    let progress = 0;
    setUploadProgress(progress);

    try {
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + 10, 90);
        setUploadProgress(progress);
      }, 200);

      // Create RAG service with current embedding config
      const ragService = new RAGService(embeddingConfig);
      const { document, chunks } = await ragService.processDocument(
        file,
        activeKnowledgeBaseId,
        (p) => {
          clearInterval(progressInterval);
          setUploadProgress(p);
        }
      );

      addDocument(activeKnowledgeBaseId, document, chunks);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('上传失败: ' + (error as Error).message);
      setIsUploading(false);
    }
  };

  const handleUrlImport = async (url: string) => {
    if (!url || !activeKnowledgeBaseId) return;
    setIsUploading(true);
    setUploadProgress(20);
    try {
      // 代理顺序: Jina Reader (CORS 完美, 返回 clean markdown) → allorigins → corsproxy → codetabs → wayback
      // 注意: 浏览器 fetch 跨域 URL 总是触发 CORS 警告, 直接 fetch 必须放弃
      const CORS_PROXIES: Array<{ name: string; fn: (u: string) => string; contentType?: 'html' | 'markdown' }> = [
        { name: 'Jina Reader', fn: (u) => `https://r.jina.ai/${u}`, contentType: 'markdown' },
        { name: 'allorigins', fn: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
        { name: 'corsproxy.io', fn: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}` },
        { name: 'codetabs', fn: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}` },
        { name: 'thingproxy', fn: (u) => `https://thingproxy.freeboard.io/fetch/${u}` },
        { name: 'web.archive', fn: (u) => `https://web.archive.org/web/2024/${u}` },
      ];

      let html: string | null = null;
      let attempts: string[] = [];
      for (const proxy of CORS_PROXIES) {
        const proxiedUrl = proxy.fn(url);
        try {
          const res = await fetch(proxiedUrl, { signal: AbortSignal.timeout(15000) });
          if (!res.ok) { attempts.push(`${proxy.name}=HTTP${res.status}`); continue; }
          const text = await res.text();
          if (text && text.length > 50) { html = text; break; }
          attempts.push(`${proxy.name}=过短`);
        } catch (e) {
          attempts.push(`${proxy.name}=${e instanceof Error ? e.message.slice(0, 30) : 'failed'}`);
        }
      }
      if (!html) throw new Error(`所有代理失败 (${attempts.join(', ')})`);

      setUploadProgress(50);
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
        .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
        .replace(/<header[\s\S]*?<\/header>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      if (!text || text.length < 20) throw new Error('页面内容过短');
      console.log(`URL import: cleaned text length = ${text.length} chars`);

      // 截断超大文本 (避免 V8 内部限制 + Ollama 处理慢)
      const MAX_IMPORT_CHARS = 2_000_000; // 2MB 文本 ≈ 2500 chunks @ 800
      const finalText = text.length > MAX_IMPORT_CHARS
        ? text.slice(0, MAX_IMPORT_CHARS)
        : text;
      if (text.length > MAX_IMPORT_CHARS) {
        console.warn(`URL import: truncating ${text.length} → ${MAX_IMPORT_CHARS} chars`);
      }

      setUploadProgress(70);
      const file = new File([finalText], `${new URL(url).hostname || 'webpage'}.txt`, { type: 'text/plain' });
      const ragService = new RAGService(embeddingConfig);
      const { document, chunks } = await ragService.processDocument(
        file, activeKnowledgeBaseId, (p) => setUploadProgress(Math.max(70, p))
      );
      addDocument(activeKnowledgeBaseId, document, chunks);
      setUploadProgress(100);
      setTimeout(() => { setIsUploading(false); setUploadProgress(0); }, 500);
    } catch (e) {
      console.error('URL import failed:', e);
      const msg = e instanceof Error ? e.message : String(e);
      const stack = e instanceof Error ? e.stack : '';
      const isNetwork = /代理|fetch|network|cors|HTTP/i.test(msg);
      const advice = isNetwork
        ? '\n\n可能原因:\n1. 目标站点 (如飞书/微信) 防爬严格,所有代理被屏蔽\n2. 当前网络环境无法访问境外代理 (如 allorigins.win、corsproxy.io)\n3. 站点需要登录才能访问'
        : '\n\n请检查:\n1. 嵌入服务 (Ollama/LM Studio) 是否在运行\n2. 嵌入模型是否已加载\n3. 浏览器控制台完整错误日志';
      alert(`URL 导入失败: ${msg.slice(0, 300)}${advice}\n\n📋 完整错误请查看浏览器控制台 (F12 → Console)`);
      if (stack) console.error('Stack:', stack);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'var(--t-accent-subtle)', border: '1px solid var(--t-accent-border)' }}
          >
            <Database className="h-5 w-5" style={{ color: 'var(--t-accent-light)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--t-text)' }}>知识库</h2>
            <p className="text-xs" style={{ color: 'var(--t-text-secondary)' }}>
              管理文档，支持 RAG 检索增强
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {knowledgeBases.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="glass-btn flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
            >
              <Check className="h-4 w-4" />
              {selectedKnowledgeBaseIds.length === knowledgeBases.length
                ? '取消全选'
                : '全选'}
            </button>
          )}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="glass-btn flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <Settings className="h-4 w-4" />
            嵌入配置
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="glass-btn flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            新建知识库
          </button>
        </div>
      </div>

      {selectedKnowledgeBaseIds.length > 0 && (
        <div 
          className="mb-4 px-4 py-2 rounded-lg flex items-center justify-between"
          style={{ background: 'var(--t-accent-subtle)' }}
        >
          <span className="text-sm" style={{ color: 'var(--t-accent-text)' }}>
            已选择 {selectedKnowledgeBaseIds.length} 个知识库用于检索
          </span>
          <button
            onClick={() => setSelectedKnowledgeBases([])}
            className="text-xs hover:underline"
            style={{ color: 'var(--t-accent)' }}
          >
            清除选择
          </button>
        </div>
      )}

      {/* Tag Filter Section */}
      {allTags.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4" style={{ color: 'var(--t-text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>按标签筛选</span>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs hover:underline ml-2"
                style={{ color: 'var(--t-accent)' }}
              >
                清除筛选
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const colors = getTagColor(tag);
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTagSelection(tag)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                    isSelected ? 'ring-2' : ''
                  }`}
                  style={{
                    background: isSelected ? colors.bg : 'var(--t-glass-card)',
                    color: isSelected ? colors.text : 'var(--t-text-secondary)',
                    border: `1px solid ${isSelected ? colors.border : 'var(--t-glass-border)'}`,
                  }}
                >
                  <Hash className="h-3 w-3" />
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {knowledgeBases.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Database className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--t-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--t-text-secondary)' }}>
              暂无知识库，点击上方按钮创建
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-4">
          {/* Knowledge Base List */}
          <div className="col-span-1 space-y-3">
            {filteredKnowledgeBases.map((kb) => (
              <div
                key={kb.id}
                onClick={() => setActiveKnowledgeBase(kb.id)}
                className={`glass-card rounded-xl p-4 cursor-pointer transition-all ${
                  activeKnowledgeBaseId === kb.id ? 'ring-2' : ''
                }`}
                style={{
                  borderColor: activeKnowledgeBaseId === kb.id ? 'var(--t-accent)' : undefined,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {/* Multi-select checkbox */}
                    <div
                      onClick={(e) => handleKBCheckboxChange(kb.id, e)}
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
                        selectedKnowledgeBaseIds.includes(kb.id)
                          ? 'bg-accent border-accent'
                          : 'border-gray-400 hover:border-accent'
                      }`}
                      style={{
                        backgroundColor: selectedKnowledgeBaseIds.includes(kb.id)
                          ? 'var(--t-accent)'
                          : 'transparent',
                        borderColor: selectedKnowledgeBaseIds.includes(kb.id)
                          ? 'var(--t-accent)'
                          : undefined,
                      }}
                    >
                      {selectedKnowledgeBaseIds.includes(kb.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <Database className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>
                      {kb.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Tag edit button */}
                    <button
                      onClick={(e) => handleOpenTagModal(kb.id, e)}
                      className="text-xs p-1 rounded hover:bg-blue-500/20"
                      style={{ color: 'var(--t-text-muted)' }}
                      title="管理标签"
                    >
                      <Tag className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteKnowledgeBase(kb.id);
                      }}
                      className="text-xs p-1 rounded hover:bg-red-500/20"
                      style={{ color: 'var(--t-text-muted)' }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {kb.description && (
                  <p className="text-xs mt-2 truncate" style={{ color: 'var(--t-text-secondary)' }}>
                    {kb.description}
                  </p>
                )}
                {/* Display tags */}
                {kb.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {kb.tags.map((tag) => {
                      const colors = getTagColor(tag);
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]"
                          style={{
                            background: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                    {kb.documents.length} 个文档
                  </span>
                  <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                    {kb.chunks.length} 个片段
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Document List */}
          <div className="col-span-2">
            {activeKB ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>
                    {activeKB.name} - 文档列表
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const url = prompt('输入网页 URL (https://...):');
                        if (url) handleUrlImport(url);
                      }}
                      disabled={isUploading}
                      className="glass-btn flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium"
                      title="从 URL 抓取网页内容添加到知识库"
                    >
                      <Globe className="h-3 w-3" />
                      URL 导入
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="glass-btn flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium"
                    >
                      <Upload className="h-3 w-3" />
                      {isUploading ? `上传中 ${uploadProgress}%` : '上传文档'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".txt,.md,.pdf,.docx,.xlsx,.csv"
                    />
                  </div>
                </div>

                {activeKB.documents.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center glass-card rounded-xl">
                    <p className="text-sm" style={{ color: 'var(--t-text-muted)' }}>
                      暂无文档，点击上传按钮添加
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeKB.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="glass-card rounded-xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{ background: 'var(--t-glass-card)' }}
                          >
                            <span className="text-lg">{DocumentParser.getFileIcon(doc.type)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>
                              {doc.name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                              {DocumentParser.formatFileSize(doc.size)} · {doc.chunks.length} 个片段
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPreviewDocument(doc)}
                            className="p-1.5 rounded-lg hover:bg-blue-500/20"
                            style={{ color: 'var(--t-text-muted)' }}
                            title="预览文档"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeDocument(activeKB.id, doc.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20"
                            style={{ color: 'var(--t-text-muted)' }}
                            title="删除文档"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center glass-card rounded-xl">
                <p className="text-sm" style={{ color: 'var(--t-text-muted)' }}>
                  选择左侧知识库查看文档
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Knowledge Base Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="glass-card relative rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: 'var(--t-text)' }}>
                新建知识库
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg"
                style={{ color: 'var(--t-text-muted)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--t-text-secondary)' }}>
                  名称
                </label>
                <input
                  type="text"
                  value={newKBName}
                  onChange={(e) => setNewKBName(e.target.value)}
                  className="glass-input w-full rounded-lg py-2 px-3 text-sm"
                  placeholder="输入知识库名称"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--t-text-secondary)' }}>
                  描述（可选）
                </label>
                <textarea
                  value={newKBDescription}
                  onChange={(e) => setNewKBDescription(e.target.value)}
                  className="glass-input w-full rounded-lg py-2 px-3 text-sm resize-none"
                  rows={3}
                  placeholder="输入知识库描述"
                />
              </div>
              {/* Tags input */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--t-text-secondary)' }}>
                  标签
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="glass-input flex-1 rounded-lg py-2 px-3 text-sm"
                    placeholder="输入标签名称，按回车添加"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTagInput.trim()}
                    className="glass-btn rounded-lg px-3 py-2 text-sm"
                  >
                    添加
                  </button>
                </div>
                {newKBTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newKBTags.map((tag) => {
                      const colors = getTagColor(tag);
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                          style={{
                            background: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:opacity-70"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                onClick={handleCreateKB}
                disabled={!newKBName.trim()}
                className="glass-btn-primary w-full rounded-lg py-2.5 text-sm font-medium"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedding Settings Modal */}
      {showSettingsModal && (
        <EmbeddingSettingsModal
          config={embeddingConfig}
          onSave={setEmbeddingConfig}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Tag Management Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowTagModal(false)}
          />
          <div className="glass-card relative rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: 'var(--t-text)' }}>
                管理标签
              </h3>
              <button
                onClick={() => setShowTagModal(false)}
                className="p-1 rounded-lg"
                style={{ color: 'var(--t-text-muted)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--t-text-secondary)' }}>
                  添加标签
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="glass-input flex-1 rounded-lg py-2 px-3 text-sm"
                    placeholder="输入标签名称，按回车添加"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTagInput.trim()}
                    className="glass-btn rounded-lg px-3 py-2 text-sm"
                  >
                    添加
                  </button>
                </div>
              </div>
              {newKBTags.length > 0 ? (
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--t-text-secondary)' }}>
                    当前标签
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {newKBTags.map((tag) => {
                      const colors = getTagColor(tag);
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                          style={{
                            background: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:opacity-70"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-center py-4" style={{ color: 'var(--t-text-muted)' }}>
                  暂无标签，请添加
                </p>
              )}
              <button
                onClick={handleSaveTags}
                className="glass-btn-primary w-full rounded-lg py-2.5 text-sm font-medium"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocument && activeKB && (
        <DocumentPreviewModal
          document={previewDocument}
          chunks={activeKB.chunks.filter(c => c.metadata.documentId === previewDocument.id)}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
}
