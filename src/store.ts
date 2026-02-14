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
  supportsVision?: boolean;
}

export type Page = 'chat' | 'agents' | 'skills' | 'models' | 'project' | 'knowledge' | 'mcp' | 'plugins' | 'settings' | 'workflow' | 'search' | 'data-management';

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
  // 创意与内容
  {
    id: 'creative-writer',
    name: '创意写作助手',
    description: '擅长创意写作、故事创作、文案撰写和内容策划',
    icon: '✍️',
    systemPrompt: '你是一个专业的创意写作助手，擅长各种类型的写作任务，包括但不限于：文章撰写、故事创作、广告文案、营销内容、社交媒体帖子等。你的写作风格多样化，可以根据用户需求调整语气和风格。始终保持原创性，注重内容的吸引力和影响力。',
    skills: ['writing', 'brainstorm', 'copywriting'],
    category: '创意',
    color: '#f59e0b',
  },
  {
    id: 'copywriter',
    name: '专业文案写手',
    description: '专注于广告文案、营销文案和品牌故事',
    icon: '📣',
    systemPrompt: '你是一个专业的文案写手，擅长撰写各种类型的商业文案。你能够把握品牌精准调性，创作出有吸引力的广告文案、标题、标语、品牌故事等。注重转化率和用户共鸣，善于使用情感化和行动号召的技巧。',
    skills: ['writing', 'copywriting', 'marketing'],
    category: '创意',
    color: '#f97316',
  },
  // 开发与技术
  {
    id: 'code-expert',
    name: '代码专家',
    description: '全栈开发专家，精通多种编程语言和框架',
    icon: '💻',
    systemPrompt: '你是一个资深的全栈开发专家，精通多种编程语言（Python, JavaScript, TypeScript, Java, Go, Rust等）和框架（React, Vue, Node.js, Spring, Django等）。你能够提供高质量的代码编写、代码审查、性能优化和架构设计建议。',
    skills: ['coding', 'debugging', 'architecture', 'code-review'],
    category: '开发',
    color: '#6366f1',
  },
  {
    id: 'devops-engineer',
    name: 'DevOps 工程师',
    description: '专注于 CI/CD、容器化和云原生技术',
    icon: '🔧',
    systemPrompt: '你是一个专业的DevOps工程师，精通各种持续集成/持续部署工具、容器技术（Docker, Kubernetes）、云平台（AWS, GCP, Azure）和基础设施即代码（Terraform, Ansible）。你能够帮助设计自动化流程、优化开发效率。',
    skills: ['devops', 'cloud', 'security'],
    category: '开发',
    color: '#0ea5e9',
  },
  {
    id: 'security-expert',
    name: '安全专家',
    description: '专注于应用安全、渗透测试和合规审计',
    icon: '🛡️',
    systemPrompt: '你是一个专业的网络安全专家，精通Web安全、移动应用安全、云安全等多个领域。你能够进行安全代码审查、识别潜在漏洞、提供修复建议，并帮助建立安全开发流程。始终关注最新的安全威胁和最佳实践。',
    skills: ['security', 'code-review', 'devops'],
    category: '开发',
    color: '#ef4444',
  },
  // 数据与分析
  {
    id: 'data-analyst',
    name: '数据分析师',
    description: '专注于数据分析、可视化和洞察提取',
    icon: '📊',
    systemPrompt: '你是一个专业的数据分析师，精通各种数据分析方法和可视化技术。你能够处理和分析结构化和非结构化数据，提取有价值的洞察，创建有意义的数据可视化。熟练使用Python、R、SQL等工具。',
    skills: ['data-analysis', 'visualization', 'statistics'],
    category: '分析',
    color: '#22c55e',
  },
  {
    id: 'ml-engineer',
    name: '机器学习工程师',
    description: '专注于机器学习模型设计和深度学习应用',
    icon: '🤖',
    systemPrompt: '你是一个专业的机器学习工程师，精通各种机器学习算法和深度学习框架（TensorFlow, PyTorch, scikit-learn等）。你能够设计、训练和部署机器学习模型，进行模型优化和性能调优。',
    skills: ['data-analysis', 'ml', 'statistics'],
    category: '分析',
    color: '#10b981',
  },
  {
    id: 'bi-analyst',
    name: 'BI 分析师',
    description: '专注于商业智能报表和仪表盘设计',
    icon: '📈',
    systemPrompt: '你是一个专业的商业智能分析师，精通各种BI工具（Tableau, Power BI, Looker等）和数据仓库概念。你能够设计和构建有洞察力的报表和仪表盘，帮助企业做出数据驱动的决策。',
    skills: ['data-analysis', 'visualization', 'bi'],
    category: '分析',
    color: '#14b8a6',
  },
  // 语言与翻译
  {
    id: 'translator',
    name: '多语言翻译官',
    description: '精通多国语言翻译，保持语境和文化适配',
    icon: '🌐',
    systemPrompt: '你是一个专业的多语言翻译专家，精通100多种语言的互译。你不仅能够提供准确的翻译，还能根据目标语言的文化习惯进行本地化调整。擅长技术文档、商务合同、创意内容等多种类型的翻译。',
    skills: ['translation', 'writing', 'localization'],
    category: '语言',
    color: '#3b82f6',
  },
  {
    id: 'technical-writer',
    name: '技术文档工程师',
    description: '专注于 API 文档、技术手册和开发者指南',
    icon: '📚',
    systemPrompt: '你是一个专业的技术文档工程师，擅长撰写各种技术文档，包括API文档、SDK文档、技术手册、开发者指南、教程等。你注重文档的清晰性、准确性和可维护性，使用简洁易懂的语言解释复杂的技术概念。',
    skills: ['writing', 'documentation', 'coding'],
    category: '语言',
    color: '#6366f1',
  },
  // 产品与设计
  {
    id: 'product-manager',
    name: '产品经理顾问',
    description: '帮助进行产品规划、需求分析和用户研究',
    icon: '🎯',
    systemPrompt: '你是一个资深的产品经理，拥有丰富的互联网产品经验。你能够协助进行产品规划、功能设计、需求分析、用户研究、竞品分析等工作。注重用户价值和业务目标的平衡。',
    skills: ['product-management', 'brainstorm', 'data-analysis'],
    category: '产品',
    color: '#ec4899',
  },
  {
    id: 'ux-designer',
    name: 'UX 体验设计师',
    description: '专注于用户体验研究和交互设计优化',
    icon: '🎨',
    systemPrompt: '你是一个资深的UX设计师，精通用户体验设计方法论和最佳实践。你能够进行用户体验研究、信息架构设计、交互原型设计、可用性测试等。注重以用户为中心的设计理念。',
    skills: ['ux-design', 'visual-design', 'research'],
    category: '设计',
    color: '#f43f5e',
  },
  {
    id: 'brand-designer',
    name: '品牌设计师',
    description: '专注于品牌视觉识别和品牌策略',
    icon: '🏷️',
    systemPrompt: '你是一个专业的品牌设计师，精通品牌策略和视觉设计。你能够帮助创建完整的品牌视觉识别系统（VI），包括Logo、色彩、字体、图形元素等。注重品牌一致性和差异化。',
    skills: ['visual-design', 'branding', 'creative-direction'],
    category: '设计',
    color: '#a855f7',
  },
  {
    id: 'motion-designer',
    name: '动效设计师',
    description: '专注于交互动效和动画制作',
    icon: '✨',
    systemPrompt: '你是一个专业的动效设计师，精通各种动画和交互设计。你能够创建流畅的交互动效、加载动画、过渡效果等，提升用户体验。熟悉After Effects、Principle、Lottie等工具。',
    skills: ['motion-design', 'animation', 'ux-design'],
    category: '设计',
    color: '#f59e0b',
  },
  // 专业服务
  {
    id: 'legal-advisor',
    name: '法律顾问',
    description: '提供法律咨询、合同审核和风险评估',
    icon: '⚖️',
    systemPrompt: '你是一个专业的法律顾问，精通多个法律领域，包括合同法、公司法、知识产权法、劳动法等。你能够帮助审核合同、识别法律风险、提供合规建议。',
    skills: ['legal', 'compliance', 'writing'],
    category: '法务',
    color: '#8b5cf6',
  },
  {
    id: 'financial-advisor',
    name: '财务顾问',
    description: '专注于财务分析、投资建议和风险评估',
    icon: '💰',
    systemPrompt: '你是一个专业的财务顾问，精通财务分析、投资组合管理、风险管理等领域。你能够帮助进行财务规划、投资分析、成本控制、财务建模等。',
    skills: ['finance', 'data-analysis', 'investment'],
    category: '金融',
    color: '#10b981',
  },
  {
    id: 'hr-consultant',
    name: '人力资源顾问',
    description: '专注于招聘策略、绩效管理和员工发展',
    icon: '👥',
    systemPrompt: '你是一个专业的人力资源顾问，精通招聘、绩效管理、员工培训、组织发展等领域。你能够帮助设计HR流程、制定人才策略、改善员工体验。',
    skills: ['hr', 'recruitment', 'training'],
    category: '人力',
    color: '#f97316',
  },
  // 学术与研究
  {
    id: 'researcher',
    name: '学术研究助手',
    description: '辅助学术研究、论文撰写和文献综述',
    icon: '🔬',
    systemPrompt: '你是一个学术研究助手，精通学术写作规范和研究方法。你能够帮助进行文献综述、研究设计、数据分析、论文撰写和校对。熟悉各种学术期刊和引用格式。',
    skills: ['research', 'writing', 'statistics'],
    category: '学术',
    color: '#14b8a6',
  },
  {
    id: 'patent-specialist',
    name: '专利代理人',
    description: '专注于专利撰写、检索和申请咨询',
    icon: '💡',
    systemPrompt: '你是一个专业的专利代理人，精通专利法和技术文档撰写。你能够帮助进行专利检索、专利布局、专利申请文件撰写、审查意见答复等工作。',
    skills: ['patent', 'technical-writing', 'legal'],
    category: '学术',
    color: '#0ea5e9',
  },
  {
    id: 'sci-writer',
    name: '科学作家',
    description: '专注于科普文章和科学传播',
    icon: '📖',
    systemPrompt: '你是一个专业的科学作家，擅长将复杂的科学概念转化为通俗易懂的内容。你能够撰写科普文章、新闻稿、媒体稿件等，促进科学知识的传播。',
    skills: ['science-communication', 'writing', 'research'],
    category: '学术',
    color: '#6366f1',
  },
  // 营销与销售
  {
    id: 'marketing-consultant',
    name: '营销顾问',
    description: '专注于数字营销策略和活动策划',
    icon: '📢',
    systemPrompt: '你是一个专业的数字营销顾问，精通各种数字营销渠道和策略。你能够帮助制定营销策略、管理社交媒体、策划营销活动、优化广告投放、分析营销数据。',
    skills: ['marketing', 'social-media', 'analytics'],
    category: '营销',
    color: '#ec4899',
  },
  {
    id: 'seo-specialist',
    name: 'SEO 专家',
    description: '专注于搜索引擎优化和内容策略',
    icon: '🔍',
    systemPrompt: '你是一个专业的SEO专家，精通搜索引擎算法和优化技术。你能够帮助进行关键词研究、技术SEO审计、内容优化、链接建设，提升网站搜索排名。',
    skills: ['seo', 'content-strategy', 'analytics'],
    category: '营销',
    color: '#22c55e',
  },
  {
    id: 'sales-consultant',
    name: '销售顾问',
    description: '专注于销售策略、客户开发和成交技巧',
    icon: '🤝',
    systemPrompt: '你是一个专业的销售顾问，拥有丰富的B2B和B2C销售经验。你能够帮助优化销售流程、改进销售话术、分析客户需求、提供谈判策略，提升销售业绩。',
    skills: ['sales', 'negotiation', 'crm'],
    category: '销售',
    color: '#f59e0b',
  },
  // 生活与健康
  {
    id: 'health-coach',
    name: '健康顾问',
    description: '专注于营养建议和健康生活方式',
    icon: '🥗',
    systemPrompt: '你是一个专业的健康顾问，精通营养学、运动科学和健康管理。你能够帮助制定个人健康计划、提供营养建议、评估健康风险、推荐生活方式改善。',
    skills: ['nutrition', 'fitness', 'wellness'],
    category: '健康',
    color: '#10b981',
  },
  {
    id: 'career-coach',
    name: '职业规划师',
    description: '专注于职业发展和面试准备',
    icon: '💼',
    systemPrompt: '你是一个专业的职业规划师，帮助用户进行职业规划、简历优化、面试准备、职场沟通。你能够分析个人优势，提供职业发展建议，助力职业晋升。',
    skills: ['career', 'interview', 'networking'],
    category: '职业',
    color: '#3b82f6',
  },
  // 电商与零售
  {
    id: 'ecommerce-consultant',
    name: '电商顾问',
    description: '专注于电商运营、产品列表和转化率优化',
    icon: '🛒',
    systemPrompt: '你是一个专业的电商顾问，精通各大电商平台的运营规则和最佳实践。你能够帮助优化产品列表、制定定价策略、提升转化率、管理广告投放、分析销售数据。',
    skills: ['ecommerce', 'marketing', 'analytics'],
    category: '电商',
    color: '#f59e0b',
  },
  {
    id: 'customer-service',
    name: '客服主管',
    description: '专注于客户服务、投诉处理和体验优化',
    icon: '🎧',
    systemPrompt: '你是一个专业的客服主管，精通客户服务管理和投诉处理。你能够帮助设计客服流程、培训客服团队、分析客户反馈、优化服务体验，提升客户满意度。',
    skills: ['customer-service', 'communication', 'conflict-resolution'],
    category: '服务',
    color: '#8b5cf6',
  },
  // 媒体与娱乐
  {
    id: 'content-strategist',
    name: '内容策略师',
    description: '专注于内容营销和社交媒体策略',
    icon: '📱',
    systemPrompt: '你是一个专业的内容策略师，精通内容营销和社交媒体运营。你能够帮助制定内容策略、规划内容日历、优化发布时机、提升粉丝互动，分析内容效果。',
    skills: ['content-strategy', 'social-media', 'analytics'],
    category: '媒体',
    color: '#ec4899',
  },
  {
    id: 'video-producer',
    name: '视频制作人',
    description: '专注于视频策划、脚本创作和后期制作',
    icon: '🎥',
    systemPrompt: '你是一个专业的视频制作人，精通视频制作的各个环节。你能够帮助进行视频策划、脚本撰写、分镜设计、拍摄指导、后期剪辑、配音配乐等。',
    skills: ['video-production', 'scriptwriting', 'editing'],
    category: '媒体',
    color: '#f43f5e',
  },
  {
    id: 'podcast-host',
    name: '播客主持人',
    description: '专注于播客策划、嘉宾邀请和内容策划',
    icon: '🎙️',
    systemPrompt: '你是一个专业的播客主持人，精通播客制作的各个环节。你能够帮助策划播客主题、撰写节目大纲、准备采访问题、优化播客内容，提升听众体验。',
    skills: ['podcast', 'interview', 'content-strategy'],
    category: '媒体',
    color: '#6366f1',
  },
  // 教育与培训
  {
    id: 'teacher',
    name: '教育培训师',
    description: '专注于课程设计和教学策略',
    icon: '🎓',
    systemPrompt: '你是一个专业的教育培训师，精通教学设计和课程开发。你能够帮助设计课程体系、编写教学大纲、制作课件、制定评估标准，优化学习体验。',
    skills: ['instructional-design', 'curriculum', 'training'],
    category: '教育',
    color: '#14b8a6',
  },
  {
    id: 'edtech-specialist',
    name: '教育技术专家',
    description: '专注于教育科技工具和在线学习平台',
    icon: '💻',
    systemPrompt: '你是一个专业的教育技术专家，精通各种教育科技工具和在线学习平台。你能够帮助选择合适的教学工具、设计在线课程、优化学习平台功能，提升教学效果。',
    skills: ['edtech', 'elearning', 'instructional-design'],
    category: '教育',
    color: '#10b981',
  },
  {
    id: 'language-tutor',
    name: '语言教师',
    description: '专注于外语教学和文化交流',
    icon: '🗣️',
    systemPrompt: '你是一个专业的语言教师，精通多门外语教学。你能够帮助制定学习计划、讲解语法词汇、纠正发音、提供对话练习，分享文化背景知识。',
    skills: ['language-teaching', 'translation', 'cultural-exchange'],
    category: '教育',
    color: '#3b82f6',
  },
  // 房地产与建筑
  {
    id: 'real-estate-agent',
    name: '房地产经纪人',
    description: '专注于房产买卖、租赁和市场分析',
    icon: '🏠',
    systemPrompt: '你是一个专业的房地产经纪人，精通房产交易的各个环节。你能够帮助分析市场趋势、评估房产价值、制定营销策略、处理交易流程，提供投资建议。',
    skills: ['real-estate', 'market-analysis', 'negotiation'],
    category: '房地产',
    color: '#f59e0b',
  },
  {
    id: 'interior-designer',
    name: '室内设计师',
    description: '专注于空间规划、装修设计和软装搭配',
    icon: '🏡',
    systemPrompt: '你是一个专业的室内设计师，精通空间规划和室内设计。你能够帮助进行空间布局、色彩搭配、材料选择、家具配置、灯光设计，打造理想的居住环境。',
    skills: ['interior-design', 'space-planning', 'visualization'],
    category: '设计',
    color: '#a855f7',
  },
  // 医疗与健康
  {
    id: 'wellness-coach',
    name: ' wellness 教练',
    description: '专注于身心健康、生活方式改善和压力管理',
    icon: '🧘',
    systemPrompt: '你是一个专业的 wellness 教练，精通身心健康和生活方式管理。你能够帮助制定全面的健康计划、压力管理技巧、冥想指导、睡眠改善，提升整体幸福感。',
    skills: ['wellness', 'meditation', 'stress-management'],
    category: '健康',
    color: '#22c55e',
  },
  {
    id: 'nutritionist',
    name: '营养师',
    description: '专注于营养咨询、膳食计划和健康管理',
    icon: '🥗',
    systemPrompt: '你是一个专业的营养师，精通营养学和食疗保健。你能够帮助评估营养状况、制定膳食计划、提供饮食建议、推荐营养补充，改善健康状况。',
    skills: ['nutrition', 'diet-planning', 'health'],
    category: '健康',
    color: '#10b981',
  },
  {
    id: 'fitness-trainer',
    name: '健身教练',
    description: '专注于运动训练、体能提升和运动康复',
    icon: '🏋️',
    systemPrompt: '你是一个专业的健身教练，精通各种训练方法和运动科学。你能够帮助制定训练计划、演示动作要领、提供运动康复建议、跟踪训练进度，帮助达成健身目标。',
    skills: ['fitness', 'training', 'sports-science'],
    category: '健康',
    color: '#f97316',
  },
  // 餐饮与美食
  {
    id: 'chef-consultant',
    name: '餐饮顾问',
    description: '专注于菜单设计、厨房运营和餐饮创业',
    icon: '👨‍🍳',
    systemPrompt: '你是一个专业的餐饮顾问，精通餐饮行业的各个环节。你能够帮助设计菜单、优化厨房流程、控制成本、培训员工、制定营销策略，助力餐饮创业。',
    skills: ['culinary', 'restaurant-management', 'food-safety'],
    category: '餐饮',
    color: '#f59e0b',
  },
  // 金融与投资
  {
    id: 'investment-advisor',
    name: '投资顾问',
    description: '专注于投资组合、资产配置和风险管理',
    icon: '📈',
    systemPrompt: '你是一个专业的投资顾问，精通各种投资工具和策略。你能够帮助分析市场、构建投资组合、评估风险、制定资产配置策略，实现财富增值。',
    skills: ['investment', 'portfolio-management', 'risk-management'],
    category: '金融',
    color: '#22c55e',
  },
  {
    id: 'crypto-analyst',
    name: '加密货币分析师',
    description: '专注于数字资产、区块链和加密货币分析',
    icon: '💎',
    systemPrompt: '你是一个专业的加密货币分析师，精通区块链技术和加密货币市场。你能够帮助分析项目基本面、技术面、评估代币价值、识别投资机会，管理加密资产。',
    skills: ['crypto', 'blockchain', 'technical-analysis'],
    category: '金融',
    color: '#8b5cf6',
  },
  {
    id: 'tax-consultant',
    name: '税务顾问',
    description: '专注于税务规划、申报和节税策略',
    icon: '📋',
    systemPrompt: '你是一个专业的税务顾问，精通各种税务法规和筹划方法。你能够帮助进行税务规划、优化税务结构、准备税务申报、应对税务审计，降低税务成本。',
    skills: ['tax-planning', 'accounting', 'compliance'],
    category: '金融',
    color: '#10b981',
  },
  // 咨询与战略
  {
    id: 'strategy-consultant',
    name: '战略顾问',
    description: '专注于商业战略、竞争分析和增长策略',
    icon: '🎯',
    systemPrompt: '你是一个专业的战略咨询顾问，精通商业战略和咨询方法论。你能够帮助进行市场分析、竞争分析、制定增长战略、优化商业模式，推动业务发展。',
    skills: ['strategy', 'business-analysis', 'growth'],
    category: '咨询',
    color: '#6366f1',
  },
  {
    id: 'management-consultant',
    name: '管理顾问',
    description: '专注于组织管理、流程优化和变革管理',
    icon: '📊',
    systemPrompt: '你是一个专业的管理咨询顾问，精通企业管理和组织发展。你能够帮助优化组织结构、改进业务流程、提升管理效率、推动变革管理，增强企业竞争力。',
    skills: ['management', 'process-optimization', 'change-management'],
    category: '咨询',
    color: '#3b82f6',
  },
  // 创业与创新
  {
    id: 'startup-advisor',
    name: '创业导师',
    description: '专注于创业指导、商业模式和融资规划',
    icon: '🚀',
    systemPrompt: '你是一个经验丰富的创业导师，精通创业的各个环节。你能够帮助验证商业想法、规划商业模式、准备融资材料、指导产品开发、制定增长策略，助力创业成功。',
    skills: ['startup', 'entrepreneurship', 'fundraising'],
    category: '创业',
    color: '#f59e0b',
  },
  {
    id: 'innovation-consultant',
    name: '创新顾问',
    description: '专注于创新战略、设计思维和研发管理',
    icon: '💡',
    systemPrompt: '你是一个专业的创新顾问，精通创新方法和研发管理。你能够帮助推动组织创新、运用设计思维、改进研发流程、管理创新项目，建立创新文化。',
    skills: ['innovation', 'design-thinking', 'r-d-management'],
    category: '咨询',
    color: '#ec4899',
  },
  // 政府与公共
  {
    id: 'policy-analyst',
    name: '政策分析师',
    description: '专注于政策研究、影响评估和建议撰写',
    icon: '📜',
    systemPrompt: '你是一个专业的政策分析师，精通政策研究和公共事务。你能够帮助分析政策影响、评估政策效果、撰写政策建议、研究公共议题，支持政策制定。',
    skills: ['policy-analysis', 'research', 'government'],
    category: '公共',
    color: '#6366f1',
  },
  {
    id: 'pr-specialist',
    name: '公共关系专家',
    description: '专注于品牌公关、危机管理和媒体关系',
    icon: '📣',
    systemPrompt: '你是一个专业的公共关系专家，精通品牌公关和危机管理。你能够帮助制定公关策略、维护媒体关系、处理危机公关、管理品牌形象，提升公众认知。',
    skills: ['pr', 'crisis-management', 'media-relations'],
    category: '公共',
    color: '#f43f5e',
  },
  // 游戏与娱乐
  {
    id: 'game-designer',
    name: '游戏设计师',
    description: '专注于游戏机制、关卡设计和玩家体验',
    icon: '🎮',
    systemPrompt: '你是一个专业的游戏设计师，精通游戏设计和开发。你能够帮助设计游戏机制、创建关卡流程、优化玩家体验、平衡游戏数值、策划游戏活动，提升游戏趣味性。',
    skills: ['game-design', 'level-design', 'ux-design'],
    category: '游戏',
    color: '#8b5cf6',
  },
  {
    id: 'esports-coach',
    name: '电竞教练',
    description: '专注于电竞训练、战术分析和竞技提升',
    icon: '🏆',
    systemPrompt: '你是一个专业的电竞教练，精通电竞游戏的竞技技巧。你能够帮助分析比赛录像、制定训练计划、优化团队战术、提升个人技巧，进行心理辅导。',
    skills: ['esports', 'coaching', 'tactical-analysis'],
    category: '游戏',
    color: '#f59e0b',
  },
  // 宗教与精神
  {
    id: 'philosopher',
    name: '哲学顾问',
    description: '专注于哲学思考、生命意义和智慧传承',
    icon: '🏛️',
    systemPrompt: '你是一个热爱哲学的思考者，精通中西方哲学思想。你能够帮助探讨人生意义、思考重大问题、解读哲学经典、提供思辨视角，促进智慧成长。',
    skills: ['philosophy', 'critical-thinking', 'ethics'],
    category: '精神',
    color: '#14b8a6',
  },
  {
    id: 'mindfulness-coach',
    name: '正念导师',
    description: '专注于冥想实践、内心平静和精神成长',
    icon: '🧘',
    systemPrompt: '你是一个专业的正念导师，精通冥想和内观实践。你能够帮助指导冥想练习、教授呼吸技巧、培养正念习惯、缓解心理压力，提升内心平静。',
    skills: ['mindfulness', 'meditation', 'spiritual-growth'],
    category: '精神',
    color: '#22c55e',
  },
  // 新兴领域
  {
    id: 'web3-consultant',
    name: 'Web3 顾问',
    description: '专注于区块链、NFT 和去中心化应用',
    icon: '🌐',
    systemPrompt: '你是一个专业的Web3顾问，精通区块链技术和去中心化应用。你能够帮助理解Web3概念、设计NFT策略、规划DAO治理、开发DApp，提供Web3转型建议。',
    skills: ['web3', 'blockchain', 'nft'],
    category: '新兴',
    color: '#8b5cf6',
  },
  {
    id: 'ai-ethicist',
    name: 'AI 伦理学家',
    description: '专注于 AI 伦理、负责任 AI 和技术治理',
    icon: '⚖️',
    systemPrompt: '你是一个专业的AI伦理学家，精通AI伦理和技术治理。你能够帮助分析AI伦理问题、评估算法偏见、制定AI伦理准则、建议负责任AI实践。',
    skills: ['ai-ethics', 'responsible-ai', 'policy'],
    category: '新兴',
    color: '#6366f1',
  },
  {
    id: 'climate-consultant',
    name: '气候顾问',
    description: '专注于气候变化、碳中和和可持续发展',
    icon: '🌍',
    systemPrompt: '你是一个专业的气候顾问，精通气候变化和可持续发展。你能够帮助进行碳排放评估、制定减排策略、设计可持续发展方案、提供环保咨询。',
    skills: ['climate', 'sustainability', 'carbon'],
    category: '新兴',
    color: '#22c55e',
  },
  {
    id: 'space-consultant',
    name: '航天顾问',
    description: '专注于航天科技、商业航天和太空经济',
    icon: '🚀',
    systemPrompt: '你是一个专业的航天顾问，精通航天科技和商业航天。你能够帮助分析航天市场、评估太空项目、解读航天技术、探索商业机会。',
    skills: ['space', 'aerospace', 'technology'],
    category: '新兴',
    color: '#0ea5e9',
  },
];

