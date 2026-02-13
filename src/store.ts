import { create } from 'zustand';
import type { Attachment } from './types/multimodal';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  createdAt: string;
}

export interface RAGSource {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  similarity: number;
}

export interface RAGPerformanceStats {
  retrievalTime: number;
  embeddingTime: number;
  totalTime: number;
  chunksSearched: number;
  chunksRetrieved: number;
  tokensUsed: number;
  timestamp: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  model?: string;
  ragSources?: RAGSource[];
  ragStats?: RAGPerformanceStats;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  provider: string;
  agentId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  skills: string[];
  category: string;
  color: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  enabled: boolean;
}

export interface ModelProvider {
  id: string;
  name: string;
  logo: string;
  models: ModelOption[];
  color: string;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  contextWindow: string;
  pricing: string;
}

export type Page = 'chat' | 'agents' | 'skills' | 'models' | 'project' | 'knowledge' | 'mcp' | 'plugins' | 'settings';

export type ThemeId = 'midnight' | 'aurora' | 'sunset' | 'ocean' | 'forest' | 'rose' | 'cyberpunk' | 'light' | 'light-lavender' | 'light-peach' | 'light-mint' | 'light-sky' | 'light-sand';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  preview: {
    bg1: string;
    bg2: string;
    bg3: string;
    accent: string;
  };
}

export const themeConfigs: ThemeConfig[] = [
  {
    id: 'midnight',
    name: '午夜星空',
    description: '深邃紫蓝色调，经典暗夜风格',
    preview: { bg1: '#0f0a1a', bg2: '#1a1030', bg3: '#6366f1', accent: '#818cf8' },
  },
  {
    id: 'aurora',
    name: '极光幻境',
    description: '北极光般的青绿渐变色彩',
    preview: { bg1: '#0a1a1a', bg2: '#0d2b2b', bg3: '#06b6d4', accent: '#22d3ee' },
  },
  {
    id: 'sunset',
    name: '日落余晖',
    description: '温暖的橙红色夕阳色调',
    preview: { bg1: '#1a0f0a', bg2: '#2d1810', bg3: '#f97316', accent: '#fb923c' },
  },
  {
    id: 'ocean',
    name: '深海幽蓝',
    description: '宁静深邃的海洋蓝色系',
    preview: { bg1: '#0a0f1a', bg2: '#0d1b33', bg3: '#3b82f6', accent: '#60a5fa' },
  },
  {
    id: 'forest',
    name: '翡翠森林',
    description: '清新自然的森林绿色调',
    preview: { bg1: '#0a1a0f', bg2: '#102d15', bg3: '#22c55e', accent: '#4ade80' },
  },
  {
    id: 'rose',
    name: '玫瑰金粉',
    description: '优雅浪漫的玫瑰粉色系',
    preview: { bg1: '#1a0a14', bg2: '#2d1024', bg3: '#ec4899', accent: '#f472b6' },
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    description: '霓虹灯光的未来科幻风',
    preview: { bg1: '#0a0a1a', bg2: '#15052d', bg3: '#a855f7', accent: '#e879f9' },
  },
  {
    id: 'light',
    name: '清晨白昼',
    description: '明亮柔和的经典浅色风格',
    preview: { bg1: '#f0f2f5', bg2: '#e2e5ea', bg3: '#6366f1', accent: '#4f46e5' },
  },
  {
    id: 'light-lavender',
    name: '薰衣草田',
    description: '梦幻柔紫色浪漫色调',
    preview: { bg1: '#f5f0ff', bg2: '#ede4ff', bg3: '#8b5cf6', accent: '#7c3aed' },
  },
  {
    id: 'light-peach',
    name: '蜜桃暖阳',
    description: '温暖蜜桃橙粉色系',
    preview: { bg1: '#fff5f0', bg2: '#ffe8dd', bg3: '#f97316', accent: '#ea580c' },
  },
  {
    id: 'light-mint',
    name: '薄荷清风',
    description: '清凉薄荷绿清新色调',
    preview: { bg1: '#f0fdf4', bg2: '#dcfce7', bg3: '#10b981', accent: '#059669' },
  },
  {
    id: 'light-sky',
    name: '晴空万里',
    description: '天空蓝纯净通透色系',
    preview: { bg1: '#f0f7ff', bg2: '#dbeafe', bg3: '#3b82f6', accent: '#2563eb' },
  },
  {
    id: 'light-sand',
    name: '沙漠暮色',
    description: '温润沙金色暖调风格',
    preview: { bg1: '#fefce8', bg2: '#fef3c7', bg3: '#d97706', accent: '#b45309' },
  },
];

