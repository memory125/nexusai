import { useState, useRef, useEffect } from 'react';
import { useStore, modelProviders } from '../store';
import { Send, Sparkles, Bot, User, ChevronDown, Paperclip, Mic, StopCircle, Database, ChevronUp, FileText, X, Play, Volume2, Volume1, FileCode, Search, Star, Plus, ThumbsUp, ThumbsDown, Download, Copy, FileJson, File } from 'lucide-react';
import { ProviderIcon } from './ProviderIcons';
import { useKnowledgeBaseStore } from '../stores/knowledgeBaseStore';
import { RAGService } from '../services/ragService';
import { multimodalService } from '../services/multimodalService';
import { conversationTemplateService, ConversationTemplate, TemplateCategory } from '../services/conversationTemplateService';
import { messageRatingService, Rating } from '../services/messageRatingService';
import { conversationExportService } from '../services/conversationExportService';
import { ttsService } from '../services/ttsService';
import type { Attachment } from '../types/multimodal';
import { formatFileSize } from '../types/multimodal';

// Helper functions for export
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert('已复制到剪贴板！');
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

// Template Selector Modal Component
function TemplateSelectorModal({ 
  onSelect, 
  onClose 
}: { 
  onSelect: (template: ConversationTemplate, variables?: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [templates, setTemplates] = useState<ConversationTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // New template form
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    content: '',
    category: 'general' as TemplateCategory,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    let ts = conversationTemplateService.getAllTemplates();
    if (searchQuery) {
      ts = conversationTemplateService.searchTemplates(searchQuery);
    }
    if (selectedCategory !== 'all') {
      ts = ts.filter(t => t.category === selectedCategory);
    }
    setTemplates(ts);
  };

  useEffect(() => {
    loadTemplates();
  }, [searchQuery, selectedCategory]);

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) return;
    
    conversationTemplateService.createTemplate({
      name: newTemplate.name,
      description: newTemplate.description,
      content: newTemplate.content,
      category: newTemplate.category,
    });
    
    setNewTemplate({ name: '', description: '', content: '', category: 'general' });
    setShowCreateForm(false);
    loadTemplates();
  };

  const categories: { value: TemplateCategory | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: '全部', icon: '📁' },
    { value: 'general', label: '通用', icon: '💬' },
    { value: 'coding', label: '编程', icon: '💻' },
    { value: 'writing', label: '写作', icon: '✍️' },
    { value: 'analysis', label: '分析', icon: '📊' },
    { value: 'creative', label: '创意', icon: '🎨' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="glass-card rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--t-text)' }}>选择模板</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--t-text-muted)' }}
              title="创建新模板"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--t-text-muted)' }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--t-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索模板..."
            className="glass-input w-full rounded-xl py-2 pl-10 pr-4 text-sm"
            style={{ color: 'var(--t-text)' }}
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                selectedCategory === cat.value 
                  ? 'bg-indigo-500/20 text-indigo-400' 
                  : 'bg-white/5 hover:bg-white/10'
              }`}
              style={{ color: selectedCategory === cat.value ? undefined : 'var(--t-text-muted)' }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-4 p-4 rounded-xl bg-white/5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="模板名称"
                className="glass-input rounded-lg py-2 px-3 text-sm"
                style={{ color: 'var(--t-text)' }}
              />
              <select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as TemplateCategory })}
                className="glass-input rounded-lg py-2 px-3 text-sm"
                style={{ color: 'var(--t-text)' }}
              >
                <option value="general">通用</option>
                <option value="coding">编程</option>
                <option value="writing">写作</option>
                <option value="analysis">分析</option>
                <option value="creative">创意</option>
                <option value="other">其他</option>
              </select>
            </div>
            <input
              type="text"
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              placeholder="模板描述（可选）"
              className="glass-input w-full rounded-lg py-2 px-3 text-sm"
              style={{ color: 'var(--t-text)' }}
            />
            <textarea
              value={newTemplate.content}
              onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
              placeholder="模板内容...（使用 {{变量名}} 定义变量）"
              className="glass-input w-full rounded-lg py-2 px-3 text-sm"
              style={{ color: 'var(--t-text)', minHeight: 100 }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                style={{ color: 'var(--t-text)' }}
              >
                取消
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!newTemplate.name.trim() || !newTemplate.content.trim()}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        )}

        {/* Template List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {templates.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--t-text-muted)' }}>
              暂无模板
            </p>
          ) : (
            templates.map(template => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: 'var(--t-text)' }}>{template.name}</span>
                    {template.isFavorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5" style={{ color: 'var(--t-text-muted)' }}>
                      {categories.find(c => c.value === template.category)?.label || template.category}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>使用 {template.usageCount} 次</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{template.description}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// RAG Sources Component - displays retrieved document chunks with performance stats
function RAGSources({ 
  sources, 
  stats 
}: { 
  sources: Array<{ chunkId: string; documentId: string; documentName: string; content: string; similarity: number }>;
  stats?: { retrievalTime: number; embeddingTime: number; totalTime: number; chunksSearched: number; chunksRetrieved: number; tokensUsed: number; timestamp: number };
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSource, setSelectedSource] = useState<typeof sources[0] | null>(null);
  const [showStats, setShowStats] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--t-glass-border)' }}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-medium w-full hover:opacity-80 transition-opacity"
        style={{ color: 'var(--t-accent-light)' }}
      >
        <Database className="h-3.5 w-3.5" />
        <span>检索来源 ({sources.length} 个相关片段)</span>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 ml-auto" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 ml-auto" />
        )}
      </button>

      {/* Collapsed View - Show count badges */}
      {!isExpanded && (
        <div className="flex flex-wrap gap-2 mt-2">
          {sources.slice(0, 3).map((source, idx) => (
            <span
              key={source.chunkId}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
              style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent)' }}
            >
              <FileText className="h-3 w-3" />
              [{idx + 1}] {source.documentName}
              <span className="opacity-70">({Math.round(source.similarity * 100)}%)</span>
            </span>
          ))}
          {sources.length > 3 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px]"
              style={{ background: 'var(--t-glass-card)', color: 'var(--t-text-muted)' }}
            >
              +{sources.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Performance Stats - Collapsed View */}
      {!isExpanded && stats && (
        <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            {stats.totalTime}ms
          </span>
          <span>·</span>
          <span>{stats.chunksSearched} 个片段</span>
          <span>·</span>
          <span>~{stats.tokensUsed} tokens</span>
        </div>
      )}

      {/* Expanded View - Show all sources */}
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {/* Performance Stats Bar */}
          {stats && (
            <div 
              className="glass-card rounded-lg p-3 mb-3"
              style={{ background: 'var(--t-accent-subtle)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--t-text)' }}>
                  检索性能统计
                </span>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="text-[10px] hover:underline"
                  style={{ color: 'var(--t-accent)' }}
                >
                  {showStats ? '收起' : '详情'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded" style={{ background: 'var(--t-glass-card)' }}>
                  <div className="text-lg font-bold" style={{ color: 'var(--t-accent)' }}>
                    {stats.totalTime}<span className="text-xs font-normal">ms</span>
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>总耗时</div>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--t-glass-card)' }}>
                  <div className="text-lg font-bold" style={{ color: 'var(--t-accent)' }}>
                    {stats.chunksRetrieved}<span className="text-xs font-normal">/{stats.chunksSearched}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>检索片段</div>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--t-glass-card)' }}>
                  <div className="text-lg font-bold" style={{ color: 'var(--t-accent)' }}>
                    ~{stats.tokensUsed}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>Tokens</div>
                </div>
              </div>
              {showStats && (
                <div className="mt-3 pt-3 border-t space-y-1" style={{ borderColor: 'var(--t-glass-border)' }}>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--t-text-muted)' }}>Embedding 生成</span>
                    <span style={{ color: 'var(--t-text)' }}>{stats.embeddingTime}ms</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--t-text-muted)' }}>向量检索</span>
                    <span style={{ color: 'var(--t-text)' }}>{stats.retrievalTime}ms</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--t-text-muted)' }}>检索时间</span>
                    <span style={{ color: 'var(--t-text)' }}>
                      {new Date(stats.timestamp).toLocaleTimeString('zh-CN')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {sources.map((source, idx) => (
            <div
              key={source.chunkId}
              onClick={() => setSelectedSource(selectedSource?.chunkId === source.chunkId ? null : source)}
              className="glass-card rounded-lg p-3 cursor-pointer transition-all hover:opacity-90"
              style={{ borderLeft: `3px solid var(--t-accent)` }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center justify-center h-5 w-5 rounded text-[10px] font-bold"
                    style={{ background: 'var(--t-accent)', color: 'white' }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'var(--t-text)' }}>
                    {source.documentName}
                  </span>
                </div>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent)' }}
                >
                  相似度 {Math.round(source.similarity * 100)}%
                </span>
              </div>
              <p
                className="text-xs leading-relaxed line-clamp-2"
                style={{ color: 'var(--t-text-secondary)' }}
              >
                {source.content}
              </p>
              {selectedSource?.chunkId === source.chunkId && (
                <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--t-glass-border)' }}>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--t-text-secondary)' }}>
                    {source.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatPage() {
  const {
    conversations, activeConversationId, addMessage,
    createConversation, selectedProvider, selectedModel,
    setSelectedProvider, setSelectedModel, isGenerating,
    activeAgent,
  } = useStore();

  const {
    getSelectedKnowledgeBases,
    getSelectedChunks,
    embeddingConfig,
  } = useKnowledgeBaseStore();

  const [input, setInput] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const selectedKBs = getSelectedKnowledgeBases();
  const selectedChunks = getSelectedChunks();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // File handling
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newAttachments = await multimodalService.processFiles(files);
    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Voice recording
  const voiceRecordingRef = useRef<{ stop: () => void; audio: HTMLAudioElement } | null>(null);

  const handleVoiceRecord = async () => {
    if (isRecording) {
      // Stop recording
      if (voiceRecordingRef.current) {
        voiceRecordingRef.current.stop();
        voiceRecordingRef.current = null;
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        voiceRecordingRef.current = await multimodalService.startVoiceRecording();
        setIsRecording(true);
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  };

  // Handle message rating
  const [messageRatings, setMessageRatings] = useState<Record<string, Rating>>({});
  const [playingTTS, setPlayingTTS] = useState<string | null>(null);
  
  const handlePlayTTS = async (msgId: string, content: string) => {
    if (playingTTS === msgId) {
      ttsService.stop();
      setPlayingTTS(null);
    } else {
      setPlayingTTS(msgId);
      try {
        await ttsService.speak(content);
      } catch (e) {
        console.error('TTS error:', e);
      }
      setPlayingTTS(null);
    }
  };
  
  const handleRateMessage = (msgId: string, rating: Rating) => {
    // Toggle rating: if same rating, remove it
    if (messageRatings[msgId] === rating) {
      const newRatings = { ...messageRatings };
      delete newRatings[msgId];
      setMessageRatings(newRatings);
    } else {
      setMessageRatings({ ...messageRatings, [msgId]: rating });
    }
    
    // Also save to service
    if (activeConv) {
      messageRatingService.rateMessage(
        msgId,
        activeConv.id,
        rating,
        activeConv.messages.find(m => m.id === msgId)?.content || '',
        activeConv.model,
        activeConv.provider
      );
    }
  };

  // Update handleSend to include attachments
  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isGenerating) return;
    
    // Check if any attachment is an image and if current model supports vision
    const hasImageAttachment = attachments.some(att => att.type === 'image');
    if (hasImageAttachment) {
      const currentProvider = modelProviders.find(p => p.id === selectedProvider);
      const currentModel = currentProvider?.models.find(m => m.id === selectedModel);
      if (!currentModel?.supportsVision) {
        alert(`当前模型 ${currentModel?.name || selectedModel} 不支持图片输入。\n\n请切换到以下支持视觉的模型：\n• OpenAI: GPT-4o, GPT-4o Mini, GPT-4.1 系列\n• Anthropic: Claude 3.5/4 系列\n• Google: Gemini 系列\n• 智谱: GLM-4V-Plus`);
        return;
      }
    }
    
    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation(activeAgent?.id);
    }
    
    let content = input.trim();
    let ragSources: Array<{ chunkId: string; documentId: string; documentName: string; content: string; similarity: number }> | null = null;
    let ragStats: { retrievalTime: number; embeddingTime: number; totalTime: number; chunksSearched: number; chunksRetrieved: number; tokensUsed: number; timestamp: number } | null = null;
    
    // If knowledge bases are selected, retrieve relevant chunks from all selected KBs
    if (selectedChunks.length > 0) {
      const ragService = new RAGService(embeddingConfig);
      const searchResult = await ragService.searchRelevantChunks(
        content,
        selectedChunks,
        5
      );
      if (searchResult.results.length > 0) {
        const ragContext = RAGService.buildRAGContext(searchResult.results);
        content = `${ragContext}\n\n---\n\n用户问题：${content}`;
        
        ragSources = searchResult.results.map(result => ({
          chunkId: result.chunk.id,
          documentId: result.chunk.metadata.documentId,
          documentName: result.chunk.metadata.documentName,
          content: result.chunk.content,
          similarity: result.score,
        }));
        
        ragStats = searchResult.stats;
      }
    }
    
    addMessage(convId!, { 
      role: 'user', 
      content, 
      attachments: attachments.length > 0 ? attachments : undefined,
      ragSources: ragSources || undefined, 
      ragStats: ragStats || undefined 
    });
    setInput('');
    setAttachments([]);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  const currentProvider = modelProviders.find(p => p.id === selectedProvider);
  const currentModel = currentProvider?.models.find(m => m.id === selectedModel);

  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
        return (
          <pre key={i} className="my-3 overflow-x-auto rounded-lg p-4 text-xs leading-relaxed" style={{ background: 'var(--t-code-bg)' }}>
            <code style={{ color: 'var(--t-code-text)' }}>{code}</code>
          </pre>
        );
      }
      const lines = part.split('\n');
      return (
        <div key={i}>
          {lines.map((line, j) => {
            if (line.startsWith('> ')) {
              return <blockquote key={j} className="my-2 border-l-2 pl-3 italic" style={{ borderColor: 'var(--t-accent-border)', color: 'var(--t-text-secondary)' }}>{line.slice(2)}</blockquote>;
            }
            if (line.startsWith('- ')) {
              return <div key={j} className="flex gap-2 my-0.5"><span style={{ color: 'var(--t-accent-light)' }}>•</span><span>{renderInline(line.slice(2))}</span></div>;
            }
            if (/^\d+\.\s/.test(line)) {
              const num = line.match(/^(\d+)\.\s/)?.[1];
              return <div key={j} className="flex gap-2 my-0.5"><span className="font-medium" style={{ color: 'var(--t-accent-light)' }}>{num}.</span><span>{renderInline(line.replace(/^\d+\.\s/, ''))}</span></div>;
            }
            if (line.trim() === '') return <br key={j} />;
            return <p key={j} className="my-0.5">{renderInline(line)}</p>;
          })}
        </div>
      );
    });
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return <strong key={i} className="font-semibold" style={{ color: 'var(--t-text)' }}>{p.slice(2, -2)}</strong>;
      }
      return <span key={i}>{p}</span>;
    });
  };

  // Empty state
  if (!activeConv || activeConv.messages.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="animate-slide-up max-w-lg text-center">
            <div
              className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{
                background: 'var(--t-accent-subtle)',
                border: '1px solid var(--t-accent-border)',
              }}
            >
              {activeAgent ? (
                <span className="text-4xl">{activeAgent.icon}</span>
              ) : (
                <Sparkles className="h-10 w-10" style={{ color: 'var(--t-accent-light)' }} />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--t-text)' }}>
              {activeAgent ? activeAgent.name : '开始新对话'}
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--t-text-secondary)' }}>
              {activeAgent ? activeAgent.description : '选择模型，开始与AI助手对话'}
            </p>

            {/* Model Selector */}
            <div className="mb-6 relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="glass-card inline-flex items-center gap-3 rounded-xl px-5 py-3 cursor-pointer"
              >
                <ProviderIcon id={selectedProvider} size={24} />
                <div className="text-left">
                  <p className="text-xs font-medium" style={{ color: 'var(--t-text)' }}>{currentModel?.name || selectedModel}</p>
                  <p className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>{currentProvider?.name}</p>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} style={{ color: 'var(--t-text-muted)' }} />
              </button>

              {showModelPicker && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 glass-strong rounded-xl p-2 w-80 z-50 max-h-80 overflow-y-auto animate-fade-in">
                  {modelProviders.map(provider => (
                    <div key={provider.id} className="mb-1">
                      <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                        <ProviderIcon id={provider.id} size={16} />
                        <span>{provider.name}</span>
                      </div>
                      {provider.models.map(model => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedProvider(provider.id);
                            setSelectedModel(model.id);
                            setShowModelPicker(false);
                          }}
                          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all"
                          style={{
                            background: selectedModel === model.id ? 'var(--t-accent-subtle)' : 'transparent',
                            color: selectedModel === model.id ? 'var(--t-text)' : 'var(--t-text-secondary)',
                          }}
                        >
                          <div className="flex-1">
                            <p className="text-xs font-medium">{model.name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>{model.description}</p>
                          </div>
                          <span className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>{model.contextWindow}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {[
                '帮我写一篇技术博客',
                '分析这段代码的性能',
                '设计一个产品方案',
                '翻译以下内容为英文',
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                  }}
                  className="glass-card rounded-xl px-4 py-3 text-xs text-left"
                  style={{ color: 'var(--t-text-secondary)' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {renderInputBar()}
      </div>
    );
  }

  function renderInputBar() {
    return (
      <div className="p-4 pt-2">
        <div className="glass-strong rounded-2xl p-2 max-w-3xl mx-auto">
          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white text-sm"
                >
                  {attachment.type === 'image' && attachment.localUrl && (
                    <img src={attachment.localUrl} alt={attachment.name} className="w-8 h-8 rounded object-cover" />
                  )}
                  {attachment.type === 'audio' && <Volume2 className="w-4 h-4" />}
                  {attachment.type === 'video' && <Play className="w-4 h-4" />}
                  {attachment.type === 'file' && <FileText className="w-4 h-4" />}
                  <span className="text-xs max-w-[100px] truncate">{attachment.name}</span>
                  <span className="text-[10px] opacity-60">{formatFileSize(attachment.size)}</span>
                  <button
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-end gap-2">
            {/* Template Button */}
            <button 
              onClick={() => setShowTemplateSelector(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all mb-0.5 hover:text-white"
              style={{ color: 'var(--t-text-muted)' }}
              title="选择模板"
            >
              <FileCode className="h-4 w-4" />
            </button>
            {/* File Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.md"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all mb-0.5 hover:text-white"
              style={{ color: 'var(--t-text-muted)' }}
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (Shift+Enter 换行)"
              rows={1}
              className="flex-1 resize-none bg-transparent py-2.5 text-sm focus:outline-none"
              style={{ color: 'var(--t-text)', maxHeight: 200 }}
            />
            {/* Voice Recording Button */}
            <button 
              onClick={handleVoiceRecord}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all mb-0.5 ${isRecording ? 'text-red-400 animate-pulse' : 'hover:text-white'}`}
              style={{ color: 'var(--t-text-muted)' }}
              title={isRecording ? '点击停止录音' : '语音输入'}
            >
              <Mic className="h-4 w-4" />
            </button>
            {isGenerating ? (
              <button className="glass-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-400 mb-0.5">
                <StopCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() && attachments.length === 0}
                className="glass-btn-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl disabled:opacity-30 mb-0.5"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between px-2 pt-1 mt-1" style={{ borderTop: '1px solid var(--t-glass-border)' }}>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--t-text-muted)' }}><ProviderIcon id={selectedProvider} size={12} /> {currentModel?.name}</span>
              {selectedKBs.length > 0 && (
                <span 
                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded cursor-help" 
                  style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent-text)' }}
                  title={selectedKBs.map(kb => kb.name).join(', ')}
                >
                  <Database className="h-3 w-3" />
                  {selectedKBs.length === 1 
                    ? selectedKBs[0].name 
                    : `${selectedKBs.length} 个知识库`
                  }
                </span>
              )}
            </div>
            <span className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>{input.length} 字符 {attachments.length > 0 && `· ${attachments.length} 个附件`}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: '1px solid var(--t-glass-border)' }}>
        {activeAgent && <span className="text-xl">{activeAgent.icon}</span>}
        <div className="flex-1">
          <h3 className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{activeConv.title}</h3>
          <p className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
            <ProviderIcon id={selectedProvider} size={12} /> {currentModel?.name} · {activeConv.messages.length} 条消息
          </p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: 'var(--t-text-muted)' }}
          title="导出对话"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {activeConv.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-1"
                  style={{
                    background: 'var(--t-accent-subtle)',
                    border: '1px solid var(--t-accent-border)',
                  }}
                >
                  {activeAgent ? <span className="text-sm">{activeAgent.icon}</span> : <Bot className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />}
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'text-white' : 'glass-card'
                }`}
                style={msg.role === 'user' ? {
                  background: `linear-gradient(135deg, var(--t-user-msg-from), var(--t-user-msg-to))`,
                } : { color: 'var(--t-text)' }}
              >
              {msg.role === 'user' ? (
                <>
                  {/* Render attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.attachments.map((attachment) => (
                        <div key={attachment.id} className="relative group">
                          {attachment.type === 'image' && attachment.localUrl && (
                            <img 
                              src={attachment.localUrl} 
                              alt={attachment.name}
                              className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                            />
                          )}
                          {attachment.type === 'audio' && attachment.localUrl && (
                            <audio controls src={attachment.localUrl} className="h-8" />
                          )}
                          {attachment.type === 'video' && attachment.localUrl && (
                            <video 
                              controls 
                              src={attachment.localUrl} 
                              className="max-w-[300px] max-h-[200px] rounded-lg"
                            />
                          )}
                          {attachment.type === 'file' && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10">
                              <FileText className="w-4 h-4" />
                              <span className="text-xs">{attachment.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </>
              ) : (
                  <>
                    <div className="whitespace-pre-wrap">{renderContent(msg.content)}</div>
                    {/* Display RAG sources for assistant messages */}
                    {msg.ragSources && msg.ragSources.length > 0 && (
                      <RAGSources sources={msg.ragSources} stats={msg.ragStats} />
                    )}
                  </>
                )}
                {msg.model && msg.role === 'assistant' && (
                  <p className="mt-2 text-[10px] pt-1.5" style={{ borderTop: '1px solid var(--t-glass-border)', color: 'var(--t-text-muted)' }}>{msg.model}</p>
                )}
                {/* Rating buttons for assistant messages */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1 mt-2 pt-2" style={{ borderTop: '1px solid var(--t-glass-border)' }}>
                    <button
                      onClick={() => handleRateMessage(msg.id, 'up')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        messageRatings[msg.id] === 'up' 
                          ? 'text-green-400 bg-green-500/20' 
                          : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                      }`}
                      title="赞"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleRateMessage(msg.id, 'down')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        messageRatings[msg.id] === 'down' 
                          ? 'text-red-400 bg-red-500/20' 
                          : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title="踩"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handlePlayTTS(msg.id, msg.content)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        playingTTS === msg.id 
                          ? 'text-indigo-400 bg-indigo-500/20' 
                          : 'text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10'
                      }`}
                      title={playingTTS === msg.id ? '停止语音' : '语音播放'}
                    >
                      {playingTTS === msg.id ? <Volume1 className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 mt-1">
                  <User className="h-4 w-4 text-emerald-400" />
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex gap-3 animate-fade-in">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-1"
                style={{
                  background: 'var(--t-accent-subtle)',
                  border: '1px solid var(--t-accent-border)',
                }}
              >
                {activeAgent ? <span className="text-sm">{activeAgent.icon}</span> : <Bot className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />}
              </div>
              <div className="glass-card rounded-2xl px-5 py-4">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {renderInputBar()}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelectorModal 
          onSelect={(template) => {
            if (template.variables && template.variables.length > 0) {
              // If template has variables, show variable input first
              setSelectedTemplate(template);
              setTemplateVariables({});
              setShowTemplateSelector(false);
            } else {
              // No variables, apply directly
              setInput(template.content);
              conversationTemplateService.incrementUsage(template.id);
              inputRef.current?.focus();
              setShowTemplateSelector(false);
            }
          }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {/* Template Variable Input Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--t-text)' }}>
              填写模板变量
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--t-text-muted)' }}>
              {selectedTemplate.name}
            </p>
            
            <div className="space-y-4">
              {selectedTemplate.variables?.map((v: any) => (
                <div key={v.name}>
                  <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>
                    {v.name}
                    {v.defaultValue && <span className="text-xs ml-2 opacity-60">(默认值: {v.defaultValue})</span>}
                  </label>
                  <textarea
                    value={templateVariables[v.name] || ''}
                    onChange={(e) => setTemplateVariables({ ...templateVariables, [v.name]: e.target.value })}
                    placeholder={v.placeholder}
                    className="glass-input w-full rounded-xl py-2 px-3 text-sm"
                    style={{ color: 'var(--t-text)', minHeight: 80 }}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setTemplateVariables({});
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
                style={{ color: 'var(--t-text)' }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  const content = conversationTemplateService.renderTemplate(selectedTemplate.id, templateVariables);
                  setInput(content);
                  setSelectedTemplate(null);
                  setTemplateVariables({});
                  inputRef.current?.focus();
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm transition-colors"
              >
                应用模板
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5" style={{ color: 'var(--t-accent-light)' }} />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--t-text)' }}>
                  导出对话
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: 'var(--t-text-muted)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--t-text-secondary)' }}>
                选择导出格式：
              </p>

              {/* Export Format Options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const content = conversationExportService.exportConversation(activeConv, { format: 'markdown' });
                    downloadFile(content, `${activeConv.title}.md`, 'text/markdown');
                    setShowExportModal(false);
                  }}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <FileText className="h-6 w-6 mb-2" style={{ color: 'var(--t-accent-light)' }} />
                  <div className="font-medium text-sm" style={{ color: 'var(--t-text)' }}>Markdown</div>
                  <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>.md 格式</div>
                </button>

                <button
                  onClick={() => {
                    const content = conversationExportService.exportConversation(activeConv, { format: 'json' });
                    downloadFile(content, `${activeConv.title}.json`, 'application/json');
                    setShowExportModal(false);
                  }}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <FileJson className="h-6 w-6 mb-2" style={{ color: 'var(--t-accent-light)' }} />
                  <div className="font-medium text-sm" style={{ color: 'var(--t-text)' }}>JSON</div>
                  <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>.json 格式</div>
                </button>

                <button
                  onClick={() => {
                    const content = conversationExportService.exportConversation(activeConv, { format: 'txt' });
                    downloadFile(content, `${activeConv.title}.txt`, 'text/plain');
                    setShowExportModal(false);
                  }}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <File className="h-6 w-6 mb-2" style={{ color: 'var(--t-accent-light)' }} />
                  <div className="font-medium text-sm" style={{ color: 'var(--t-text)' }}>纯文本</div>
                  <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>.txt 格式</div>
                </button>

                <button
                  onClick={async () => {
                    const content = conversationExportService.exportConversation(activeConv, { format: 'markdown' });
                    await copyToClipboard(content);
                    setShowExportModal(false);
                  }}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <Copy className="h-6 w-6 mb-2" style={{ color: 'var(--t-accent-light)' }} />
                  <div className="font-medium text-sm" style={{ color: 'var(--t-text)' }}>复制内容</div>
                  <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>到剪贴板</div>
                </button>
              </div>

              {/* Options */}
              <div className="pt-4 border-t" style={{ borderColor: 'var(--t-glass-border)' }}>
                <label className="flex items-center gap-2 text-sm mb-3" style={{ color: 'var(--t-text-secondary)' }}>
                  <input type="checkbox" defaultChecked className="rounded" />
                  包含元数据（模型、时间等）
                </label>
                <label className="flex items-center gap-2 text-sm mb-3" style={{ color: 'var(--t-text-secondary)' }}>
                  <input type="checkbox" defaultChecked className="rounded" />
                  包含时间戳
                </label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--t-text-secondary)' }}>
                  <input type="checkbox" defaultChecked className="rounded" />
                  过滤系统消息
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