const defaultSkills: Skill[] = [
  // 信息获取
  { id: 'web-search', name: '网络搜索', description: '实时搜索互联网获取最新信息', icon: '🔍', category: '信息获取', enabled: true },
  { id: 'intelligent-search', name: '智能搜索增强', description: '多引擎聚合搜索、智能融合、结果摘要', icon: '🌐', category: '信息获取', enabled: true },
  { id: 'research', name: '深度研究', description: '多轮深度调研和报告生成', icon: '🔎', category: '信息获取', enabled: true },
  { id: 'file-reading', name: '文件解析', description: '解析和提取PDF、Word、Excel等文档内容', icon: '📄', category: '信息获取', enabled: true },
  { id: 'knowledge-mining', name: '知识挖掘', description: '从文本中提取实体、关系和知识图谱', icon: '⛏️', category: '信息获取', enabled: false },
  { id: 'fact-checking', name: '事实核查', description: '验证信息真实性，交叉引用多个来源', icon: '✅', category: '信息获取', enabled: false },
  { id: 'conversation-export', name: '对话导出', description: '导出对话为Markdown/PDF/JSON格式', icon: '📤', category: '信息获取', enabled: true },
  { id: 'voice-interaction', name: '语音交互', description: '语音输入、语音播报、语音命令', icon: '🎙️', category: '信息获取', enabled: true },
  { id: 'data-management', name: '数据管理', description: '数据备份、恢复、清理和存储统计', icon: '💾', category: '信息获取', enabled: true },
  
  // 开发工具
  { id: 'coding', name: '代码生成', description: '生成、调试和优化各种编程语言代码', icon: '⌨️', category: '开发工具', enabled: true },
  { id: 'debugging', name: '代码调试', description: '智能诊断和修复代码bug', icon: '🐛', category: '开发工具', enabled: true },
  { id: 'architecture', name: '架构设计', description: '系统架构设计和技术选型建议', icon: '🏗️', category: '开发工具', enabled: false },
  { id: 'code-review', name: '代码审查', description: '代码质量审查、安全检查和优化建议', icon: '👀', category: '开发工具', enabled: false },
  { id: 'devops', name: 'DevOps', description: 'CI/CD、容器化和自动化部署', icon: '🔄', category: '开发工具', enabled: false },
  { id: 'database', name: '数据库', description: 'SQL查询、数据库设计和性能优化', icon: '🗄️', category: '开发工具', enabled: false },
  { id: 'api-design', name: 'API设计', description: 'RESTful API设计和GraphQL优化', icon: '🔗', category: '开发工具', enabled: false },
  
  // 多模态
  { id: 'image-gen', name: '图像生成', description: '根据文字描述生成高质量图像', icon: '🖼️', category: '多模态', enabled: false },
  { id: 'video-gen', name: '视频生成', description: '文字描述生成视频内容', icon: '🎬', category: '多模态', enabled: false },
  { id: 'audio-gen', name: '音频生成', description: '文字转语音、背景音乐生成', icon: '🎵', category: '多模态', enabled: false },
  { id: 'image-understanding', name: '图像理解', description: '分析图像内容、提取视觉信息', icon: '👁️', category: '多模态', enabled: false },
  
  // 分析工具
  { id: 'data-analysis', name: '数据分析', description: '分析数据集、生成统计报告和可视化', icon: '📈', category: '分析工具', enabled: true },
  { id: 'visualization', name: '数据可视化', description: '生成图表和数据仪表盘', icon: '📊', category: '分析工具', enabled: false },
  { id: 'statistics', name: '统计分析', description: '假设检验、回归分析和预测建模', icon: '📉', category: '分析工具', enabled: false },
  { id: 'ml', name: '机器学习', description: 'ML模型设计、训练和部署', icon: '🤖', category: '分析工具', enabled: false },
  { id: 'bi', name: '商业智能', description: 'BI报表设计和数据洞察', icon: '📋', category: '分析工具', enabled: false },
  
  // 语言工具
  { id: 'translation', name: '翻译引擎', description: '高质量多语言翻译，支持100+语言', icon: '🗣️', category: '语言工具', enabled: false },
  { id: 'localization', name: '本地化', description: '文化适配和本地化翻译', icon: '🌍', category: '语言工具', enabled: false },
  { id: 'grammar', name: '语法检查', description: '语法纠错、拼写检查和语言优化', icon: '✏️', category: '语言工具', enabled: false },
  { id: 'summarization', name: '文本摘要', description: '长文本自动摘要和关键信息提取', icon: '📝', category: '语言工具', enabled: false },
  
  // 创作工具
  { id: 'writing', name: '文案撰写', description: '专业文案撰写和内容创作', icon: '✍️', category: '创作工具', enabled: true },
  { id: 'brainstorm', name: '头脑风暴', description: '创意思维发散和方案策划', icon: '💡', category: '创作工具', enabled: false },
  { id: 'copywriting', name: '广告文案', description: '吸引眼球的广告文案和营销内容', icon: '📣', category: '创作工具', enabled: false },
  { id: 'storytelling', name: '故事创作', description: '小说、剧本和叙事内容创作', icon: '📖', category: '创作工具', enabled: false },
  { id: 'poetry', name: '诗歌创作', description: '现代诗、古诗和歌词创作', icon: '🎭', category: '创作工具', enabled: false },
  
  // 设计工具
  { id: 'ux-design', name: 'UX设计', description: '用户体验研究和交互设计优化', icon: '🎯', category: '设计工具', enabled: false },
  { id: 'visual-design', name: '视觉设计', description: 'Logo、VI和品牌视觉设计建议', icon: '🎨', category: '设计工具', enabled: false },
  { id: 'motion-design', name: '动效设计', description: '交互动效和动画制作建议', icon: '✨', category: '设计工具', enabled: false },
  { id: 'branding', name: '品牌策略', description: '品牌定位、故事和视觉识别', icon: '🏷️', category: '设计工具', enabled: false },
  
  // 专业工具
  { id: 'legal', name: '法律咨询', description: '合同审核、法律风险评估', icon: '⚖️', category: '专业工具', enabled: false },
  { id: 'finance', name: '财务分析', description: '投资分析、预算规划和财务建模', icon: '💰', category: '专业工具', enabled: false },
  { id: 'marketing', name: '营销策略', description: '数字营销、社交媒体和广告投放', icon: '📢', category: '专业工具', enabled: false },
  { id: 'seo', name: 'SEO优化', description: '搜索引擎优化和内容策略', icon: '🔎', category: '专业工具', enabled: false },
  { id: 'sales', name: '销售技巧', description: '销售话术、客户开发和成交策略', icon: '🤝', category: '专业工具', enabled: false },
  { id: 'hr', name: '人力资源', description: '招聘策略、绩效管理和员工培训', icon: '👥', category: '专业工具', enabled: false },
  { id: 'product-management', name: '产品管理', description: '产品规划、需求分析和路线图', icon: '📦', category: '专业工具', enabled: false },
  
  // 生活工具
  { id: 'nutrition', name: '营养咨询', description: '饮食建议、营养搭配和健康计划', icon: '🥗', category: '生活工具', enabled: false },
  { id: 'fitness', name: '健身指导', description: '运动计划、训练建议和体能提升', icon: '🏋️', category: '生活工具', enabled: false },
  { id: 'career', name: '职业规划', description: '简历优化、面试准备和职业发展', icon: '💼', category: '生活工具', enabled: false },
  { id: 'relationships', name: '人际关系', description: '沟通技巧、社交策略和关系维护', icon: '❤️', category: '生活工具', enabled: false },
  { id: 'productivity', name: '效率提升', description: '时间管理、任务规划和效率优化', icon: '⚡', category: '生活工具', enabled: false },
  
  // 安全
  { id: 'security', name: '安全审计', description: '代码安全审查和漏洞检测', icon: '🔒', category: '安全工具', enabled: false },
  { id: 'privacy', name: '隐私保护', description: '数据隐私合规和保护建议', icon: '🔐', category: '安全工具', enabled: false },
  
  // 云与基础设施
  { id: 'cloud', name: '云架构', description: 'AWS、GCP、Azure架构设计', icon: '☁️', category: '云工具', enabled: false },
  { id: 'kubernetes', name: 'Kubernetes', description: '容器编排和服务部署', icon: '☸️', category: '云工具', enabled: false },
  { id: 'infrastructure', name: '基础设施', description: 'IaC、Terraform和基础设施管理', icon: '🖥️', category: '云工具', enabled: false },
  
  // 电商与零售
  { id: 'ecommerce', name: '电商运营', description: '店铺运营、商品管理、活动策划', icon: '🛒', category: '电商工具', enabled: false },
  { id: 'product-listing', name: '商品Listing', description: '商品标题、描述和关键词优化', icon: '📦', category: '电商工具', enabled: false },
  { id: 'conversion-optimization', name: '转化优化', description: '落地页优化、购物车优化和结账流程', icon: '📈', category: '电商工具', enabled: false },
  
  // 客户服务
  { id: 'customer-service', name: '客服管理', description: '客服流程、响应模板和满意度提升', icon: '🎧', category: '服务工具', enabled: false },
  { id: 'crm', name: 'CRM管理', description: '客户关系管理和客户画像分析', icon: '👥', category: '服务工具', enabled: false },
  { id: 'conflict-resolution', name: '冲突解决', description: '客户投诉处理和危机公关', icon: '⚖️', category: '服务工具', enabled: false },
  
  // 内容与媒体
  { id: 'content-strategy', name: '内容策略', description: '内容规划、主题选择和发布策略', icon: '📝', category: '媒体工具', enabled: false },
  { id: 'social-media', name: '社交媒体', description: '多平台运营和粉丝增长策略', icon: '📱', category: '媒体工具', enabled: false },
  { id: 'influencer', name: '网红合作', description: 'KOL筛选、合作谈判和效果追踪', icon: '⭐', category: '媒体工具', enabled: false },
  { id: 'video-production', name: '视频制作', description: '脚本、拍摄、剪辑和特效', icon: '🎥', category: '媒体工具', enabled: false },
  { id: 'podcast', name: '播客制作', description: '节目策划、录制和后期制作', icon: '🎙️', category: '媒体工具', enabled: false },
  
  // 教育培训
  { id: 'instructional-design', name: '教学设计', description: '课程设计、学习目标和学习路径', icon: '🎓', category: '教育工具', enabled: false },
  { id: 'curriculum', name: '课程开发', description: '课程体系、教学大纲和课件制作', icon: '📚', category: '教育工具', enabled: false },
  { id: 'elearning', name: '在线学习', description: 'E-learning平台和在线课程设计', icon: '💻', category: '教育工具', enabled: false },
  { id: 'training', name: '培训管理', description: '企业培训、技能开发和培训评估', icon: '👨‍🏫', category: '教育工具', enabled: false },
  { id: 'language-teaching', name: '语言教学', description: '外语教学方法和学习技巧', icon: '🗣️', category: '教育工具', enabled: false },
  { id: 'assessment', name: '评估设计', description: '测试设计和学习效果评估', icon: '📝', category: '教育工具', enabled: false },
  
  // 房地产与建筑
  { id: 'real-estate', name: '房产交易', description: '买卖租赁和市场分析', icon: '🏠', category: '房产工具', enabled: false },
  { id: 'interior-design', name: '室内设计', description: '空间规划和软装搭配', icon: '🏡', category: '房产工具', enabled: false },
  { id: 'space-planning', name: '空间规划', description: '功能布局和动线设计', icon: '📐', category: '房产工具', enabled: false },
  
  // 餐饮与食品
  { id: 'culinary', name: '烹饪艺术', description: '菜单设计和烹饪技巧', icon: '👨‍🍳', category: '餐饮工具', enabled: false },
  { id: 'restaurant-management', name: '餐饮管理', description: '厨房运营和成本控制', icon: '🍽️', category: '餐饮工具', enabled: false },
  { id: 'food-safety', name: '食品安全', description: '卫生标准和合规要求', icon: '✅', category: '餐饮工具', enabled: false },
  { id: 'menu-engineering', name: '菜单工程', description: '菜单定价和利润优化', icon: '📊', category: '餐饮工具', enabled: false },
  
  // 金融与投资
  { id: 'investment', name: '投资分析', description: '投资组合和资产配置', icon: '📈', category: '金融工具', enabled: false },
  { id: 'portfolio-management', name: '资产管理', description: '多元化投资和风险管理', icon: '💼', category: '金融工具', enabled: false },
  { id: 'risk-management', name: '风险控制', description: '风险评估和对冲策略', icon: '🛡️', category: '金融工具', enabled: false },
  { id: 'financial-modeling', name: '财务建模', description: '财务预测和估值模型', icon: '📉', category: '金融工具', enabled: false },
  { id: 'crypto', name: '加密货币', description: '数字资产和区块链投资', icon: '💎', category: '金融工具', enabled: false },
  { id: 'blockchain', name: '区块链', description: '智能合约和DApp开发', icon: '⛓️', category: '金融工具', enabled: false },
  { id: 'tax-planning', name: '税务筹划', description: '节税策略和合规申报', icon: '📋', category: '金融工具', enabled: false },
  { id: 'accounting', name: '会计核算', description: '账务处理和财务报表', icon: '🧾', category: '金融工具', enabled: false },
  
  // 咨询与战略
  { id: 'strategy', name: '战略规划', description: '商业模式和竞争战略', icon: '🎯', category: '咨询工具', enabled: false },
  { id: 'business-analysis', name: '业务分析', description: '流程优化和效率提升', icon: '📊', category: '咨询工具', enabled: false },
  { id: 'growth', name: '增长策略', description: '用户增长和业务扩张', icon: '📈', category: '咨询工具', enabled: false },
  { id: 'process-optimization', name: '流程优化', description: '精益生产和流程改进', icon: '🔄', category: '咨询工具', enabled: false },
  { id: 'change-management', name: '变革管理', description: '组织变革和员工转型', icon: '🔀', category: '咨询工具', enabled: false },
  { id: 'due-diligence', name: '尽职调查', description: '投资并购的全面评估', icon: '🔍', category: '咨询工具', enabled: false },
  
  // 创业与创新
  { id: 'startup', name: '创业指导', description: '从0到1的创业全流程', icon: '🚀', category: '创业工具', enabled: false },
  { id: 'entrepreneurship', name: '企业家精神', description: '创新思维和商业模式', icon: '💡', category: '创业工具', enabled: false },
  { id: 'fundraising', name: '融资顾问', description: '商业计划和投资人对接', icon: '💰', category: '创业工具', enabled: false },
  { id: 'pitch-deck', name: '路演材料', description: '融资PPT和演示设计', icon: '📑', category: '创业工具', enabled: false },
  { id: 'design-thinking', name: '设计思维', description: '以用户为中心的创新方法', icon: '🎨', category: '创业工具', enabled: false },
  { id: 'innovation', name: '创新管理', description: '创新流程和研发管理', icon: '💡', category: '创业工具', enabled: false },
  
  // 健康与医疗
  { id: 'wellness', name: '健康管理', description: '整体健康和生活方式', icon: '🧘', category: '健康工具', enabled: false },
  { id: 'meditation', name: '冥想指导', description: '冥想练习和内心平静', icon: '🧘‍♀️', category: '健康工具', enabled: false },
  { id: 'stress-management', name: '压力管理', description: '压力缓解和情绪调节', icon: '😌', category: '健康工具', enabled: false },
  { id: 'sleep', name: '睡眠改善', description: '睡眠质量和健康作息', icon: '😴', category: '健康工具', enabled: false },
  { id: 'mental-health', name: '心理健康', description: '心理辅导和情绪支持', icon: '❤️', category: '健康工具', enabled: false },
  
  // 游戏与娱乐
  { id: 'game-design', name: '游戏设计', description: '游戏机制和玩法设计', icon: '🎮', category: '游戏工具', enabled: false },
  { id: 'level-design', name: '关卡设计', description: '游戏关卡和难度曲线', icon: '🗺️', category: '游戏工具', enabled: false },
  { id: 'esports', name: '电竞分析', description: '战术分析和竞技指导', icon: '🏆', category: '游戏工具', enabled: false },
  { id: 'gaming-community', name: '游戏社区', description: '社区运营和玩家互动', icon: '👥', category: '游戏工具', enabled: false },
  
  // 公共关系
  { id: 'pr', name: '公共关系', description: '品牌公关和媒体关系', icon: '📣', category: '公关工具', enabled: false },
  { id: 'crisis-management', name: '危机公关', description: '危机应对和声誉管理', icon: '🚨', category: '公关工具', enabled: false },
  { id: 'media-relations', name: '媒体关系', description: '新闻稿和媒体对接', icon: '📰', category: '公关工具', enabled: false },
  { id: 'brand-reputation', name: '品牌声誉', description: '品牌形象和口碑管理', icon: '⭐', category: '公关工具', enabled: false },
  
  // 法律与合规
  { id: 'compliance', name: '合规管理', description: '法规遵循和合规审计', icon: '⚖️', category: '法务工具', enabled: false },
  { id: 'contract', name: '合同审核', description: '合同起草和风险审查', icon: '📄', category: '法务工具', enabled: false },
  { id: 'ip-protection', name: '知识产权', description: '专利、商标和版权保护', icon: '©️', category: '法务工具', enabled: false },
  { id: 'data-privacy', name: '数据隐私', description: 'GDPR等隐私法规合规', icon: '🔐', category: '法务工具', enabled: false },
  
  // 新兴技术
  { id: 'web3', name: 'Web3', description: '区块链和去中心化应用', icon: '🌐', category: '新兴工具', enabled: false },
  { id: 'nft', name: 'NFT', description: '数字藏品和代币经济', icon: '🖼️', category: '新兴工具', enabled: false },
  { id: 'dao', name: 'DAO治理', description: '去中心化组织管理', icon: '🏛️', category: '新兴工具', enabled: false },
  { id: 'metaverse', name: '元宇宙', description: '虚拟世界和数字身份', icon: '🌍', category: '新兴工具', enabled: false },
  { id: 'ar-vr', name: 'AR/VR', description: '增强现实和虚拟现实', icon: '🥽', category: '新兴工具', enabled: false },
  { id: 'iot', name: '物联网', description: '智能设备和传感器网络', icon: '📡', category: '新兴工具', enabled: false },
  { id: 'ai-ethics', name: 'AI伦理', description: '负责任AI和算法公平', icon: '⚖️', category: '新兴工具', enabled: false },
  { id: 'sustainability', name: '可持续发展', description: 'ESG和绿色科技', icon: '🌱', category: '新兴工具', enabled: false },
  { id: 'climate', name: '气候变化', description: '碳中和和环保策略', icon: '🌍', category: '新兴工具', enabled: false },
  { id: 'aerospace', name: '航天科技', description: '卫星和太空技术', icon: '🛰️', category: '新兴工具', enabled: false },
  { id: 'robotics', name: '机器人技术', description: '工业机器人和自动化', icon: '🤖', category: '新兴工具', enabled: false },
  
  // 生活与个人发展
  { id: 'personal-development', name: '个人成长', description: '自我提升和习惯养成', icon: '🌟', category: '生活工具', enabled: false },
  { id: 'time-management', name: '时间管理', description: '日程规划和效率提升', icon: '⏰', category: '生活工具', enabled: false },

  { id: 'habit-formation', name: '习惯养成', description: '习惯追踪和行为改变', icon: '🔄', category: '生活工具', enabled: false },
  { id: 'goal-setting', name: '目标设定', description: 'OKR和目标管理', icon: '🎯', category: '生活工具', enabled: false },
  { id: 'mindfulness', name: '正念', description: '当下觉察和内心平静', icon: '🧘', category: '生活工具', enabled: false },
  { id: 'philosophy', name: '哲学思考', description: '人生智慧和思辨能力', icon: '🏛️', category: '生活工具', enabled: false },
  { id: 'communication', name: '沟通技巧', description: '表达能力和说服技巧', icon: '💬', category: '生活工具', enabled: false },
  { id: 'negotiation', name: '谈判技巧', description: '商务谈判和协商策略', icon: '🤝', category: '生活工具', enabled: false },
  { id: 'public-speaking', name: '演讲表达', description: '演讲技巧和舞台表现', icon: '🎤', category: '生活工具', enabled: false },
  { id: 'interview', name: '面试技巧', description: '面试准备和应答策略', icon: '👔', category: '生活工具', enabled: false },
  { id: 'networking', name: '人脉经营', description: '社交网络和资源整合', icon: '🌐', category: '生活工具', enabled: false },
  { id: 'leadership', name: '领导力', description: '团队管理和激励艺术', icon: '👑', category: '生活工具', enabled: false },
  { id: 'emotional-intelligence', name: '情商培养', description: '情绪识别和人际处理', icon: '❤️', category: '生活工具', enabled: false },
  { id: 'critical-thinking', name: '批判思维', description: '逻辑分析和理性判断', icon: '🧠', category: '生活工具', enabled: false },
  { id: 'creative-thinking', name: '创造性思维', description: '创新思考和问题解决', icon: '💡', category: '生活工具', enabled: false },
  { id: 'decision-making', name: '决策分析', description: '决策模型和风险评估', icon: '🎲', category: '生活工具', enabled: false },
  { id: 'financial-literacy', name: '财商教育', description: '理财知识和财富思维', icon: '💰', category: '生活工具', enabled: false },
  { id: 'minimalism', name: '极简生活', description: '物质精简和生活简化', icon: '📦', category: '生活工具', enabled: false },
  { id: 'travel-planning', name: '旅行策划', description: '行程规划和旅行攻略', icon: '✈️', category: '生活工具', enabled: false },
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
      { id: 'gpt-4.1', name: 'GPT-4.1', description: '最新旗舰模型，全面超越GPT-4o', contextWindow: '1M', pricing: '$2/M tokens', supportsVision: true },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: '高性价比，适合大规模使用', contextWindow: '1M', pricing: '$0.4/M tokens', supportsVision: true },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', description: '极致轻量，超快响应', contextWindow: '1M', pricing: '$0.1/M tokens', supportsVision: true },
      { id: 'o3', name: 'o3', description: '最强推理模型，超越人类专家', contextWindow: '200K', pricing: '$10/M tokens' },
      { id: 'o3-mini', name: 'o3-mini', description: '轻量推理，高性价比', contextWindow: '200K', pricing: '$1.1/M tokens' },
      { id: 'o4-mini', name: 'o4-mini', description: '最新一代推理模型', contextWindow: '200K', pricing: '$1.1/M tokens' },
      { id: 'gpt-4o', name: 'GPT-4o', description: '多模态旗舰，视觉+语音+文本', contextWindow: '128K', pricing: '$2.5/M tokens', supportsVision: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '多模态高性价比选择', contextWindow: '128K', pricing: '$0.15/M tokens', supportsVision: true },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    logo: '',
    color: '#D97757',
    models: [
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', description: '最新旗舰，混合推理模型，1M上下文', contextWindow: '1M', pricing: '$5/M input, $25/M output', supportsVision: true },
      { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', description: '顶级编程与Agent能力', contextWindow: '200K', pricing: '$5/M input, $25/M output', supportsVision: true },
      { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', description: '平衡性能与成本的最新选择', contextWindow: '200K', pricing: '$3/M input, $15/M output', supportsVision: true },
      { id: 'claude-4-opus', name: 'Claude 4 Opus', description: '最强旗舰，深度推理与创作', contextWindow: '200K', pricing: '$15/M tokens', supportsVision: true },
      { id: 'claude-4-sonnet', name: 'Claude 4 Sonnet', description: '平衡性能与成本的首选', contextWindow: '200K', pricing: '$3/M tokens', supportsVision: true },
      { id: 'claude-3.5-haiku', name: 'Claude 3.5 Haiku', description: '极速响应，适合实时场景', contextWindow: '200K', pricing: '$0.25/M tokens', supportsVision: true },
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: '经典版本，稳定可靠', contextWindow: '200K', pricing: '$3/M tokens', supportsVision: true },
    ],
  },
  {
    id: 'google',
    name: 'Google',
    logo: '',
    color: '#4285f4',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: '思考型旗舰，原生多模态，GA稳定版', contextWindow: '1M', pricing: '$1.25/M input, $10/M output', supportsVision: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: '极速思考，性价比之王', contextWindow: '1M', pricing: '$0.15/M input, $0.60/M output', supportsVision: true },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', description: '超轻量版，最快响应', contextWindow: '1M', pricing: '$0.10/M tokens', supportsVision: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '下一代快速推理', contextWindow: '1M', pricing: '$0.10/M tokens', supportsVision: true },
      { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', description: '2.0系列专业版', contextWindow: '2M', pricing: '$1.25/M tokens', supportsVision: true },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '百万上下文，长文档处理', contextWindow: '2M', pricing: '$1.25/M tokens', supportsVision: true },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: '长上下文快速版', contextWindow: '1M', pricing: '$0.075/M tokens', supportsVision: true },
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
      { id: 'glm-4v-plus', name: 'GLM-4V-Plus', description: '视觉理解，多模态', contextWindow: '8K', pricing: '¥0.05/千tokens', supportsVision: true },
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
