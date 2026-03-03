import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Attachment } from './types/multimodal';
import { getOllamaService } from './services/ollamaService';
import type { OllamaMessage } from './services/ollamaService';

// Import types from store.ts - we'll add these types
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
  rating?: 'up' | 'down' | null;
  ratingTimestamp?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  provider: string;
  agentId?: string;
  folderId?: string;
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChatFolder {
  id: string;
  name: string;
  color: string;
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
  prompts?: string[];
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
  supportsVision?: boolean;
}

export type Page = 'chat' | 'agents' | 'skills' | 'models' | 'project' | 'knowledge' | 'mcp' | 'plugins' | 'settings' | 'workflow' | 'search' | 'data-management' | 'browser' | 'team';

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
  { id: 'midnight', name: '午夜星空', description: '深邃紫蓝色调', preview: { bg1: '#0f0a1a', bg2: '#1a1030', bg3: '#6366f1', accent: '#818cf8' } },
  { id: 'aurora', name: '极光幻境', description: '青绿渐变', preview: { bg1: '#0a1a1a', bg2: '#0d2b2b', bg3: '#06b6d4', accent: '#22d3ee' } },
  { id: 'sunset', name: '日落余晖', description: '橙红夕阳', preview: { bg1: '#1a0f0a', bg2: '#2d1810', bg3: '#f97316', accent: '#fb923c' } },
  { id: 'ocean', name: '深海幽蓝', description: '海洋蓝', preview: { bg1: '#0a0f1a', bg2: '#0d1b33', bg3: '#3b82f6', accent: '#60a5fa' } },
  { id: 'forest', name: '翡翠森林', description: '森林绿', preview: { bg1: '#0a1a0f', bg2: '#102d15', bg3: '#22c55e', accent: '#4ade80' } },
  { id: 'rose', name: '玫瑰金粉', description: '玫瑰粉', preview: { bg1: '#1a0a14', bg2: '#2d1024', bg3: '#ec4899', accent: '#f472b6' } },
  { id: 'cyberpunk', name: '赛博朋克', description: '霓虹灯光', preview: { bg1: '#0a0a1a', bg2: '#15052d', bg3: '#a855f7', accent: '#e879f9' } },
  { id: 'light', name: '清晨白昼', description: '浅色风格', preview: { bg1: '#f0f2f5', bg2: '#e2e5ea', bg3: '#6366f1', accent: '#4f46e5' } },
  { id: 'light-lavender', name: '薰衣草田', description: '梦幻紫', preview: { bg1: '#f5f0ff', bg2: '#ede4ff', bg3: '#8b5cf6', accent: '#7c3aed' } },
  { id: 'light-peach', name: '蜜桃暖阳', description: '暖桃橙', preview: { bg1: '#fff5f0', bg2: '#ffe8dd', bg3: '#f97316', accent: '#ea580c' } },
  { id: 'light-mint', name: '薄荷清风', description: '薄荷绿', preview: { bg1: '#f0fdf4', bg2: '#dcfce7', bg3: '#10b981', accent: '#059669' } },
  { id: 'light-sky', name: '晴空万里', description: '天空蓝', preview: { bg1: '#f0f7ff', bg2: '#dbeafe', bg3: '#3b82f6', accent: '#2563eb' } },
  { id: 'light-sand', name: '沙漠暮色', description: '沙金色', preview: { bg1: '#fefce8', bg2: '#fef3c7', bg3: '#d97706', accent: '#b45309' } },
];

interface AppState {
  user: User | null;
  isLoggedIn: boolean;
  authMode: 'login' | 'register';
  login: (email: string, password: string) => boolean;
  register: (username: string, email: string, password: string) => boolean;
  logout: () => void;
  setAuthMode: (mode: 'login' | 'register') => void;

  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  conversations: Conversation[];
  activeConversationId: string | null;
  createConversation: (agentId?: string) => string;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;

  folders: ChatFolder[];
  createFolder: (name: string, color?: string) => string;
  deleteFolder: (id: string) => void;
  updateFolder: (id: string, updates: Partial<Pick<ChatFolder, 'name' | 'color'>>) => void;
  moveToFolder: (conversationId: string, folderId?: string) => void;

  pinConversation: (id: string) => void;
  unpinConversation: (id: string) => void;

  selectedProvider: string;
  selectedModel: string;
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;
  apiKeys: Record<string, string>;
  setApiKey: (provider: string, key: string) => void;

  ollamaEndpoint: string;
  setOllamaEndpoint: (url: string) => void;
  ollamaStatus: 'idle' | 'connecting' | 'connected' | 'error';
  setOllamaStatus: (s: 'idle' | 'connecting' | 'connected' | 'error') => void;
  ollamaCustomModel: string;
  setOllamaCustomModel: (m: string) => void;
  ollamaModels: string[];
  setOllamaModels: (models: string[]) => void;

  vllmEndpoint: string;
  setVllmEndpoint: (url: string) => void;
  vllmStatus: 'idle' | 'connecting' | 'connected' | 'error';
  setVllmStatus: (s: 'idle' | 'connecting' | 'connected' | 'error') => void;
  vllmCustomModel: string;
  setVllmCustomModel: (m: string) => void;

  agents: Agent[];
  activeAgent: Agent | null;
  setActiveAgent: (agent: Agent | null) => void;