interface AppState {
  // Auth
  user: User | null;
  isLoggedIn: boolean;
  authMode: 'login' | 'register';
  login: (email: string, password: string) => boolean;
  register: (username: string, email: string, password: string) => boolean;
  logout: () => void;
  setAuthMode: (mode: 'login' | 'register') => void;

  // Navigation
  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  createConversation: (agentId?: string) => string;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;

  // Models
  selectedProvider: string;
  selectedModel: string;
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;
  apiKeys: Record<string, string>;
  setApiKey: (provider: string, key: string) => void;

  // Ollama
  ollamaEndpoint: string;
  setOllamaEndpoint: (url: string) => void;
  ollamaStatus: 'idle' | 'connecting' | 'connected' | 'error';
  setOllamaStatus: (s: 'idle' | 'connecting' | 'connected' | 'error') => void;
  ollamaCustomModel: string;
  setOllamaCustomModel: (m: string) => void;

  // vLLM
  vllmEndpoint: string;
  setVllmEndpoint: (url: string) => void;
  vllmStatus: 'idle' | 'connecting' | 'connected' | 'error';
  setVllmStatus: (s: 'idle' | 'connecting' | 'connected' | 'error') => void;
  vllmCustomModel: string;
  setVllmCustomModel: (m: string) => void;

  // Agents
  agents: Agent[];
  activeAgent: Agent | null;
  setActiveAgent: (agent: Agent | null) => void;

  // Skills
  skills: Skill[];
  toggleSkill: (skillId: string) => void;

  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;

