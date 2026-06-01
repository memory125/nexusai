import { useState, useRef, useEffect } from 'react';
import { useStore, modelProviders } from '../store';
import { Send, User, ChevronDown, Paperclip, Mic, StopCircle, Database, ChevronUp, FileText, X, Play, Volume2, Volume1, FileCode, Search, Star, Plus, ThumbsUp, ThumbsDown, Download, Copy, FileJson, File, Zap, Check } from 'lucide-react';
import { ProviderIcon } from './ProviderIcons';
import { RAGService } from '../services/ragService';
import { multimodalService } from '../services/multimodalService';
import { conversationTemplateService, ConversationTemplate, TemplateCategory } from '../services/conversationTemplateService';
import { messageRatingService, Rating } from '../services/messageRatingService';
import { conversationExportService } from '../services/conversationExportService';
import { ttsService } from '../services/ttsService';
import type { Attachment } from '../types/multimodal';
import { formatFileSize } from '../types/multimodal';

// Knowledge base store
import { useKnowledgeBaseStore } from '../stores/knowledgeBaseStore';


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
      <div className="glass-popover rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
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

// Cute mascot - a friendly robot-cat "Nexi" 🐱✨
function Mascot({ size = 24, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={animated ? { animation: 'mascot-breathe 2.4s ease-in-out infinite' } : undefined}
    >
      {/* Cat ears (outer) */}
      <path d="M 14 22 L 10 8 L 22 16 Z" fill="#a78bfa" />
      <path d="M 50 22 L 54 8 L 42 16 Z" fill="#a78bfa" />
      {/* Cat ears (inner) */}
      <path d="M 15 20 L 13.5 12 L 20 16.5 Z" fill="#f0abfc" />
      <path d="M 49 20 L 50.5 12 L 44 16.5 Z" fill="#f0abfc" />
      {/* Head/body — rounded */}
      <ellipse cx="32" cy="38" rx="22" ry="20" fill="url(#mascotBody)" stroke="#7c3aed" strokeWidth="1.5" />
      {/* Cheek blush */}
      <ellipse cx="18" cy="42" rx="3.5" ry="2" fill="#fda4af" opacity="0.7" />
      <ellipse cx="46" cy="42" rx="3.5" ry="2" fill="#fda4af" opacity="0.7" />
      {/* Eyes — sparkly */}
      <ellipse cx="24" cy="36" rx="3" ry="4" fill="#1e1b4b" />
      <ellipse cx="40" cy="36" rx="3" ry="4" fill="#1e1b4b" />
      {/* Eye highlights */}
      <circle cx="25.2" cy="34.5" r="1" fill="white" />
      <circle cx="41.2" cy="34.5" r="1" fill="white" />
      <circle cx="23" cy="37.5" r="0.5" fill="white" />
      <circle cx="39" cy="37.5" r="0.5" fill="white" />
      {/* Smile */}
      <path d="M 28 44 Q 32 47.5 36 44" stroke="#1e1b4b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Tiny tongue */}
      <ellipse cx="32" cy="45.5" rx="1.2" ry="0.8" fill="#f472b6" />
      {/* Antenna */}
      <line x1="32" y1="16" x2="32" y2="11" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="32" cy="9" r="2" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" />
      <circle cx="32" cy="9" r="0.6" fill="white" />
      {/* Tiny whiskers */}
      <line x1="14" y1="40" x2="8" y2="38" stroke="#a78bfa" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="14" y1="44" x2="8" y2="46" stroke="#a78bfa" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="50" y1="40" x2="56" y2="38" stroke="#a78bfa" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="50" y1="44" x2="56" y2="46" stroke="#a78bfa" strokeWidth="0.8" strokeLinecap="round" />
      <defs>
        <radialGradient id="mascotBody" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ddd6fe" />
          <stop offset="100%" stopColor="#a78bfa" />
        </radialGradient>
      </defs>
    </svg>
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

function getPromptsForAgent(agent: any): string[] {
  if (!agent) {
    return [
      '帮我写一篇技术博客',
      '分析这段代码的性能',
      '设计一个产品方案',
      '翻译以下内容为英文',
    ];
  }

  const categoryPrompts: Record<string, string[]> = {
    '创意': [
      '帮我写一篇创意文案',
      '创作一首诗歌',
      '写一个故事情节',
      '设计一个品牌故事',
    ],
    '开发': [
      '帮我写一个函数',
      '分析这段代码的性能',
      '帮我优化这段代码',
      '解释这个错误怎么解决',
    ],
    '分析': [
      '分析这份数据报告',
      '给我一个SWOT分析',
      '预测市场趋势',
      '给出优化建议',
    ],
    '语言': [
      '翻译以下内容为英文',
      '帮我校对这篇文档',
      '用更正式的语气改写',
      '解释这个短语的意思',
    ],
    '产品': [
      '设计一个产品方案',
      '分析用户需求',
      '给出功能优先级建议',
      '设计用户体验流程',
    ],
    '设计': [
      '给一个UI设计建议',
      '推荐配色方案',
      '设计一个Logo',
      '给出布局建议',
    ],
    '金融': [
      '分析这只股票',
      '给出投资建议',
      '解释这个财务指标',
      '评估投资风险',
    ],
    '营销': [
      '制定营销策略',
      '写一个广告文案',
      '分析竞品推广',
      '制定社交媒体计划',
    ],
    '教育': [
      '解释这个概念',
      '出一道练习题',
      '制定学习计划',
      '总结这个知识点',
    ],
    '健康': [
      '给出健康建议',
      '设计健身计划',
      '分析饮食结构',
      '提供心理健康咨询',
    ],
    '法律': [
      '解释这个法律条款',
      '给出法律建议',
      '审查这份合同',
      '说明法律风险',
    ],
    '生活': [
      '给我一些生活建议',
      '推荐一道家常菜',
      '规划一次旅行行程',
      '宠物养护需要注意什么',
    ],
    '学术': [
      '帮我检查论文格式',
      '解释这个数学公式',
      '给出一道物理题详解',
      '帮我优化论文结构',
    ],
    '职场': [
      '模拟一次面试',
      '帮我写一份简历',
      '写一封商务邮件',
      '整理会议纪要',
    ],
    'IT运维': [
      '排查这个系统问题',
      '设计网络架构方案',
      '优化数据库查询',
      '解释这个运维概念',
    ],
    '电商': [
      '分析店铺数据',
      '优化产品 listing',
      '制定广告投放策略',
      '写一段产品描述',
    ],
    '艺术': [
      '创作一段歌词',
      '给我视频剪辑建议',
      '摄影构图技巧',
      '播客内容策划',
    ],
    '金融科技': [
      '分析这个加密货币',
      '评估投资风险',
      '解释这个量化策略',
      '数据建模建议',
    ],
    '餐饮': [
      '推荐一款咖啡配方',
      '调制一杯鸡尾酒',
      '餐厅运营建议',
      '菜单设计',
    ],
    '房产': [
      '分析这个楼盘',
      '给出购房建议',
      '室内设计风格推荐',
      '装修材料选择',
    ],
    '汽车': [
      '推荐适合的车型',
      '分析车辆故障',
      '购车预算建议',
      '保养知识科普',
    ],
    '建筑': [
      '设计一个建筑方案',
      '解释工程术语',
      '土木工程咨询',
      '给出结构建议',
    ],
    '媒体': [
      '写一篇新闻稿',
      '公关危机处理建议',
      '媒体关系维护',
      '内容策划方案',
    ],
  };

  return categoryPrompts[agent.category] || [
    '你好，请帮我',
    '给我一些建议',
    '回答我的问题',
    '帮我分析一下',
  ];
}

export function ChatPage() {
  const {
    conversations, activeConversationId, addMessage,
    createConversation, selectedProvider, selectedModel,
    setSelectedProvider, setSelectedModel, isGenerating, stopGeneration,
    activeAgent, setActiveAgent, agents, skills, activeSkillIds, toggleActiveSkill,
  } = useStore();

  // Knowledge base store - with defaults
  const kb = useKnowledgeBaseStore();
  const getSelectedKnowledgeBases = kb.getSelectedKnowledgeBases || (() => []);
  const getSelectedChunks = kb.getSelectedChunks || (() => []);
  const embeddingConfig = kb.embeddingConfig || { model: 'ollama-nomic-embed-text', baseUrl: 'http://localhost:11434', ollamaModel: 'nomic-embed-text' };

  const [input, setInput] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<string>('全部');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const selectedKBs = typeof getSelectedKnowledgeBases === 'function' ? getSelectedKnowledgeBases() : [];
  const selectedChunks = typeof getSelectedChunks === 'function' ? getSelectedChunks() : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  useEffect(() => {
    const checkPending = () => {
      const pending = (window as any).__nexusai_pendingInput;
      if (pending) {
        setInput(pending);
        (window as any).__nexusai_pendingInput = null;
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    checkPending();
    const interval = setInterval(checkPending, 300);
    return () => clearInterval(interval);
  }, []);

  

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
    if (!convId && activeAgent?.id) {
      convId = createConversation(activeAgent.id);
    } else if (!convId) {
      convId = createConversation();
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
    
    const targetConvId = convId || activeConversationId;
    if (!targetConvId) {
      // Create a new conversation first
      const newId = createConversation();
      addMessage(newId, { 
        role: 'user', 
        content, 
        attachments: attachments.length > 0 ? attachments : undefined,
        ragSources: ragSources || undefined, 
        ragStats: ragStats || undefined 
      });
    } else {
      addMessage(targetConvId, { 
        role: 'user', 
        content, 
        attachments: attachments.length > 0 ? attachments : undefined,
        ragSources: ragSources || undefined, 
        ragStats: ragStats || undefined 
      });
    }
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

  // Safe access to modelProviders
  const providers = modelProviders || [];
  const currentProvider = providers.find(p => p.id === selectedProvider);
  const currentModel = currentProvider?.models?.find(m => m.id === selectedModel);
  
  // If selectedModel is not in the list (custom model), create a placeholder
  const displayModel = currentModel || { 
    id: selectedModel, 
    name: selectedModel, 
    description: '自定义模型', 
    contextWindow: '-', 
    pricing: '-' 
  };

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
                <Mascot size={64} />
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
                  <p className="text-xs font-medium" style={{ color: 'var(--t-text)' }}>{displayModel?.name || selectedModel}</p>
                  <p className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>{currentProvider?.name || selectedProvider}</p>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} style={{ color: 'var(--t-text-muted)' }} />
              </button>

              {showModelPicker && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 glass-popover rounded-xl p-2 w-80 z-50 max-h-80 overflow-y-auto animate-fade-in">
                  {providers.map(provider => (
                    <div key={provider.id} className="mb-1">
                      <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                        <ProviderIcon id={provider.id} size={16} />
                        <span>{provider.name}</span>
                      </div>
                      {(provider.models || []).map(model => (
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
                  {/* Custom model option */}
                  <div className="mb-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                      <Plus className="h-4 w-4" />
                      <span>自定义</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowModelPicker(false);
                        // Navigate to models page
                      }}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all"
                      style={{
                        background: 'transparent',
                        color: 'var(--t-text-secondary)',
                      }}
                    >
                      <div className="flex-1">
                        <p className="text-xs font-medium">{selectedModel}</p>
                        <p className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>当前使用</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {(activeAgent?.prompts || getPromptsForAgent(activeAgent)).map((prompt, i) => (
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
    const activeSkills = skills.filter(s => activeSkillIds.includes(s.id));
    const skillCategories = ['全部', ...Array.from(new Set(skills.map(s => s.category)))];
    const filteredSkills = skillCategoryFilter === '全部'
      ? skills
      : skills.filter(s => s.category === skillCategoryFilter);

    return (
      <div className="p-4 pt-2">
        {/* Active Agent + Skills Chips */}
        {(activeAgent || activeSkills.length > 0) && (
          <div className="max-w-3xl mx-auto mb-2 flex flex-wrap items-center gap-1.5 px-1">
            {activeAgent && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
                style={{ background: `${activeAgent.color}22`, color: activeAgent.color, border: `1px solid ${activeAgent.color}55` }}
                title={activeAgent.description}
              >
                <span>{activeAgent.icon}</span>
                <span>Agent · {activeAgent.name}</span>
                <button
                  onClick={() => setActiveAgent(null)}
                  className="ml-0.5 hover:opacity-70"
                  title="移除Agent"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {activeSkills.map(s => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
                style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent-text)', border: '1px solid var(--t-accent-border)' }}
                title={s.description}
              >
                <span>{s.icon}</span>
                <span>{s.name}</span>
                <button
                  onClick={() => toggleActiveSkill(s.id)}
                  className="ml-0.5 hover:opacity-70"
                  title="关闭技能"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="glass-strong rounded-2xl p-2 max-w-3xl mx-auto">
          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--t-popover-bg)', color: 'var(--t-text)', border: '1px solid var(--t-glass-border)' }}
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
            {/* Agent Selector */}
            <div className="relative">
              <button
                onClick={() => { setShowAgentPicker(!showAgentPicker); setShowSkillPicker(false); }}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all mb-0.5 ${activeAgent ? 'text-amber-400 bg-amber-500/10' : ''}`}
                style={activeAgent ? {} : { color: 'var(--t-text-muted)' }}
                title={activeAgent ? `当前 Agent: ${activeAgent.name}` : '选择 Agent'}
              >
                {activeAgent ? <span className="text-base">{activeAgent.icon}</span> : <Mascot size={20} animated />}
              </button>
              {showAgentPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAgentPicker(false)} />
                  <div className="absolute bottom-full left-0 mb-2 glass-popover rounded-xl p-2 w-72 z-50 max-h-96 overflow-y-auto animate-fade-in">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                      <Mascot size={14} />
                      <span>选择 Agent</span>
                    </div>
                    <button
                      onClick={() => { setActiveAgent(null); setShowAgentPicker(false); }}
                      className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-all ${!activeAgent ? 'bg-white/10' : ''}`}
                      style={{ color: 'var(--t-text-secondary)' }}
                    >
                      <span>—</span>
                      <span>不使用 Agent</span>
                      {!activeAgent && <Check className="h-3 w-3 ml-auto" style={{ color: 'var(--t-accent-light)' }} />}
                    </button>
                    <div className="border-t my-1" style={{ borderColor: 'var(--t-glass-border)' }} />
                    {Object.entries(
                      agents.reduce<Record<string, typeof agents>>((acc, a) => {
                        (acc[a.category] = acc[a.category] || []).push(a);
                        return acc;
                      }, {})
                    ).map(([cat, list]) => (
                      <div key={cat} className="mb-1">
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                          {cat}
                        </div>
                        {list.map(a => (
                          <button
                            key={a.id}
                            onClick={() => { setActiveAgent(a); setShowAgentPicker(false); }}
                            className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-all"
                            style={{
                              background: activeAgent?.id === a.id ? 'var(--t-accent-subtle)' : 'transparent',
                              color: activeAgent?.id === a.id ? 'var(--t-text)' : 'var(--t-text-secondary)',
                            }}
                          >
                            <span className="text-base shrink-0">{a.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{a.name}</p>
                              <p className="text-[10px] truncate" style={{ color: 'var(--t-text-muted)' }}>{a.description}</p>
                            </div>
                            {activeAgent?.id === a.id && <Check className="h-3 w-3 shrink-0" style={{ color: 'var(--t-accent-light)' }} />}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Skills Selector */}
            <div className="relative">
              <button
                onClick={() => { setShowSkillPicker(!showSkillPicker); setShowAgentPicker(false); }}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all mb-0.5 relative ${activeSkillIds.length > 0 ? 'text-amber-400 bg-amber-500/10' : ''}`}
                style={activeSkillIds.length > 0 ? {} : { color: 'var(--t-text-muted)' }}
                title={activeSkillIds.length > 0 ? `已启用 ${activeSkillIds.length} 个技能` : '启用技能'}
              >
                <Zap className="h-4 w-4" />
                {activeSkillIds.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center bg-amber-500 text-white">
                    {activeSkillIds.length}
                  </span>
                )}
              </button>
              {showSkillPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSkillPicker(false)} />
                  <div className="absolute bottom-full left-0 mb-2 glass-popover rounded-xl p-2 w-80 z-50 max-h-96 overflow-hidden flex flex-col animate-fade-in">
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                        <Zap className="h-3 w-3" />
                        <span>启用技能 ({activeSkillIds.length})</span>
                      </div>
                      {activeSkillIds.length > 0 && (
                        <button
                          onClick={() => { skills.forEach(s => { if (activeSkillIds.includes(s.id)) toggleActiveSkill(s.id); }); }}
                          className="text-[10px] hover:underline"
                          style={{ color: 'var(--t-text-muted)' }}
                        >
                          清空
                        </button>
                      )}
                    </div>
                    {/* Category tabs */}
                    <div className="flex gap-1 px-1 pb-1 overflow-x-auto" style={{ borderBottom: '1px solid var(--t-glass-border)' }}>
                      {skillCategories.map(c => (
                        <button
                          key={c}
                          onClick={() => setSkillCategoryFilter(c)}
                          className={`shrink-0 px-2 py-0.5 text-[10px] rounded transition-colors ${skillCategoryFilter === c ? 'font-semibold' : ''}`}
                          style={{
                            background: skillCategoryFilter === c ? 'var(--t-accent-subtle)' : 'transparent',
                            color: skillCategoryFilter === c ? 'var(--t-accent-text)' : 'var(--t-text-muted)',
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 overflow-y-auto mt-1">
                      {filteredSkills.map(s => {
                        const isOn = activeSkillIds.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleActiveSkill(s.id)}
                            className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-all"
                            style={{
                              background: isOn ? 'var(--t-accent-subtle)' : 'transparent',
                              color: isOn ? 'var(--t-text)' : 'var(--t-text-secondary)',
                            }}
                          >
                            <span className="text-base shrink-0">{s.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{s.name}</p>
                              <p className="text-[10px] truncate" style={{ color: 'var(--t-text-muted)' }}>{s.description}</p>
                            </div>
                            <div
                              className={`h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors`}
                              style={{
                                background: isOn ? 'var(--t-accent)' : 'transparent',
                                borderColor: isOn ? 'var(--t-accent)' : 'var(--t-glass-border)',
                              }}
                            >
                              {isOn && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Template Button */}
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all mb-0.5"
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all mb-0.5"
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
              <button
                onClick={() => stopGeneration()}
                className="glass-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-400 mb-0.5 hover:bg-red-500/20 transition-colors"
                title="停止生成"
              >
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
                  title={selectedKBs.map((kb: any) => kb.name).join(', ')}
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
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-1 overflow-hidden"
                  style={{
                    background: 'var(--t-accent-subtle)',
                    border: '1px solid var(--t-accent-border)',
                  }}
                >
                  {activeAgent ? <span className="text-sm">{activeAgent.icon}</span> : <Mascot size={28} animated />}
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
                    {msg.content.trim() === '' && isGenerating && msg === activeConv.messages[activeConv.messages.length - 1] ? (
                      <div className="typing-dots py-1">
                        <span /><span /><span />
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{renderContent(msg.content)}</div>
                    )}
                    {/* Display RAG sources for assistant messages */}
                    {msg.ragSources && msg.ragSources.length > 0 && (
                      <RAGSources sources={msg.ragSources} stats={msg.ragStats} />
                    )}
                    {/* Display skill execution results */}
                    {msg.skillResults && msg.skillResults.length > 0 && (
                      <SkillResults results={msg.skillResults} />
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
          <div className="glass-popover rounded-2xl p-6 max-w-lg w-full mx-4">
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
          <div className="glass-popover rounded-2xl p-6 max-w-md w-full mx-4">
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

function SkillResults({ results }: { results: Array<{ skillId: string; status: string; contextBlock?: string; error?: string; durationMs: number; attachments?: Array<{ type: string; url?: string; name: string }> }> }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!results || results.length === 0) return null;

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  const totalMs = results.reduce((sum, r) => sum + (r.durationMs || 0), 0);
  const imageAtts = results.flatMap(r => (r.attachments || []).filter(a => a.type === 'image' && a.url));

  const skillLabels: Record<string, { name: string; icon: string }> = {
    'web-search': { name: '网络搜索', icon: '🔍' },
    'web-fetch': { name: '网页抓取', icon: '🌐' },
    'image-generation': { name: '图片生成', icon: '🎨' },
    'calculator': { name: '计算', icon: '🧮' },
    'datetime': { name: '时间', icon: '⏰' },
    'dictionary': { name: '词典', icon: '📖' },
    'wikipedia': { name: '维基百科', icon: '📚' },
    'weather': { name: '天气', icon: '☁️' },
    'currency-converter': { name: '汇率', icon: '💱' },
    'code-search': { name: 'GitHub', icon: '💻' },
    'academic-search': { name: 'arXiv', icon: '🎓' },
    'news-aggregator': { name: '新闻', icon: '📰' },
  };

  return (
    <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--t-glass-border)' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-medium w-full hover:opacity-80 transition-opacity"
        style={{ color: 'var(--t-accent-light)' }}
      >
        <Zap className="h-3.5 w-3.5" />
        <span>技能执行 ({successCount} 成功{errorCount > 0 ? ` · ${errorCount} 失败` : ''}{skippedCount > 0 ? ` · ${skippedCount} 跳过` : ''} · {totalMs}ms)</span>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 ml-auto" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 ml-auto" />
        )}
      </button>

      {!isExpanded && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {results.map((r, i) => {
            const label = skillLabels[r.skillId] || { name: r.skillId, icon: '⚡' };
            const dotColor = r.status === 'success' ? '#22c55e' : r.status === 'error' ? '#ef4444' : '#9ca3af';
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent)' }}
                title={r.status === 'error' ? r.error : r.contextBlock?.slice(0, 100)}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                {label.icon} {label.name}
              </span>
            );
          })}
        </div>
      )}

      {isExpanded && (
        <div className="space-y-2 mt-2">
          {imageAtts.map((img, i) => (
            <div key={i} className="glass-card rounded-lg p-2">
              <img src={img.url} alt={img.name} className="w-full rounded" />
            </div>
          ))}
          {results.map((r, i) => {
            const label = skillLabels[r.skillId] || { name: r.skillId, icon: '⚡' };
            const dotColor = r.status === 'success' ? '#22c55e' : r.status === 'error' ? '#ef4444' : '#9ca3af';
            return (
              <div key={i} className="glass-card rounded-lg p-2" style={{ borderLeft: `3px solid ${dotColor}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{label.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>{label.name}</span>
                  <span className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
                    {r.status === 'success' ? '✓ 成功' : r.status === 'error' ? '✗ 失败' : '○ 跳过'} · {r.durationMs}ms
                  </span>
                </div>
                {r.error && (
                  <p className="text-[11px] text-red-400">{r.error}</p>
                )}
                {r.contextBlock && (
                  <pre className="text-[11px] whitespace-pre-wrap font-mono mt-1 max-h-40 overflow-y-auto" style={{ color: 'var(--t-text-secondary)' }}>
                    {r.contextBlock}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