  skills: Skill[];
  toggleSkill: (skillId: string) => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;

  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

// Default agents (50+)
const defaultAgents: Agent[] = [
  // 创意类
  { id: 'creative-writer', name: '创意写作助手', description: '擅长创意写作', icon: '✍️', systemPrompt: '你是一个专业创意写作助手', skills: ['writing'], category: '创意', color: '#f59e0b' },
  { id: 'copywriter', name: '文案写手', description: '广告文案专家', icon: '📝', systemPrompt: '你是一个专业文案写手', skills: ['copywriting'], category: '创意', color: '#f97316' },
  { id: 'poet', name: '诗人', description: '诗歌创作', icon: '🎭', systemPrompt: '你是一个诗人', skills: ['poetry'], category: '创意', color: '#ec4899' },
  { id: 'screenwriter', name: '编剧', description: '剧本创作', icon: '🎬', systemPrompt: '你是一个专业编剧', skills: ['screenwriting'], category: '创意', color: '#8b5cf6' },
  { id: 'game-writer', name: '游戏文案', description: '游戏世界观设定', icon: '🎮', systemPrompt: '你是一个游戏文案设计师', skills: ['game-writing'], category: '创意', color: '#14b8a6' },
  
  // 开发类
  { id: 'code-expert', name: '代码专家', description: '全栈开发专家', icon: '💻', systemPrompt: '你是一个资深全栈开发专家', skills: ['coding'], category: '开发', color: '#6366f1' },
  { id: 'frontend-dev', name: '前端工程师', description: 'React/Vue专家', icon: '🌐', systemPrompt: '你是一个专业前端工程师', skills: ['frontend'], category: '开发', color: '#06b6d4' },
  { id: 'backend-dev', name: '后端工程师', description: 'Node/Python专家', icon: '⚙️', systemPrompt: '你是一个专业后端工程师', skills: ['backend'], category: '开发', color: '#3b82f6' },
  { id: 'devops', name: 'DevOps工程师', description: 'CI/CD和云原生', icon: '☁️', systemPrompt: '你是一个专业DevOps工程师', skills: ['devops'], category: '开发', color: '#22c55e' },
  { id: 'security-expert', name: '安全专家', description: '网络安全审计', icon: '🔒', systemPrompt: '你是一个专业安全工程师', skills: ['security'], category: '开发', color: '#ef4444' },
  { id: 'mobile-dev', name: '移动开发', description: 'iOS/Android开发', icon: '📱', systemPrompt: '你是一个专业移动端开发者', skills: ['mobile'], category: '开发', color: '#f59e0b' },
  { id: 'data-engineer', name: '数据工程师', description: '大数据处理', icon: '🗄️', systemPrompt: '你是一个专业数据工程师', skills: ['data-engineering'], category: '开发', color: '#8b5cf6' },
  { id: 'ml-engineer', name: 'ML工程师', description: '机器学习专家', icon: '🤖', systemPrompt: '你是一个专业机器学习工程师', skills: ['ml'], category: '开发', color: '#ec4899' },
  
  // 分析类
  { id: 'data-analyst', name: '数据分析师', description: '数据分析专家', icon: '📊', systemPrompt: '你是一个专业数据分析师', skills: ['data-analysis'], category: '分析', color: '#22c55e' },
  { id: 'financial-analyst', name: '金融分析师', description: '投资分析专家', icon: '💹', systemPrompt: '你是一个专业金融分析师', skills: ['finance'], category: '分析', color: '#14b8a6' },
  { id: 'business-analyst', name: '商业分析师', description: '商业策略分析', icon: '📈', systemPrompt: '你是一个专业商业分析师', skills: ['business-analysis'], category: '分析', color: '#06b6d4' },
  { id: 'seo-analyst', name: 'SEO专家', description: '搜索引擎优化', icon: '🔍', systemPrompt: '你是一个专业SEO专家', skills: ['seo'], category: '分析', color: '#f97316' },
  { id: 'market-analyst', name: '市场分析师', description: '市场调研分析', icon: '📊', systemPrompt: '你是一个专业市场分析师', skills: ['market-analysis'], category: '分析', color: '#ec4899' },
  
  // 语言类
  { id: 'translator', name: '多语言翻译官', description: '翻译专家', icon: '🌐', systemPrompt: '你是一个专业翻译专家', skills: ['translation'], category: '语言', color: '#3b82f6' },
  { id: 'english-tutor', name: '英语家教', description: '英语学习辅导', icon: '🇺🇸', systemPrompt: '你是一个专业英语家教', skills: ['english'], category: '语言', color: '#6366f1' },
  { id: 'language-tutor', name: '语言老师', description: '多语言教学', icon: '🎓', systemPrompt: '你是一个专业语言老师', skills: ['language-teaching'], category: '语言', color: '#8b5cf6' },
  { id: 'technical-writer', name: '技术文档专家', description: 'API文档撰写', icon: '📚', systemPrompt: '你是一个专业技术文档写手', skills: ['technical-writing'], category: '语言', color: '#14b8a6' },
  
  // 产品类
  { id: 'product-manager', name: '产品经理', description: '产品设计专家', icon: '📱', systemPrompt: '你是一个专业产品经理', skills: ['product-management'], category: '产品', color: '#ec4899' },
  { id: 'ux-designer', name: 'UX设计师', description: '用户体验设计', icon: '🎨', systemPrompt: '你是一个专业UX设计师', skills: ['ux'], category: '产品', color: '#f59e0b' },
  { id: 'product-strategist', name: '产品战略家', description: '产品规划', icon: '🏰', systemPrompt: '你是一个产品战略专家', skills: ['product-strategy'], category: '产品', color: '#06b6d4' },
  { id: 'growth-hacker', name: '增长黑客', description: '用户增长策略', icon: '🚀', systemPrompt: '你是一个增长黑客', skills: ['growth'], category: '产品', color: '#22c55e' },
  
  // 设计类
  { id: 'designer', name: '设计师', description: 'UI/UX设计专家', icon: '🎨', systemPrompt: '你是一个专业UI/UX设计师', skills: ['design'], category: '设计', color: '#8b5cf6' },
  { id: 'logo-designer', name: 'Logo设计师', description: '品牌标识设计', icon: '⭐', systemPrompt: '你是一个专业Logo设计师', skills: ['logo-design'], category: '设计', color: '#f97316' },
  { id: 'brand-designer', name: '品牌设计师', description: '品牌形象设计', icon: '💎', systemPrompt: '你是一个专业品牌设计师', skills: ['brand-design'], category: '设计', color: '#ec4899' },
  { id: 'illustrator', name: '插画师', description: '数字插画创作', icon: '🖼️', systemPrompt: '你是一个专业插画师', skills: ['illustration'], category: '设计', color: '#14b8a6' },
  { id: 'motion-designer', name: '动效设计师', description: 'UI动效设计', icon: '🎬', systemPrompt: '你是一个专业动效设计师', skills: ['motion-design'], category: '设计', color: '#06b6d4' },
  
  // 金融类
  { id: 'investment-advisor', name: '投资顾问', description: '投资理财建议', icon: '💰', systemPrompt: '你是一个专业投资顾问', skills: ['investment'], category: '金融', color: '#14b8a6' },
  { id: 'accountant', name: '会计师', description: '财务会计', icon: '📒', systemPrompt: '你是一个专业会计师', skills: ['accounting'], category: '金融', color: '#22c55e' },
  { id: 'tax-consultant', name: '税务顾问', description: '税务筹划', icon: '🏛️', systemPrompt: '你是一个专业税务顾问', skills: ['tax'], category: '金融', color: '#3b82f6' },
  { id: 'risk-analyst', name: '风险分析师', description: '风险评估', icon: '⚖️', systemPrompt: '你是一个专业风险分析师', skills: ['risk-analysis'], category: '金融', color: '#ef4444' },
  
  // 营销类
  { id: 'marketing-expert', name: '营销专家', description: '品牌营销专家', icon: '📢', systemPrompt: '你是一个专业营销专家', skills: ['marketing'], category: '营销', color: '#f97316' },
  { id: 'social-media-manager', name: '社交媒体运营', description: '新媒体运营', icon: '📱', systemPrompt: '你是一个专业社交媒体运营', skills: ['social-media'], category: '营销', color: '#ec4899' },
  { id: 'seo-specialist', name: 'SEO专员', description: '搜索引擎优化', icon: '🔎', systemPrompt: '你是一个专业SEO专员', skills: ['seo'], category: '营销', color: '#f59e0b' },
  { id: 'content-marketer', name: '内容营销', description: '内容策略', icon: '📝', systemPrompt: '你是一个专业内容营销专家', skills: ['content-marketing'], category: '营销', color: '#8b5cf6' },
  { id: 'influencer-marketer', name: '网红营销', description: 'KOL合作', icon: '⭐', systemPrompt: '你是一个专业网红营销专家', skills: ['influencer-marketing'], category: '营销', color: '#06b6d4' },
  
  // 教育类
  { id: 'teacher', name: '老师', description: '学科辅导', icon: '👨‍🏫', systemPrompt: '你是一个专业老师', skills: ['teaching'], category: '教育', color: '#6366f1' },
  { id: 'tutor', name: '家教', description: '一对一辅导', icon: '📖', systemPrompt: '你是一个专业家教', skills: ['tutoring'], category: '教育', color: '#22c55e' },
  { id: 'researcher', name: '研究员', description: '学术研究', icon: '🔬', systemPrompt: '你是一个专业研究员', skills: ['research'], category: '教育', color: '#14b8a6' },
  { id: 'career-counselor', name: '职业顾问', description: '职业规划', icon: '💼', systemPrompt: '你是一个专业职业顾问', skills: ['career-counseling'], category: '教育', color: '#3b82f6' },
  
  // 医疗健康类
  { id: 'health-consultant', name: '健康顾问', description: '健康咨询', icon: '❤️', systemPrompt: '你是一个健康顾问', skills: ['health'], category: '健康', color: '#ef4444' },
  { id: 'nutritionist', name: '营养师', description: '饮食营养建议', icon: '🥗', systemPrompt: '你是一个专业营养师', skills: ['nutrition'], category: '健康', color: '#22c55e' },
  { id: 'fitness-coach', name: '健身教练', description: '运动指导', icon: '💪', systemPrompt: '你是一个专业健身教练', skills: ['fitness'], category: '健康', color: '#f97316' },
  { id: 'mental-health', name: '心理健康顾问', description: '心理咨询', icon: '🧠', systemPrompt: '你是一个心理健康顾问', skills: ['mental-health'], category: '健康', color: '#8b5cf6' },
  
  // 法律类
  { id: 'lawyer', name: '律师', description: '法律咨询', icon: '⚖️', systemPrompt: '你是一个专业律师', skills: ['legal'], category: '法律', color: '#1e293b' },
  { id: 'legal-consultant', name: '法律顾问', description: '企业法务', icon: '📜', systemPrompt: '你是一个专业法律顾问', skills: ['legal-consulting'], category: '法律', color: '#475569' },
  
  // 生活服务类
  { id: 'life-assistant', name: '生活助手', description: '日常生活问题', icon: '🏠', systemPrompt: '你是一个贴心生活助手', skills: ['life'], category: '生活', color: '#10b981' },
  { id: 'chef', name: '厨师', description: '美食烹饪专家', icon: '👨‍🍳', systemPrompt: '你是一个专业厨师', skills: ['cooking'], category: '生活', color: '#f59e0b' },
  { id: 'travel-planner', name: '旅行规划师', description: '行程安排专家', icon: '✈️', systemPrompt: '你是一个专业旅行规划师', skills: ['travel'], category: '生活', color: '#06b6d4' },
  { id: 'pet-consultant', name: '宠物顾问', description: '宠物养护专家', icon: '🐕', systemPrompt: '你是一个专业宠物顾问', skills: ['pet'], category: '生活', color: '#8b5cf6' },
  { id: 'stylist', name: '造型师', description: '穿搭建议', icon: '👔', systemPrompt: '你是一个专业造型师', skills: ['fashion'], category: '生活', color: '#ec4899' },
  { id: 'home-designer', name: '家居设计师', description: '室内设计建议', icon: '🏡', systemPrompt: '你是一个专业家居设计师', skills: ['home-design'], category: '生活', color: '#14b8a6' },
  
  // 科研学术类
  { id: 'research-assistant', name: '论文助手', description: '学术论文撰写', icon: '📄', systemPrompt: '你是一个专业学术论文助手', skills: ['research'], category: '学术', color: '#6366f1' },
  { id: 'math-tutor', name: '数学老师', description: '数学辅导专家', icon: '🔢', systemPrompt: '你是一个专业数学老师', skills: ['math'], category: '学术', color: '#3b82f6' },
  { id: 'physics-tutor', name: '物理老师', description: '物理辅导专家', icon: '⚛️', systemPrompt: '你是一个专业物理老师', skills: ['physics'], category: '学术', color: '#06b6d4' },
  { id: 'chemistry-tutor', name: '化学老师', description: '化学辅导专家', icon: '🧪', systemPrompt: '你是一个专业化学老师', skills: ['chemistry'], category: '学术', color: '#22c55e' },
  { id: 'programming-tutor', name: '编程教练', description: '编程学习辅导', icon: '⌨️', systemPrompt: '你是一个专业编程教练', skills: ['programming'], category: '学术', color: '#f97316' },
  { id: 'thesis-reviewer', name: '论文审稿人', description: '论文评审修改', icon: '📝', systemPrompt: '你是一个专业论文审稿人', skills: ['thesis'], category: '学术', color: '#8b5cf6' },
  
  // 职场办公类
  { id: 'interviewer', name: '面试官', description: '面试准备指导', icon: '👔', systemPrompt: '你是一个专业面试官', skills: ['interview'], category: '职场', color: '#1e293b' },
  { id: 'ppt-expert', name: 'PPT制作', description: '演示文稿设计', icon: '📊', systemPrompt: '你是一个专业PPT制作专家', skills: ['ppt'], category: '职场', color: '#f59e0b' },
  { id: 'email-writer', name: '邮件助手', description: '商务邮件撰写', icon: '✉️', systemPrompt: '你是一个专业邮件助手', skills: ['email'], category: '职场', color: '#3b82f6' },
  { id: 'meeting-secretary', name: '会议纪要', description: '会议记录整理', icon: '📋', systemPrompt: '你是一个专业会议纪要助手', skills: ['meeting'], category: '职场', color: '#22c55e' },
  { id: 'resume-expert', name: '简历优化', description: '简历修改指导', icon: '📄', systemPrompt: '你是一个专业简历优化专家', skills: ['resume'], category: '职场', color: '#ec4899' },
  { id: 'project-manager', name: '项目经理', description: '项目管理专家', icon: '📁', systemPrompt: '你是一个专业项目经理', skills: ['pm'], category: '职场', color: '#14b8a6' },
  { id: 'hr-consultant', name: 'HR顾问', description: '人力资源咨询', icon: '👥', systemPrompt: '你是一个专业HR顾问', skills: ['hr'], category: '职场', color: '#8b5cf6' },
  
  // IT运维类
  { id: 'sysadmin', name: '系统管理员', description: '系统运维管理', icon: '🖥️', systemPrompt: '你是一个专业系统管理员', skills: ['sysadmin'], category: 'IT运维', color: '#6366f1' },
  { id: 'network-engineer', name: '网络工程师', description: '网络架构设计', icon: '🌐', systemPrompt: '你是一个专业网络工程师', skills: ['network'], category: 'IT运维', color: '#06b6d4' },
  { id: 'dba', name: '数据库管理员', description: 'DBA专家', icon: '🗄️', systemPrompt: '你是一个专业数据库管理员', skills: ['dba'], category: 'IT运维', color: '#f97316' },
  { id: 'sre', name: 'SRE工程师', description: '站点可靠性工程', icon: '🔧', systemPrompt: '你是一个专业SRE工程师', skills: ['sre'], category: 'IT运维', color: '#22c55e' },
  { id: 'cloud-architect', name: '云架构师', description: '云计算架构', icon: '☁️', systemPrompt: '你是一个专业云架构师', skills: ['cloud'], category: 'IT运维', color: '#3b82f6' },
  
  // 电商运营类
  { id: 'amazon-seller', name: '亚马逊运营', description: '亚马逊店铺运营', icon: '📦', systemPrompt: '你是一个专业亚马逊运营专家', skills: ['amazon'], category: '电商', color: '#f59e0b' },
  { id: 'shopify-expert', name: 'Shopify专家', description: 'Shopify建站运营', icon: '🛒', systemPrompt: '你是一个专业Shopify专家', skills: ['shopify'], category: '电商', color: '#22c55e' },
  { id: 'ecommerce-copywriter', name: '电商文案', description: '产品描述撰写', icon: '📝', systemPrompt: '你是一个专业电商文案专家', skills: ['ecommerce'], category: '电商', color: '#ec4899' },
  { id: 'ads-specialist', name: '广告投放师', description: '广告优化投放', icon: '📢', systemPrompt: '你是一个专业广告投放师', skills: ['ads'], category: '电商', color: '#f97316' },
  
  // 创作艺术类
  { id: 'music-composer', name: '音乐创作', description: '歌曲创作专家', icon: '🎵', systemPrompt: '你是一个专业音乐创作人', skills: ['music'], category: '艺术', color: '#8b5cf6' },
  { id: 'video-editor', name: '视频剪辑', description: '视频后期制作', icon: '🎬', systemPrompt: '你是一个专业视频剪辑师', skills: ['video'], category: '艺术', color: '#ec4899' },
  { id: 'photography-tutor', name: '摄影指导', description: '摄影技巧教学', icon: '📷', systemPrompt: '你是一个专业摄影指导', skills: ['photo'], category: '艺术', color: '#14b8a6' },
  { id: 'podcast-host', name: '播客主持', description: '播客内容策划', icon: '🎙️', systemPrompt: '你是一个专业播客主持', skills: ['podcast'], category: '艺术', color: '#f97316' },
  
  // 金融科技类
  { id: 'crypto-advisor', name: '区块链顾问', description: '加密货币分析', icon: '💎', systemPrompt: '你是一个专业区块链顾问', skills: ['crypto'], category: '金融科技', color: '#f59e0b' },
  { id: 'risk-control', name: '风控专家', description: '风险控制分析', icon: '🛡️', systemPrompt: '你是一个专业风控专家', skills: ['risk'], category: '金融科技', color: '#ef4444' },
  { id: 'data-scientist', name: '数据科学家', description: '数据分析建模', icon: '📊', systemPrompt: '你是一个专业数据科学家', skills: ['data-science'], category: '金融科技', color: '#6366f1' },
  { id: 'quant-analyst', name: '量化分析师', description: '量化投资策略', icon: '📈', systemPrompt: '你是一个专业量化分析师', skills: ['quant'], category: '金融科技', color: '#22c55e' },
  
  // 餐饮服务类
  { id: 'barista', name: '咖啡师', description: '咖啡制作专家', icon: '☕', systemPrompt: '你是一个专业咖啡师', skills: ['coffee'], category: '餐饮', color: '#8b5cf6' },
  { id: 'bartender', name: '调酒师', description: '鸡尾酒调制', icon: '🍸', systemPrompt: '你是一个专业调酒师', skills: ['bartending'], category: '餐饮', color: '#ec4899' },
  { id: 'restaurant-manager', name: '餐厅管理', description: '餐饮运营管理', icon: '🍽️', systemPrompt: '你是一个专业餐厅管理者', skills: ['restaurant'], category: '餐饮', color: '#f59e0b' },
  
  // 房产类
  { id: 'real-estate-agent', name: '房产顾问', description: '房产买卖咨询', icon: '🏠', systemPrompt: '你是一个专业房产顾问', skills: ['real-estate'], category: '房产', color: '#14b8a6' },
  { id: 'interior-designer', name: '室内设计师', description: '室内装修设计', icon: '🎨', systemPrompt: '你是一个专业室内设计师', skills: ['interior'], category: '房产', color: '#f97316' },
  
  // 汽车类
  { id: 'car-consultant', name: '汽车顾问', description: '购车咨询服务', icon: '🚗', systemPrompt: '你是一个专业汽车顾问', skills: ['car'], category: '汽车', color: '#3b82f6' },
  { id: 'mechanic', name: '汽车维修', description: '车辆维修指导', icon: '🔧', systemPrompt: '你是一个专业汽车维修师傅', skills: ['mechanic'], category: '汽车', color: '#ef4444' },
  
  // 其他专业类
  { id: 'architect', name: '建筑师', description: '建筑设计咨询', icon: '🏗️', systemPrompt: '你是一个专业建筑师', skills: ['architecture'], category: '建筑', color: '#6366f1' },
  { id: 'civil-engineer', name: '土木工程师', description: '土木工程咨询', icon: '🧱', systemPrompt: '你是一个专业土木工程师', skills: ['civil'], category: '建筑', color: '#f59e0b' },
  { id: 'journalist', name: '记者', description: '新闻写作采访', icon: '📰', systemPrompt: '你是一个专业记者', skills: ['journalism'], category: '媒体', color: '#1e293b' },
  { id: 'pr-specialist', name: '公关专家', description: '公共关系处理', icon: '🎯', systemPrompt: '你是一个专业公关专家', skills: ['pr'], category: '媒体', color: '#8b5cf6' },
  
  // 娱乐类
  { id: 'game-master', name: '游戏大师', description: '游戏攻略专家', icon: '🎮', systemPrompt: '你是一个专业游戏攻略大师', skills: ['gaming'], category: '娱乐', color: '#22c55e' },
  { id: 'chess-coach', name: '象棋教练', description: '象棋教学指导', icon: '♟️', systemPrompt: '你是一个专业象棋教练', skills: ['chess'], category: '娱乐', color: '#f59e0b' },
  { id: 'astrologer', name: '占星师', description: '星座运势解读', icon: '🔮', systemPrompt: '你是一个专业占星师', skills: ['astrology'], category: '娱乐', color: '#8b5cf6' },
  { id: 'magic-tutor', name: '魔术教练', description: '魔术教学', icon: '🎩', systemPrompt: '你是一个专业魔术教练', skills: ['magic'], category: '娱乐', color: '#ec4899' },
  { id: 'dance-tutor', name: '舞蹈教练', description: '舞蹈教学指导', icon: '💃', systemPrompt: '你是一个专业舞蹈教练', skills: ['dance'], category: '娱乐', color: '#f97316' },
  
  // 运动类
  { id: 'yoga-instructor', name: '瑜伽教练', description: '瑜伽教学', icon: '🧘', systemPrompt: '你是一个专业瑜伽教练', skills: ['yoga'], category: '运动', color: '#14b8a6' },
  { id: 'sports-coach', name: '运动教练', description: '体育指导', icon: '⚽', systemPrompt: '你是一个专业运动教练', skills: ['sports'], category: '运动', color: '#22c55e' },
  { id: 'swimming-coach', name: '游泳教练', description: '游泳教学', icon: '🏊', systemPrompt: '你是一个专业游泳教练', skills: ['swimming'], category: '运动', color: '#06b6d4' },
  { id: 'martial-arts', name: '武术教练', description: '武术教学', icon: '🥋', systemPrompt: '你是一个专业武术教练', skills: ['martial-arts'], category: '运动', color: '#ef4444' },
  
  // 科技类
  { id: 'ai-researcher', name: 'AI研究员', description: '人工智能研究', icon: '🤖', systemPrompt: '你是一个专业AI研究员', skills: ['ai-research'], category: '科技', color: '#6366f1' },
  { id: 'blockchain-dev', name: '区块链开发', description: '智能合约开发', icon: '⛓️', systemPrompt: '你是一个专业区块链开发者', skills: ['blockchain'], category: '科技', color: '#f59e0b' },
  { id: 'robotics-expert', name: '机器人专家', description: '机器人技术', icon: '🦾', systemPrompt: '你是一个专业机器人专家', skills: ['robotics'], category: '科技', color: '#8b5cf6' },
  { id: 'ar-vr-developer', name: 'AR/VR开发', description: '增强现实开发', icon: '🥽', systemPrompt: '你是一个专业AR/VR开发者', skills: ['ar-vr'], category: '科技', color: '#ec4899' },
  { id: 'iot-expert', name: 'IoT专家', description: '物联网技术', icon: '📡', systemPrompt: '你是一个专业IoT专家', skills: ['iot'], category: '科技', color: '#22c55e' },
  
  // 农业类
  { id: 'agriculture-expert', name: '农业专家', description: '农业技术咨询', icon: '🌾', systemPrompt: '你是一个专业农业专家', skills: ['agriculture'], category: '农业', color: '#22c55e' },
  { id: 'gardening-expert', name: '园艺专家', description: '植物养护', icon: '🌱', systemPrompt: '你是一个专业园艺专家', skills: ['gardening'], category: '农业', color: '#14b8a6' },
  { id: 'veterinarian', name: '兽医', description: '宠物医疗', icon: '🐾', systemPrompt: '你是一个专业兽医', skills: ['veterinary'], category: '农业', color: '#f97316' },
  
  // 手工艺术类
  { id: 'craftsman', name: '手工艺人', description: '传统手工艺', icon: '🧵', systemPrompt: '你是一个专业手工艺人', skills: ['crafts'], category: '手工', color: '#f59e0b' },
  { id: 'jewelry-designer', name: '珠宝设计师', description: '珠宝设计', icon: '💎', systemPrompt: '你是一个专业珠宝设计师', skills: ['jewelry'], category: '手工', color: '#ec4899' },
  { id: 'woodworking', name: '木工师傅', description: '木工制作', icon: '🪵', systemPrompt: '你是一个专业木工师傅', skills: ['woodworking'], category: '手工', color: '#8b5cf6' },
];

// Default skills (100+)
const defaultSkills: Skill[] = [
  // 信息获取
  { id: 'web-search', name: '网络搜索', description: '实时搜索', icon: '🔍', category: '信息获取', enabled: true },
  { id: 'news-aggregator', name: '新闻聚合', description: '最新资讯', icon: '📰', category: '信息获取', enabled: false },
  { id: 'academic-search', name: '学术搜索', description: '论文查找', icon: '🎓', category: '信息获取', enabled: false },
  { id: 'code-search', name: '代码搜索', description: 'GitHub搜索', icon: '🔎', category: '信息获取', enabled: false },
  
  // 开发工具
  { id: 'coding', name: '代码生成', description: '代码生成', icon: '⌨️', category: '开发工具', enabled: true },
  { id: 'code-review', name: '代码审查', description: '代码审查', icon: '👀', category: '开发工具', enabled: false },
  { id: 'debugging', name: '调试辅助', description: 'Bug定位', icon: '🐛', category: '开发工具', enabled: false },
  { id: 'refactoring', name: '重构建议', description: '代码重构', icon: '🔧', category: '开发工具', enabled: false },
  { id: 'testing', name: '测试生成', description: '单元测试', icon: '🧪', category: '开发工具', enabled: false },
  { id: 'git-helper', name: 'Git助手', description: '版本控制', icon: '📦', category: '开发工具', enabled: false },
  { id: 'api-design', name: 'API设计', description: '接口设计', icon: '🔌', category: '开发工具', enabled: false },
  { id: 'database-design', name: '数据库设计', description: 'SQL建模', icon: '🗄️', category: '开发工具', enabled: false },
  { id: 'docker-helper', name: 'Docker助手', description: '容器化', icon: '🐳', category: '开发工具', enabled: false },
  { id: 'k8s-helper', name: 'K8s助手', description: '编排部署', icon: '☸️', category: '开发工具', enabled: false },
  { id: 'security-scan', name: '安全扫描', description: '漏洞检测', icon: '🔒', category: '开发工具', enabled: false },
  { id: 'performance-opt', name: '性能优化', description: '性能调优', icon: '⚡', category: '开发工具', enabled: false },
  { id: 'docs-generator', name: '文档生成', description: '自动文档', icon: '📚', category: '开发工具', enabled: false },
  
  // 创作工具
  { id: 'writing', name: '文案撰写', description: '文案撰写', icon: '✍️', category: '创作工具', enabled: true },
  { id: 'copywriting', name: '广告文案', description: '营销文案', icon: '📝', category: '创作工具', enabled: false },
  { id: 'poetry', name: '诗歌创作', description: '诗词生成', icon: '🎭', category: '创作工具', enabled: false },
  { id: 'screenwriting', name: '剧本创作', description: '剧本编写', icon: '🎬', category: '创作工具', enabled: false },
  { id: 'storytelling', name: '故事创作', description: '小说故事', icon: '📖', category: '创作工具', enabled: false },
  { id: 'headline-generator', name: '标题生成', description: '吸睛标题', icon: '📰', category: '创作工具', enabled: false },
  { id: 'email-writer', name: '邮件撰写', description: '商务邮件', icon: '✉️', category: '创作工具', enabled: false },
  { id: 'blog-writer', name: '博客写作', description: '技术博客', icon: '📓', category: '创作工具', enabled: false },
  { id: 'social-post', name: '社交媒体', description: '帖子撰写', icon: '📱', category: '创作工具', enabled: false },
  { id: 'video-script', name: '视频脚本', description: '短视频脚本', icon: '🎥', category: '创作工具', enabled: false },
  
  // 分析工具
  { id: 'data-analysis', name: '数据分析', description: '数据处理', icon: '📊', category: '分析工具', enabled: false },
  { id: 'chart-generation', name: '图表生成', description: '可视化', icon: '📈', category: '分析工具', enabled: false },
  { id: 'statistical-analysis', name: '统计分析', description: '统计建模', icon: '📉', category: '分析工具', enabled: false },
  { id: 'trend-analysis', name: '趋势分析', description: '预测分析', icon: '📊', category: '分析工具', enabled: false },
  { id: 'competitor-analysis', name: '竞品分析', description: '市场分析', icon: '🔍', category: '分析工具', enabled: false },
  { id: 'swot-analysis', name: 'SWOT分析', description: '策略分析', icon: '📋', category: '分析工具', enabled: false },
  { id: 'sentiment-analysis', name: '情感分析', description: '舆情分析', icon: '💭', category: '分析工具', enabled: false },
  
  // 语言工具
  { id: 'translation', name: '翻译', description: '多语言翻译', icon: '🌐', category: '语言工具', enabled: false },
  { id: 'proofreading', name: '校对', description: '语法检查', icon: '✅', category: '语言工具', enabled: false },
  { id: 'paraphrasing', name: '改写', description: '句子改写', icon: '🔄', category: '语言工具', enabled: false },
  { id: 'summarization', name: '摘要', description: '文章摘要', icon: '📑', category: '语言工具', enabled: false },
  { id: 'language-learning', name: '语言学习', description: '外语辅导', icon: '🎓', category: '语言工具', enabled: false },
  { id: 'tone-adjustment', name: '语气调整', description: '正式/口语', icon: '🗣️', category: '语言工具', enabled: false },
  
  // 设计工具
  { id: 'design', name: '设计建议', description: 'UI/UX建议', icon: '🎨', category: '设计工具', enabled: false },
  { id: 'color-palette', name: '配色方案', description: '色彩搭配', icon: '🎨', category: '设计工具', enabled: false },
  { id: 'typography', name: '字体建议', description: '排版设计', icon: '🔤', category: '设计工具', enabled: false },
  { id: 'layout-suggestion', name: '布局建议', description: '页面布局', icon: '📐', category: '设计工具', enabled: false },
  { id: 'logo-ideas', name: 'Logo创意', description: '标志设计', icon: '⭐', category: '设计工具', enabled: false },
  { id: 'mockup-generator', name: '原型生成', description: '界面原型', icon: '📱', category: '设计工具', enabled: false },
  
  // 营销工具
  { id: 'marketing', name: '营销策略', description: '营销方案', icon: '📢', category: '营销工具', enabled: false },
  { id: 'seo', name: 'SEO优化', description: '搜索引擎优化', icon: '🔍', category: '营销工具', enabled: false },
  { id: 'ad-copy', name: '广告文案', description: '投放广告', icon: '📣', category: '营销工具', enabled: false },
  { id: 'campaign-ideas', name: '活动策划', description: '营销活动', icon: '🎯', category: '营销工具', enabled: false },
  { id: 'social-strategy', name: '社媒策略', description: '社交媒体', icon: '📱', category: '营销工具', enabled: false },
  { id: 'email-marketing', name: '邮件营销', description: 'EDM营销', icon: '📧', category: '营销工具', enabled: false },
  { id: 'content-strategy', name: '内容策略', description: '内容营销', icon: '📝', category: '营销工具', enabled: false },
  
  // 生产力工具
  { id: 'task-management', name: '任务管理', description: '待办事项', icon: '✅', category: '生产力', enabled: false },
  { id: 'note-taking', name: '笔记整理', description: '知识管理', icon: '📝', category: '生产力', enabled: false },
  { id: 'meeting-notes', name: '会议纪要', description: '自动总结', icon: '📋', category: '生产力', enabled: false },
  { id: 'schedule-planner', name: '日程规划', description: '时间管理', icon: '📅', category: '生产力', enabled: false },
  { id: 'brainstorming', name: '头脑风暴', description: '创意激发', icon: '💡', category: '生产力', enabled: false },
  { id: 'ppt-generator', name: 'PPT生成', description: '演示文稿', icon: '📊', category: '生产力', enabled: false },
  { id: 'resume-builder', name: '简历优化', description: '求职简历', icon: '📄', category: '生产力', enabled: false },
  { id: 'interview-prep', name: '面试准备', description: '面试辅导', icon: '👔', category: '生产力', enabled: false },
  
  // 多模态工具
  { id: 'image-generation', name: '图片生成', description: 'AI绘图', icon: '🖼️', category: '多模态', enabled: false },
  { id: 'video-analysis', name: '视频分析', description: '内容理解', icon: '🎥', category: '多模态', enabled: false },
  { id: 'audio-transcription', name: '语音转写', description: '音频文字化', icon: '🎙️', category: '多模态', enabled: false },
  { id: 'ocr', name: '文字识别', description: '图片提取', icon: '📷', category: '多模态', enabled: false },
  { id: 'chart-to-text', name: '图表解读', description: '图片分析', icon: '📊', category: '多模态', enabled: false },
  
  // 专业咨询
  { id: 'legal-consult', name: '法律咨询', description: '法律建议', icon: '⚖️', category: '专业咨询', enabled: false },
  { id: 'medical-consult', name: '健康咨询', description: '医疗建议', icon: '❤️', category: '专业咨询', enabled: false },
  { id: 'financial-consult', name: '理财咨询', description: '投资建议', icon: '💰', category: '专业咨询', enabled: false },
  { id: 'career-consult', name: '职业咨询', description: '发展规划', icon: '💼', category: '专业咨询', enabled: false },
  { id: 'psychological', name: '心理咨询', description: '情绪疏导', icon: '🧠', category: '专业咨询', enabled: false },
  
  // 娱乐休闲
  { id: 'game-companion', name: '游戏伙伴', description: '游戏攻略', icon: '🎮', category: '娱乐', enabled: false },
  { id: 'movie-recommender', name: '影视推荐', description: '电影推荐', icon: '🎬', category: '娱乐', enabled: false },
  { id: 'music-recommender', name: '音乐推荐', description: '歌曲推荐', icon: '🎵', category: '娱乐', enabled: false },
  { id: 'book-summarizer', name: '书籍解读', description: '快速阅读', icon: '📚', category: '娱乐', enabled: false },
  { id: 'recipe-generator', name: '食谱生成', description: '美食菜谱', icon: '🍳', category: '娱乐', enabled: false },
  { id: 'travel-planner', name: '旅行规划', description: '行程安排', icon: '✈️', category: '娱乐', enabled: false },
  { id: 'fitness-coaching', name: '健身指导', description: '运动计划', icon: '💪', category: '娱乐', enabled: false },
  { id: 'horoscope', name: '星座运势', description: '每日运势', icon: '🔮', category: '娱乐', enabled: false },
  { id: 'joke-generator', name: '笑话生成', description: '趣味幽默', icon: '😂', category: '娱乐', enabled: false },
];

export const modelProviders: ModelProvider[] = [
  { id: 'openai', name: 'OpenAI', logo: '🤖', color: '#10a37f', models: [
    { id: 'gpt-4o', name: 'GPT-4o', description: '最新旗舰', contextWindow: '128K', pricing: '$10/M', supportsVision: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '高效低价', contextWindow: '128K', pricing: '$0.15/M', supportsVision: true },
    { id: 'gpt-4.1', name: 'GPT-4.1', description: '最新版本', contextWindow: '128K', pricing: '$2/M', supportsVision: true },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: '高效版本', contextWindow: '128K', pricing: '$0.4/M', supportsVision: true },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', description: '超高速', contextWindow: '128K', pricing: '$0.1/M', supportsVision: true },
  ]},
  { id: 'anthropic', name: 'Anthropic', logo: '🧠', color: '#d97757', models: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: '最新旗舰', contextWindow: '200K', pricing: '$3/M', supportsVision: true },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', description: '顶级性能', contextWindow: '200K', pricing: '$15/M', supportsVision: true },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: '高性价比', contextWindow: '200K', pricing: '$3/M', supportsVision: true },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: '快速响应', contextWindow: '200K', pricing: '$0.25/M', supportsVision: true },
  ]},
  { id: 'google', name: 'Google', logo: '🔴', color: '#4285f4', models: [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: '最新旗舰', contextWindow: '1M', pricing: '$0', supportsVision: true },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0', description: '高速版本', contextWindow: '1M', pricing: '$0', supportsVision: true },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '专业版本', contextWindow: '128K', pricing: '$1.25/M', supportsVision: true },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: '快速版本', contextWindow: '128K', pricing: '$0.075/M', supportsVision: true },
  ]},
  { id: 'qwen', name: '通义千问', logo: '🐉', color: '#615ef0', models: [
    { id: 'qwen3-30b-a3b', name: 'Qwen3 30B A3B', description: '最新旗舰', contextWindow: '32K', pricing: '免费' },
    { id: 'qwen2.5-72b-instruct', name: 'Qwen2.5 72B', description: '大参数版本', contextWindow: '32K', pricing: '免费' },
    { id: 'qwen2.5-14b-instruct', name: 'Qwen2.5 14B', description: '中等参数', contextWindow: '32K', pricing: '免费' },
    { id: 'qwen2.5-7b-instruct', name: 'Qwen2.5 7B', description: '轻量版本', contextWindow: '32K', pricing: '免费' },
  ]},
  { id: 'zhipu', name: '智谱AI', logo: '🔵', color: '#3b82f6', models: [
    { id: 'glm-4-plus', name: 'GLM-4 Plus', description: '最新旗舰', contextWindow: '128K', pricing: '¥1/1M', supportsVision: true },
    { id: 'glm-4-vision', name: 'GLM-4V Plus', description: '视觉版本', contextWindow: '128K', pricing: '¥1/1M', supportsVision: true },
    { id: 'glm-4-flash', name: 'GLM-4 Flash', description: '快速版本', contextWindow: '128K', pricing: '¥0.1/1M', supportsVision: true },
  ]},
  { id: 'minimax', name: 'MiniMax', logo: '⭐', color: '#10b981', models: [
    { id: 'abab6.5s-chat', name: 'Abab 6.5s', description: '最新旗舰', contextWindow: '245K', pricing: '¥1/1M' },
    { id: 'abab6.5g-chat', name: 'Abab 6.5g', description: '高速版本', contextWindow: '245K', pricing: '¥1/1M' },
  ]},
  { id: 'deepseek', name: 'DeepSeek', logo: '🔮', color: '#4f46e5', models: [
    { id: 'deepseek-chat', name: 'DeepSeek V3', description: '最新旗舰', contextWindow: '64K', pricing: '¥0.5/1M' },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1', description: '推理模型', contextWindow: '64K', pricing: '¥1/1M' },
  ]},
  { id: 'ollama', name: 'Ollama', logo: '🦙', color: '#f5f5f5', models: [
    { id: 'llama3.3:latest', name: 'Llama 3.3', description: '最新开源旗舰', contextWindow: '128K', pricing: '本地免费' },
    { id: 'llama3.1:70b', name: 'Llama 3.1 70B', description: '大参数版本', contextWindow: '128K', pricing: '本地免费' },
    { id: 'qwen2.5:14b', name: 'Qwen 2.5 14B', description: '中等参数', contextWindow: '32K', pricing: '本地免费' },
  ]},
  { id: 'vllm', name: 'vLLM', logo: '⚡', color: '#7c3aed', models: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', description: '开源旗舰', contextWindow: '128K', pricing: '本地免费' },
    { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B', description: '大参数版本', contextWindow: '32K', pricing: '本地免费' },
  ]},
];