  // Theme
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const defaultAgents: Agent[] = [
  {
    id: 'creative-writer',
    name: '创意写作助手',
    description: '擅长创意写作、故事创作、文案撰写和内容策划',
    icon: '✍️',
    systemPrompt: '你是一个专业的创意写作助手...',
    skills: ['writing', 'brainstorm'],
    category: '创作',
    color: '#f59e0b',
  },
  {
    id: 'code-expert',
    name: '代码专家',
    description: '全栈开发专家，精通多种编程语言和框架',
    icon: '💻',
    systemPrompt: '你是一个资深的全栈开发专家...',
    skills: ['coding', 'debugging', 'architecture'],
    category: '开发',
    color: '#6366f1',
  },
  {
    id: 'data-analyst',
    name: '数据分析师',
    description: '专注于数据分析、可视化和洞察提取',
    icon: '📊',
    systemPrompt: '你是一个专业的数据分析师...',
    skills: ['data-analysis', 'visualization'],
    category: '分析',
    color: '#22c55e',
  },
  {
    id: 'translator',
    name: '多语言翻译官',
    description: '精通多国语言翻译，保持语境和文化适配',
    icon: '🌐',
    systemPrompt: '你是一个专业的多语言翻译专家...',
    skills: ['translation', 'writing'],
    category: '语言',
    color: '#3b82f6',
  },
  {
    id: 'product-manager',
    name: '产品经理顾问',
    description: '帮助进行产品规划、需求分析和用户研究',
    icon: '🎯',
    systemPrompt: '你是一个资深的产品经理...',
    skills: ['brainstorm', 'writing', 'data-analysis'],
    category: '产品',
    color: '#ec4899',
  },
  {
    id: 'legal-advisor',
    name: '法律顾问',
    description: '提供法律咨询、合同审核和风险评估',
    icon: '⚖️',
    systemPrompt: '你是一个专业的法律顾问...',
    skills: ['writing', 'research'],
    category: '法务',
    color: '#8b5cf6',
  },
  {
    id: 'designer',
    name: 'UI/UX 设计师',
    description: '提供界面设计建议、用户体验优化方案',
    icon: '🎨',
    systemPrompt: '你是一个资深的UI/UX设计师...',
    skills: ['brainstorm', 'writing'],
    category: '设计',
    color: '#f43f5e',
  },
  {
    id: 'researcher',
    name: '学术研究助手',
    description: '辅助学术研究、论文撰写和文献综述',
    icon: '🔬',
    systemPrompt: '你是一个学术研究助手...',
    skills: ['research', 'writing', 'data-analysis'],
    category: '学术',
    color: '#14b8a6',
  },
];

const defaultSkills: Skill[] = [
  { id: 'web-search', name: '网络搜索', description: '实时搜索互联网获取最新信息', icon: '🔍', category: '信息获取', enabled: true },
  { id: 'coding', name: '代码生成', description: '生成、调试和优化各种编程语言代码', icon: '⌨️', category: '开发工具', enabled: true },
  { id: 'image-gen', name: '图像生成', description: '根据文字描述生成高质量图像', icon: '🖼️', category: '多模态', enabled: false },
  { id: 'data-analysis', name: '数据分析', description: '分析数据集、生成统计报告和可视化', icon: '📈', category: '分析工具', enabled: true },
  { id: 'file-reading', name: '文件解析', description: '解析和提取PDF、Word、Excel等文档内容', icon: '📄', category: '信息获取', enabled: true },
  { id: 'translation', name: '翻译引擎', description: '高质量多语言翻译，支持100+语言', icon: '🗣️', category: '语言工具', enabled: false },
  { id: 'writing', name: '文案撰写', description: '专业文案撰写和内容创作', icon: '📝', category: '创作工具', enabled: true },
  { id: 'brainstorm', name: '头脑风暴', description: '创意思维发散和方案策划', icon: '💡', category: '创作工具', enabled: false },
  { id: 'debugging', name: '代码调试', description: '智能诊断和修复代码bug', icon: '🐛', category: '开发工具', enabled: true },
  { id: 'architecture', name: '架构设计', description: '系统架构设计和技术选型建议', icon: '🏗️', category: '开发工具', enabled: false },
  { id: 'visualization', name: '数据可视化', description: '生成图表和数据仪表盘', icon: '📊', category: '分析工具', enabled: false },
  { id: 'research', name: '深度研究', description: '多轮深度调研和报告生成', icon: '🔎', category: '信息获取', enabled: true },
];

const registeredUsers: Array<{ username: string; email: string; password: string }> = [
  { username: 'demo', email: 'demo@nexusai.com', password: 'demo123' },
];

const simulatedResponses: Record<string, string[]> = {
  default: [
    '你好！我是 NexusAI 智能助手，很高兴为你服务。有什么我可以帮助你的吗？',
    '这是一个很好的问题！让我来详细分析一下...\n\n首先，我们需要考虑几个关键因素：\n\n1. **背景分析** - 了解问题的核心本质\n2. **方案设计** - 制定可行的解决路径\n3. **实施建议** - 提供具体的操作步骤\n\n希望这个思路对你有帮助，需要更深入的分析吗？',
    '我理解你的需求。让我为你提供一些专业的建议：\n\n> 成功的关键在于系统性思考和持续迭代\n\n基于我的分析，这里有几个值得关注的方向：\n\n- 🎯 明确目标和预期成果\n- 📋 制定详细的执行计划\n- 🔄 建立反馈和优化机制\n- 📊 用数据驱动决策\n\n你想从哪个方面开始深入探讨？',
    '非常好的思路！让我进一步展开...\n\n```\n// 示例代码框架\nfunction solution(problem) {\n  const analysis = analyze(problem);\n  const plan = design(analysis);\n  return execute(plan);\n}\n```\n\n在实际应用中，我们需要注意以下要点：\n\n1. **可扩展性** - 确保方案能够随需求增长\n2. **可维护性** - 代码/流程清晰易懂\n3. **性能优化** - 在关键路径上追求效率\n\n需要我提供更具体的实现方案吗？',
  ],
};

export const useStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  isLoggedIn: false,
  authMode: 'login',
  login: (email, password) => {
    const found = registeredUsers.find(u => u.email === email && u.password === password);
    if (found) {
      set({
        user: {
          id: Math.random().toString(36).slice(2),
          username: found.username,
          email: found.email,
          avatar: found.username.charAt(0).toUpperCase(),
          createdAt: new Date().toISOString(),
        },
        isLoggedIn: true,
      });
      return true;
    }
    return false;
  },
  register: (username, email, password) => {
    const exists = registeredUsers.find(u => u.email === email);
    if (exists) return false;
    registeredUsers.push({ username, email, password });
    set({
      user: {
        id: Math.random().toString(36).slice(2),
        username,
        email,
        avatar: username.charAt(0).toUpperCase(),
        createdAt: new Date().toISOString(),
      },
      isLoggedIn: true,
    });
    return true;
  },
  logout: () => set({ user: null, isLoggedIn: false }),
  setAuthMode: (mode) => set({ authMode: mode }),

  // Navigation
  currentPage: 'chat',
  setCurrentPage: (page) => set({ currentPage: page }),

  // Conversations
  conversations: [],
  activeConversationId: null,
  createConversation: (agentId) => {
    const id = Math.random().toString(36).slice(2, 10);
    const { selectedModel, selectedProvider, agents } = get();
    const agent = agentId ? agents.find(a => a.id === agentId) : null;
    const conv: Conversation = {
      id,
      title: agent ? `与 ${agent.name} 的对话` : '新对话',
      messages: [],
      model: selectedModel,
      provider: selectedProvider,
      agentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set(s => ({
      conversations: [conv, ...s.conversations],
      activeConversationId: id,
      activeAgent: agent || null,
      currentPage: 'chat',
    }));
    return id;
  },
  setActiveConversation: (id) => {
    const conv = get().conversations.find(c => c.id === id);
    const agent = conv?.agentId ? get().agents.find(a => a.id === conv.agentId) || null : null;
    set({ activeConversationId: id, activeAgent: agent, currentPage: 'chat' });
  },
  deleteConversation: (id) => set(s => {
    const convs = s.conversations.filter(c => c.id !== id);
    return {
      conversations: convs,
      activeConversationId: s.activeConversationId === id ? (convs[0]?.id || null) : s.activeConversationId,
    };
  }),
  addMessage: (conversationId, message) => {
    const id = Math.random().toString(36).slice(2, 10);
    const fullMessage: Message = { ...message, id, timestamp: Date.now() };
    set(s => ({
      conversations: s.conversations.map(c =>
        c.id === conversationId
          ? {
              ...c,
              messages: [...c.messages, fullMessage],
              title: c.messages.length === 0 && message.role === 'user'
                ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
                : c.title,
              updatedAt: Date.now(),
            }
          : c
      ),
    }));

    // Simulate AI response
    if (message.role === 'user') {
      set({ isGenerating: true });
      setTimeout(() => {
        const responses = simulatedResponses.default;
        const resp = responses[Math.floor(Math.random() * responses.length)];
        const { selectedModel } = get();
        const aiId = Math.random().toString(36).slice(2, 10);
        const aiMessage: Message = {
          id: aiId,
          role: 'assistant',
          content: resp,
          timestamp: Date.now(),
          model: selectedModel,
        };
        set(s => ({
          conversations: s.conversations.map(c =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, aiMessage], updatedAt: Date.now() }
              : c
          ),
          isGenerating: false,
        }));
      }, 1200 + Math.random() * 1500);
    }
  },

  // Models
  selectedProvider: 'openai',
  selectedModel: 'gpt-4o',
  setSelectedProvider: (provider) => set({ selectedProvider: provider }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  apiKeys: {},
  setApiKey: (provider, key) => set(s => ({ apiKeys: { ...s.apiKeys, [provider]: key } })),

  // Ollama
  ollamaEndpoint: 'http://localhost:11434',
  setOllamaEndpoint: (url) => set({ ollamaEndpoint: url, ollamaStatus: 'idle' }),
  ollamaStatus: 'idle',
  setOllamaStatus: (s) => set({ ollamaStatus: s }),
  ollamaCustomModel: '',
  setOllamaCustomModel: (m) => set({ ollamaCustomModel: m }),

  // vLLM
  vllmEndpoint: 'http://localhost:8000',
  setVllmEndpoint: (url) => set({ vllmEndpoint: url, vllmStatus: 'idle' }),
  vllmStatus: 'idle',
  setVllmStatus: (s) => set({ vllmStatus: s }),
  vllmCustomModel: '',
  setVllmCustomModel: (m) => set({ vllmCustomModel: m }),

  // Agents
  agents: defaultAgents,
  activeAgent: null,
  setActiveAgent: (agent) => set({ activeAgent: agent }),

  // Skills
  skills: defaultSkills,
  toggleSkill: (skillId) => set(s => ({
    skills: s.skills.map(sk => sk.id === skillId ? { ...sk, enabled: !sk.enabled } : sk),
  })),

  // UI
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),

  // Theme
  theme: 'midnight',
  setTheme: (theme) => set({ theme }),
}));