// Simulated responses for fallback
const simulatedResponses = {
  default: [
    '我理解你的问题。让我来分析一下...',
    '这是一个很好的问题！让我来详细解答...',
    '根据我的理解，你可以尝试以下方法...',
    '我来帮你分析这个问题。首先需要考虑几个方面...',
  ]
};

// Create the store with persist middleware for config
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth - simplified demo
      user: null,
      isLoggedIn: false,
  authMode: 'login',
login: (_email, _password) => {
    set({ user: { id: '1', username: 'Demo', email: _email, avatar: 'D', createdAt: new Date().toISOString() }, isLoggedIn: true });
    return true;
  },
  register: (username, email, _password) => {
    set({ user: { id: '1', username, email, avatar: username[0].toUpperCase(), createdAt: new Date().toISOString() }, isLoggedIn: true });
    return true;
  },
  logout: () => set({ user: null, isLoggedIn: false, conversations: [], activeConversationId: null }),
  setAuthMode: (mode) => set({ authMode: mode }),

  // Navigation
  currentPage: 'chat',
  setCurrentPage: (page) => set({ currentPage: page }),

  // Conversations
  conversations: [],
  activeConversationId: null,
  createConversation: (agentId) => {
    const id = 'conv_' + Math.random().toString(36).slice(2, 10);
    const agent = agentId ? get().agents.find(a => a.id === agentId) || null : null;
    const newConv: Conversation = {
      id,
      title: agent ? agent.name : '新对话',
      messages: [],
      model: get().selectedModel,
      provider: get().selectedProvider,
      agentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set(s => ({ 
      conversations: [newConv, ...s.conversations], 
      activeConversationId: id,
      activeAgent: agent,
      currentPage: 'chat' as Page
    }));
    return id;
  },
  setActiveConversation: (id) => set({ activeConversationId: id }),
  deleteConversation: (id) => set(s => {
    const convs = s.conversations.filter(c => c.id !== id);
    return { conversations: convs, activeConversationId: s.activeConversationId === id ? (convs[0]?.id || null) : s.activeConversationId };
  }),
  
  // Real LLM integration with Ollama
  addMessage: async (conversationId, message) => {
    const id = Math.random().toString(36).slice(2, 10);
    const fullMessage: Message = { ...message, id, timestamp: Date.now() };
    
    set(s => ({
      conversations: s.conversations.map(c =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, fullMessage], title: c.messages.length === 0 && message.role === 'user' ? message.content.slice(0, 30) + '...' : c.title, updatedAt: Date.now() }
          : c
      ),
    }));

    // If user message, call Ollama API
    if (message.role === 'user') {
      set({ isGenerating: true });
      
      const state = get();
      const { selectedProvider, selectedModel, ollamaEndpoint, conversations, agents } = state;
      const currentModel = selectedModel;
      
      try {
        const conversation = conversations.find(c => c.id === conversationId);
        
        if (!conversation) {
          throw new Error('Conversation not found');
        }

        // Get agent if conversation has agentId, or use activeAgent from state as fallback
        const agent = conversation.agentId ? agents.find(a => a.id === conversation.agentId) : (state.activeAgent || null);
        
        // Convert messages to Ollama format
        const ollamaMessages: OllamaMessage[] = [];
        
        // Add agent's system prompt as first message if exists
        if (agent) {
          ollamaMessages.push({ role: 'system', content: agent.systemPrompt });
        }
        
        // Add existing conversation messages
        conversation.messages.forEach(m => {
          ollamaMessages.push({ role: m.role, content: m.content });
        });
        
        // Add current user message
        ollamaMessages.push({ role: 'user', content: message.content });

        let responseContent = '';

        // Check if using Ollama
        if (selectedProvider === 'ollama') {
          const ollama = getOllamaService(ollamaEndpoint);
          ollama.setDefaultModel(selectedModel);
          
          // Use streaming for real-time response
          const stream = ollama.streamChat(ollamaMessages);
          
          // Create placeholder for streaming response
          const aiId = Math.random().toString(36).slice(2, 10);
          const placeholderMessage: Message = {
            id: aiId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            model: selectedModel,
          };
          
          // Add placeholder message
          set(s => ({
            conversations: s.conversations.map(c =>
              c.id === conversationId
                ? { ...c, messages: [...c.messages, placeholderMessage] }
                : c
            ),
          }));

          // Stream the response
          for await (const chunk of stream) {
            responseContent += chunk;
            // Update message in real-time
            set(s => ({
              conversations: s.conversations.map(c =>
                c.id === conversationId
                  ? {
                      ...c,
                      messages: c.messages.map(m =>
                        m.id === aiId ? { ...m, content: responseContent } : m
                      )
                    }
                  : c
              ),
            }));
          }
        } else {
          // For non-Ollama providers, use simulated response
          const responses = simulatedResponses.default;
          responseContent = responses[Math.floor(Math.random() * responses.length)];
          
          const aiId = Math.random().toString(36).slice(2, 10);
          const aiMessage: Message = {
            id: aiId,
            role: 'assistant',
            content: responseContent,
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
          return;
        }
        
        set({ isGenerating: false });
      } catch (error) {
        console.error('LLM API error:', error);
        
        // Add error message
        const errorId = Math.random().toString(36).slice(2, 10);
        const errorMessage: Message = {
          id: errorId,
          role: 'assistant',
          content: `抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}\n\n请检查 Ollama 是否正在运行，或者尝试切换到其他模型。`,
          timestamp: Date.now(),
          model: currentModel,
        };
        
        set(s => ({
          conversations: s.conversations.map(c =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, errorMessage] }
              : c
          ),
          isGenerating: false,
        }));
      }
    }
  },

  // Folders
  folders: [],
  createFolder: (name, color = '#6366f1') => {
    const id = 'folder_' + Math.random().toString(36).slice(2, 10);
    const folder: ChatFolder = { id, name, color, createdAt: Date.now(), updatedAt: Date.now() };
    set(s => ({ folders: [...s.folders, folder] }));
    return id;
  },
  deleteFolder: (id) => set(s => ({ folders: s.folders.filter(f => f.id !== id) })),
  updateFolder: (id, updates) => set(s => ({ folders: s.folders.map(f => f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f) })),
  moveToFolder: (conversationId, folderId) => set(s => ({ conversations: s.conversations.map(c => c.id === conversationId ? { ...c, folderId } : c) })),

  // Pins
  pinConversation: (id) => set(s => ({ conversations: s.conversations.map(c => c.id === id ? { ...c, pinned: true } : c) })),
  unpinConversation: (id) => set(s => ({ conversations: s.conversations.map(c => c.id === id ? { ...c, pinned: false } : c) })),

  // Models
  selectedProvider: 'ollama',
  selectedModel: 'llama3.3:latest',
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
  ollamaModels: [],
  setOllamaModels: (models) => set({ ollamaModels: models }),

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
  toggleSkill: (skillId) => set(s => ({ skills: s.skills.map(s => s.id === skillId ? { ...s, enabled: !s.enabled } : s) })),

  // UI
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),

  // Theme
  theme: 'midnight',
  setTheme: (theme) => set({ theme }),
}), {
  name: 'nexusai-config',
  storage: createJSONStorage(() => localStorage),
  partialize: (state: AppState) => ({
    selectedProvider: state.selectedProvider,
    selectedModel: state.selectedModel,
    ollamaEndpoint: state.ollamaEndpoint,
    ollamaCustomModel: state.ollamaCustomModel,
    vllmEndpoint: state.vllmEndpoint,
    vllmCustomModel: state.vllmCustomModel,
    apiKeys: state.apiKeys,
    theme: state.theme,
  }),
}));