export const modelProviders: ModelProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '',
    color: '#10a37f',
    models: [
      { id: 'gpt-4.1', name: 'GPT-4.1', description: '最新旗舰模型，全面超越GPT-4o', contextWindow: '1M', pricing: '$2/M tokens' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: '高性价比，适合大规模使用', contextWindow: '1M', pricing: '$0.4/M tokens' },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', description: '极致轻量，超快响应', contextWindow: '1M', pricing: '$0.1/M tokens' },
      { id: 'o3', name: 'o3', description: '最强推理模型，超越人类专家', contextWindow: '200K', pricing: '$10/M tokens' },
      { id: 'o3-mini', name: 'o3-mini', description: '轻量推理，高性价比', contextWindow: '200K', pricing: '$1.1/M tokens' },
      { id: 'o4-mini', name: 'o4-mini', description: '最新一代推理模型', contextWindow: '200K', pricing: '$1.1/M tokens' },
      { id: 'gpt-4o', name: 'GPT-4o', description: '多模态旗舰，视觉+语音+文本', contextWindow: '128K', pricing: '$2.5/M tokens' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '多模态高性价比选择', contextWindow: '128K', pricing: '$0.15/M tokens' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    logo: '',
    color: '#D97757',
    models: [
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', description: '最新旗舰，混合推理模型，1M上下文', contextWindow: '1M', pricing: '$5/M input, $25/M output' },
      { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', description: '顶级编程与Agent能力', contextWindow: '200K', pricing: '$5/M input, $25/M output' },
      { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', description: '平衡性能与成本的最新选择', contextWindow: '200K', pricing: '$3/M input, $15/M output' },
      { id: 'claude-4-opus', name: 'Claude 4 Opus', description: '最强旗舰，深度推理与创作', contextWindow: '200K', pricing: '$15/M tokens' },
      { id: 'claude-4-sonnet', name: 'Claude 4 Sonnet', description: '平衡性能与成本的首选', contextWindow: '200K', pricing: '$3/M tokens' },
      { id: 'claude-3.5-haiku', name: 'Claude 3.5 Haiku', description: '极速响应，适合实时场景', contextWindow: '200K', pricing: '$0.25/M tokens' },
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: '经典版本，稳定可靠', contextWindow: '200K', pricing: '$3/M tokens' },
    ],
  },
  {
    id: 'google',
    name: 'Google',
    logo: '',
    color: '#4285f4',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: '思考型旗舰，原生多模态，GA稳定版', contextWindow: '1M', pricing: '$1.25/M input, $10/M output' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: '极速思考，性价比之王', contextWindow: '1M', pricing: '$0.15/M input, $0.60/M output' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', description: '超轻量版，最快响应', contextWindow: '1M', pricing: '$0.10/M tokens' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '下一代快速推理', contextWindow: '1M', pricing: '$0.10/M tokens' },
      { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', description: '2.0系列专业版', contextWindow: '2M', pricing: '$1.25/M tokens' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '百万上下文，长文档处理', contextWindow: '2M', pricing: '$1.25/M tokens' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: '长上下文快速版', contextWindow: '1M', pricing: '$0.075/M tokens' },
    ],
  },
  {
    id: 'qwen',
    name: '通义千问',
    logo: '',
    color: '#7c3aed',
    models: [
      { id: 'qwen3-max', name: 'Qwen3-Max', description: '最新旗舰，超1万亿参数，262K上下文', contextWindow: '262K', pricing: '$1.20/M input, $6/M output' },
      { id: 'qwen3-235b-a22b', name: 'Qwen3-235B-A22B', description: 'MoE旗舰，2350亿参数', contextWindow: '128K', pricing: '¥0.004/千tokens' },
      { id: 'qwen3-32b', name: 'Qwen3-32B', description: '320亿稠密模型，高性能', contextWindow: '128K', pricing: '¥0.002/千tokens' },
      { id: 'qwen3-14b', name: 'Qwen3-14B', description: '轻量高效，适合微调', contextWindow: '128K', pricing: '¥0.001/千tokens' },
      { id: 'qwen3-8b', name: 'Qwen3-8B', description: '极致效率，边缘部署', contextWindow: '128K', pricing: '¥0.0005/千tokens' },
      { id: 'qwen-max', name: 'Qwen-Max', description: '商业旗舰版本', contextWindow: '128K', pricing: '¥0.02/千tokens' },
      { id: 'qwq-32b', name: 'QwQ-32B', description: '推理增强版，思维链能力', contextWindow: '128K', pricing: '¥0.002/千tokens' },
    ],
  },
  {
    id: 'zhipu',
    name: '智谱 Z.AI',
    logo: '',
    color: '#3B82F6',
    models: [
      { id: 'glm-4.7', name: 'GLM-4.7', description: '最新编程专用模型，Agentic能力', contextWindow: '128K', pricing: '$0.50/M tokens' },
      { id: 'glm-4.6', name: 'GLM-4.6', description: '新一代推理增强模型', contextWindow: '128K', pricing: '$0.50/M tokens' },
      { id: 'glm-4.5', name: 'GLM-4.5', description: '开源权重，Claude级性能', contextWindow: '128K', pricing: '$0.35/M input, $1/M output' },
      { id: 'glm-4-plus', name: 'GLM-4-Plus', description: '最新旗舰，全面升级', contextWindow: '128K', pricing: '¥0.05/千tokens' },
      { id: 'glm-4-long', name: 'GLM-4-Long', description: '超长上下文，百万tokens', contextWindow: '1M', pricing: '¥0.01/千tokens' },
      { id: 'glm-4-airx', name: 'GLM-4-AirX', description: '极速推理，低延迟', contextWindow: '128K', pricing: '¥0.01/千tokens' },
      { id: 'glm-4-flash', name: 'GLM-4-Flash', description: '免费版本，日常使用', contextWindow: '128K', pricing: '免费' },
      { id: 'glm-4v-plus', name: 'GLM-4V-Plus', description: '视觉理解，多模态', contextWindow: '8K', pricing: '¥0.05/千tokens' },
    ],
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    logo: '',
    color: '#10B981',
    models: [
      { id: 'minimax-m2.1', name: 'MiniMax-M2.1', description: '最新多语言编程模型', contextWindow: '1M', pricing: '按量计费' },
      { id: 'minimax-m2-her', name: 'MiniMax-M2-her', description: '推理增强版', contextWindow: '1M', pricing: '按量计费' },
      { id: 'minimax-text-01', name: 'MiniMax-Text-01', description: '456B参数MoE模型，1M上下文', contextWindow: '1M', pricing: '$0.20/M input, $1.10/M output' },
      { id: 'minimax-m1', name: 'MiniMax-M1', description: '最新旗舰，推理增强', contextWindow: '1M', pricing: '¥0.01/千tokens' },
      { id: 'abab7', name: 'abab 7', description: '高性能通用模型', contextWindow: '245K', pricing: '¥0.01/千tokens' },
      { id: 'abab6.5s', name: 'abab 6.5s', description: '高性价比选择', contextWindow: '245K', pricing: '¥0.005/千tokens' },
      { id: 'abab6.5g', name: 'abab 6.5g', description: '通用对话模型', contextWindow: '245K', pricing: '¥0.005/千tokens' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    logo: '',
    color: '#4F8FF7',
    models: [
      { id: 'deepseek-v3.2', name: 'DeepSeek-V3.2', description: '最新通用版本，128K上下文', contextWindow: '128K', pricing: '$0.28/M input, $0.42/M output' },
      { id: 'deepseek-v3.1', name: 'DeepSeek-V3.1', description: 'V3升级，增强推理能力', contextWindow: '128K', pricing: '$0.14/M input, $0.28/M output' },
      { id: 'deepseek-r1', name: 'DeepSeek-R1', description: '推理旗舰，思维链超强', contextWindow: '128K', pricing: '$0.55/M input, $2.19/M output' },
      { id: 'deepseek-r1-0528', name: 'DeepSeek-R1-0528', description: '最新推理版本，性能提升', contextWindow: '128K', pricing: '¥4/M tokens' },
      { id: 'deepseek-v3-0324', name: 'DeepSeek-V3-0324', description: '通用版本0324', contextWindow: '128K', pricing: '¥1/M tokens' },
      { id: 'deepseek-v3', name: 'DeepSeek-V3', description: '通用对话旗舰', contextWindow: '128K', pricing: '¥1/M tokens' },
      { id: 'deepseek-r1-distill-qwen-32b', name: 'DeepSeek-R1-Distill-32B', description: '蒸馏推理版，轻量高效', contextWindow: '128K', pricing: '¥1/M tokens' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    logo: '🦙',
    color: '#f5f5f5',
    models: [
      { id: 'llama3.3:latest', name: 'Llama 3.3', description: 'Meta最新开源旗舰模型，综合能力强', contextWindow: '128K', pricing: '本地免费' },
      { id: 'llama3.1:70b', name: 'Llama 3.1 70B', description: '大参数版本，性能媲美GPT-4', contextWindow: '128K', pricing: '本地免费' },
      { id: 'llama3.1:8b', name: 'Llama 3.1 8B', description: '轻量高效，适合日常使用', contextWindow: '128K', pricing: '本地免费' },
      { id: 'qwen2.5:72b', name: 'Qwen 2.5 72B', description: '通义千问开源版，中文能力出色', contextWindow: '128K', pricing: '本地免费' },
      { id: 'qwen2.5:14b', name: 'Qwen 2.5 14B', description: '中等尺寸，平衡性能与资源', contextWindow: '128K', pricing: '本地免费' },
      { id: 'qwen2.5-coder:latest', name: 'Qwen 2.5 Coder', description: '专为编程优化的代码模型', contextWindow: '128K', pricing: '本地免费' },
      { id: 'qwen3:32b', name: 'Qwen3 32B', description: 'Qwen3开源版，320亿参数', contextWindow: '128K', pricing: '本地免费' },
      { id: 'deepseek-r1:latest', name: 'DeepSeek R1', description: '开源推理模型，思维链能力强', contextWindow: '128K', pricing: '本地免费' },
      { id: 'deepseek-r1:14b', name: 'DeepSeek R1 14B', description: '蒸馏版推理模型，轻量快速', contextWindow: '128K', pricing: '本地免费' },
      { id: 'deepseek-v3:latest', name: 'DeepSeek V3', description: 'DeepSeek通用模型，671B MoE', contextWindow: '128K', pricing: '本地免费' },
      { id: 'mistral:latest', name: 'Mistral 7B', description: '高效紧凑的欧洲开源模型', contextWindow: '32K', pricing: '本地免费' },
      { id: 'mixtral:latest', name: 'Mixtral 8x7B', description: 'MoE架构，专家混合高效推理', contextWindow: '32K', pricing: '本地免费' },
      { id: 'gemma2:latest', name: 'Gemma 2', description: 'Google轻量级开源模型', contextWindow: '8K', pricing: '本地免费' },
      { id: 'phi4:latest', name: 'Phi-4', description: '微软最新小模型，推理能力突出', contextWindow: '16K', pricing: '本地免费' },
      { id: 'codellama:latest', name: 'Code Llama', description: 'Meta代码专用模型', contextWindow: '16K', pricing: '本地免费' },
      { id: 'nomic-embed-text:latest', name: 'Nomic Embed', description: '高质量文本嵌入向量模型', contextWindow: '8K', pricing: '本地免费' },
    ],
  },
  {
    id: 'vllm',
    name: 'vLLM',
    logo: '⚡',
    color: '#7c3aed',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', description: 'Meta最新旗舰，综合能力最强', contextWindow: '128K', pricing: '本地免费' },
      { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B', description: 'Meta 官方 Instruct 版本，适合对话', contextWindow: '128K', pricing: '本地免费' },
      { id: 'meta-llama/Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B', description: '大参数版本，推理性能强', contextWindow: '128K', pricing: '本地免费' },
      { id: 'Qwen/Qwen3-32B', name: 'Qwen3 32B', description: 'Qwen3 开源版，高性能推理', contextWindow: '128K', pricing: '本地免费' },
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen 2.5 7B', description: '阿里通义千问，中文优化', contextWindow: '128K', pricing: '本地免费' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B', description: '大参数版本，综合能力突出', contextWindow: '128K', pricing: '本地免费' },
      { id: 'deepseek-ai/DeepSeek-V3.1', name: 'DeepSeek V3.1', description: 'DeepSeek 最新通用版本', contextWindow: '128K', pricing: '本地免费' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', description: 'DeepSeek 通用模型', contextWindow: '128K', pricing: '本地免费' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', description: '推理增强版，思维链能力', contextWindow: '128K', pricing: '本地免费' },
      { id: 'microsoft/Phi-4', name: 'Phi-4', description: '微软小模型，推理能力优秀', contextWindow: '16K', pricing: '本地免费' },
      { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B', description: '欧洲开源模型，高效紧凑', contextWindow: '32K', pricing: '本地免费' },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', description: 'MoE架构，专家混合', contextWindow: '32K', pricing: '本地免费' },
      { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', description: 'Google 轻量开源模型', contextWindow: '8K', pricing: '本地免费' },
    ],
  },
];
