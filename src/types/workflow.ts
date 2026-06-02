// Workflow orchestration types and interfaces

// Node types available in workflows
export type WorkflowNodeType = 
  | 'llm'              // LLM call node
  | 'condition'        // Conditional branch
  | 'loop'             // Loop iteration
  | 'tool'             // MCP tool or plugin tool
  | 'rag'             // RAG knowledge base query
  | 'input'           // User input
  | 'output'          // Final output
  | 'transformer'     // Data transformation
  | 'webhook'         // External API call
  | 'delay'           // Wait/delay node
  | 'script';        // Custom script

// Node connection (edge)
export interface WorkflowEdge {
  id: string;
  source: string;      // Source node ID
  target: string;      // Target node ID
  sourceHandle?: string;  // For condition nodes: 'true' | 'false'
  targetHandle?: string;
  label?: string;
}

// Base node configuration
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

// Node-specific data
export interface LLMNodeData {
  model: string;
  provider: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  inputs: Record<string, string>;  // {{nodeId.output}}
}

export interface ConditionNodeData {
  condition: string;  // JavaScript expression using {{inputs}}
  trueLabel?: string;
  falseLabel?: string;
}

export interface LoopNodeData {
  maxIterations: number;
  continueOnError: boolean;
  iteratorVariable?: string;
}

export interface ToolNodeData {
  toolName: string;
  toolType: 'mcp' | 'plugin' | 'builtin';
  serverId?: string;
  pluginId?: string;
  parameters: Record<string, string>;
}

export interface RAGNodeData {
  knowledgeBaseIds: string[];
  queryTemplate: string;
  topK: number;
  includeSources: boolean;
}

export interface InputNodeData {
  fieldName: string;
  fieldType: 'text' | 'file' | 'choice';
  options?: string[];
  required: boolean;
}

export interface OutputNodeData {
  outputFormat: 'text' | 'json' | 'markdown';
  outputField?: string;
}

export interface TransformerNodeData {
  transformType: 'map' | 'filter' | 'reduce' | 'custom';
  expression: string;  // JavaScript expression
}

export interface WebhookNodeData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface DelayNodeData {
  duration: number;  // milliseconds
}

export interface ScriptNodeData {
  language: 'javascript';
  code: string;
}

export type WorkflowNodeData = 
  | LLMNodeData
  | ConditionNodeData
  | LoopNodeData
  | ToolNodeData
  | RAGNodeData
  | InputNodeData
  | OutputNodeData
  | TransformerNodeData
  | WebhookNodeData
  | DelayNodeData
  | ScriptNodeData;

// Workflow execution status
export type WorkflowStatus = 'draft' | 'published' | 'running' | 'completed' | 'failed' | 'paused';

// Workflow execution
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  startedAt: number;
  completedAt?: number;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  nodeOutputs: Record<string, any>;
  currentNodeId?: string;
  error?: string;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: number;
  nodeId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

// Workflow template
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: number;
  updatedAt: number;
}

// User workflow
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  inputs: InputNodeData[];
  outputs: OutputNodeData[];
  createdAt: number;
  updatedAt: number;
  lastRunAt?: number;
  runCount: number;
}

// Workflow execution result
export interface WorkflowResult {
  success: boolean;
  outputs: Record<string, any>;
  executionTime: number;
  logs: ExecutionLog[];
  error?: string;
}

// Built-in workflow templates
export const WORKFLOW_TEMPLATES: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '文档问答助手',
    description: '上传文档，通过 RAG 进行问答',
    category: 'RAG',
    nodes: [
      {
        id: 'input',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { fieldName: 'question', fieldType: 'text', required: true },
      },
      {
        id: 'rag',
        type: 'rag',
        position: { x: 300, y: 200 },
        data: { knowledgeBaseIds: [], queryTemplate: '{{inputs.question}}', topK: 5, includeSources: true },
      },
      {
        id: 'llm',
        type: 'llm',
        position: { x: 500, y: 200 },
        data: { model: '', provider: '', systemPrompt: '根据提供的上下文回答用户问题', inputs: { context: '{{rag.results}}', question: '{{inputs.question}}' } },
      },
      {
        id: 'output',
        type: 'output',
        position: { x: 700, y: 200 },
        data: { outputFormat: 'text' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input', target: 'rag' },
      { id: 'e2', source: 'rag', target: 'llm' },
      { id: 'e3', source: 'llm', target: 'output' },
    ],
  },
  {
    name: '批量内容生成',
    description: '批量生成多个主题的内容',
    category: 'Automation',
    nodes: [
      {
        id: 'input',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { fieldName: 'topics', fieldType: 'text', required: true },
      },
      {
        id: 'loop',
        type: 'loop',
        position: { x: 300, y: 200 },
        data: { maxIterations: 10, continueOnError: true },
      },
      {
        id: 'llm',
        type: 'llm',
        position: { x: 500, y: 200 },
        data: { model: '', provider: '', systemPrompt: '为主题生成内容', inputs: { topic: '{{loop.item}}' } },
      },
      {
        id: 'output',
        type: 'output',
        position: { x: 700, y: 200 },
        data: { outputFormat: 'json' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input', target: 'loop' },
      { id: 'e2', source: 'loop', target: 'llm' },
      { id: 'e3', source: 'llm', target: 'output' },
    ],
  },
  {
    name: '智能客服机器人',
    description: '根据问题类型选择不同处理流程',
    category: 'Customer Service',
    nodes: [
      {
        id: 'input',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { fieldName: 'message', fieldType: 'text', required: true },
      },
      {
        id: 'classify',
        type: 'llm',
        position: { x: 300, y: 200 },
        data: { model: '', provider: '', systemPrompt: '分类用户问题：技术问题/账单问题/其他', inputs: { message: '{{inputs.message}}' } },
      },
      {
        id: 'condition',
        type: 'condition',
        position: { x: 500, y: 200 },
        data: { condition: '{{classify.result}}.includes("技术")', trueLabel: '技术问题', falseLabel: '其他' },
      },
      {
        id: 'tech_response',
        type: 'llm',
        position: { x: 700, y: 100 },
        data: { model: '', provider: '', systemPrompt: '你是技术支持，请回答技术问题', inputs: { message: '{{inputs.message}}' } },
      },
      {
        id: 'general_response',
        type: 'llm',
        position: { x: 700, y: 300 },
        data: { model: '', provider: '', systemPrompt: '请礼貌回复用户', inputs: { message: '{{inputs.message}}' } },
      },
      {
        id: 'output',
        type: 'output',
        position: { x: 900, y: 200 },
        data: { outputFormat: 'text' },
      },
    ],
    edges: [
      { id: 'e1', source: 'input', target: 'classify' },
      { id: 'e2', source: 'classify', target: 'condition' },
      { id: 'e3', source: 'condition', target: 'tech_response', sourceHandle: 'true' },
      { id: 'e4', source: 'condition', target: 'general_response', sourceHandle: 'false' },
      { id: 'e5', source: 'tech_response', target: 'output' },
      { id: 'e6', source: 'general_response', target: 'output' },
    ],
  },
  // 内容生成器
  {
    name: '内容生成器',
    description: '根据主题和风格生成文章、博客或社交媒体内容',
    category: 'Content',
    nodes: [
      {
        id: 'topic',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { fieldName: 'topic', fieldType: 'text', required: true },
      },
      {
        id: 'style',
        type: 'input',
        position: { x: 100, y: 300 },
        data: { fieldName: 'style', fieldType: 'choice', options: ['专业', '轻松', '学术', '营销'], required: true },
      },
      {
        id: 'generate',
        type: 'llm',
        position: { x: 350, y: 250 },
        data: { 
          model: '', 
          provider: '', 
          systemPrompt: '根据给定主题和风格生成高质量内容', 
          inputs: { topic: '{{inputs.topic}}', style: '{{inputs.style}}' } 
        },
      },
      {
        id: 'output',
        type: 'output',
        position: { x: 600, y: 250 },
        data: { outputFormat: 'markdown' },
      },
    ],
    edges: [
      { id: 'e1', source: 'topic', target: 'generate' },
      { id: 'e2', source: 'style', target: 'generate' },
      { id: 'e3', source: 'generate', target: 'output' },
    ],
  },
  // 代码审查
  {
    name: '代码审查助手',
    description: '自动审查代码，提供改进建议和最佳实践',
    category: 'Developer Tools',
    nodes: [
      {
        id: 'code',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { fieldName: 'code', fieldType: 'text', required: true },
      },
      {
        id: 'language',
        type: 'input',
        position: { x: 100, y: 300 },
        data: { fieldName: 'language', fieldType: 'choice', options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust'], required: true },
      },
      {
        id: 'review',
        type: 'llm',
        position: { x: 350, y: 250 },
        data: { 
          model: '', 
          provider: '', 
          systemPrompt: '你是一个专业的代码审查员。审查代码并提供具体的改进建议。检查：安全性、性能、可读性、最佳实践', 
          inputs: { code: '{{inputs.code}}', language: '{{inputs.language}}' } 
        },
      },
      {
        id: 'output',
        type: 'output',
        position: { x: 600, y: 250 },
        data: { outputFormat: 'markdown' },
      },
    ],
    edges: [
      { id: 'e1', source: 'code', target: 'review' },
      { id: 'e2', source: 'language', target: 'review' },
      { id: 'e3', source: 'review', target: 'output' },
    ],
  },
  // 数据提取器
  {
    name: '文档数据提取',
    description: '从 PDF、Word 或网页中提取结构化数据',
    category: 'Data Processing',
    nodes: [
      {
        id: 'document',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { fieldName: 'document', fieldType: 'file', required: true },
      },
      {
        id: 'extract_fields',
        type: 'input',
        position: { x: 100, y: 300 },
        data: { fieldName: 'fields', fieldType: 'text', required: true },
      },
      {
        id: 'parse',
        type: 'llm',
        position: { x: 350, y: 250 },
        data: { 
          model: '', 
          provider: '', 
          systemPrompt: '从文档中提取指定的字段数据，以 JSON 格式返回', 
          inputs: { document: '{{inputs.document}}', fields: '{{inputs.fields}}' } 
        },
      },
      {
        id: 'output',
        type: 'output',
        position: { x: 600, y: 250 },
        data: { outputFormat: 'json' },
      },
    ],
    edges: [
      { id: 'e1', source: 'document', target: 'parse' },
      { id: 'e2', source: 'extract_fields', target: 'parse' },
      { id: 'e3', source: 'parse', target: 'output' },
    ],
  },
  // 会议总结
  {
    name: '会议总结助手',
    description: '分析会议记录，提取要点、任务和决策',
    category: 'Productivity',
    nodes: [
      {
        id: 'transcript',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { fieldName: 'transcript', fieldType: 'text', required: true },
      },
      {
        id: 'summarize',
        type: 'llm',
        position: { x: 300, y: 200 },
        data: { 
          model: '', 
          provider: '', 
          systemPrompt: '分析会议记录，提取：1. 会议要点 2. 分配的任务 3. 做出的决策 4. 下次会议时间', 
          inputs: { transcript: '{{inputs.transcript}}' } 
        },
      },
      {
        id: 'output',
        type: 'output',
        position: { x: 500, y: 200 },
        data: { outputFormat: 'markdown' },
      },
    ],
    edges: [
      { id: 'e1', source: 'transcript', target: 'summarize' },
      { id: 'e2', source: 'summarize', target: 'output' },
    ],
  },
  // 多知识库问答
  {
    name: '多知识库问答',
    description: '同时查询多个知识库，汇总答案',
    category: 'RAG',
    nodes: [
      {
        id: 'question',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { fieldName: 'question', fieldType: 'text', required: true },
      },
      {
        id: 'rag1',
        type: 'rag',
        position: { x: 300, y: 100 },
        data: { knowledgeBaseIds: [], queryTemplate: '{{inputs.question}}', topK: 3, includeSources: true },
      },
      {
        id: 'rag2',
        type: 'rag',
        position: { x: 300, y: 300 },
        data: { knowledgeBaseIds: [], queryTemplate: '{{inputs.question}}', topK: 3, includeSources: true },
      },
      {
        id: 'merge',
        type: 'transformer',
        position: { x: 500, y: 200 },
        data: { transformType: 'custom', expression: 'return { kb1: inputs.rag1, kb2: inputs.rag2 };' },
      },
      {
        id: 'answer',
        type: 'llm',
        position: { x: 700, y: 200 },
        data: { 
          model: '', 
          provider: '', 
          systemPrompt: '根据多个知识库的内容，综合回答用户问题', 
          inputs: { kb1: '{{rag1.results}}', kb2: '{{rag2.results}}', question: '{{inputs.question}}' } 
        },
      },
      {
        id: 'output',
        type: 'output',
        position: { x: 900, y: 200 },
        data: { outputFormat: 'markdown' },
      },
    ],
    edges: [
      { id: 'e1', source: 'question', target: 'rag1' },
      { id: 'e2', source: 'question', target: 'rag2' },
      { id: 'e3', source: 'rag1', target: 'merge' },
      { id: 'e4', source: 'rag2', target: 'merge' },
      { id: 'e5', source: 'merge', target: 'answer' },
      { id: 'e6', source: 'answer', target: 'output' },
    ],
  },
  // 自动化测试生成
  {
    name: '单元测试生成',
    description: '为代码自动生成单元测试用例',
    category: 'Developer Tools',
    nodes: [
      {
        id: 'code',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { fieldName: 'code', fieldType: 'text', required: true },
      },
      {
        id: 'framework',
        type: 'input',
        position: { x: 100, y: 300 },
        data: { fieldName: 'framework', fieldType: 'choice', options: ['Jest', 'Mocha', 'Pytest', 'JUnit', 'Go test'], required: true },
      },
      {
        id: 'generate',
        type: 'llm',
        position: { x: 350, y: 250 },
        data: { 
          model: '', 
          provider: '', 
          systemPrompt: '根据代码生成高质量的单元测试用例。使用指定的测试框架，覆盖主要场景', 
          inputs: { code: '{{inputs.code}}', framework: '{{inputs.framework}}' } 
        },
      },
      {
        id: 'output',
        type: 'output',
        position: { x: 600, y: 250 },
        data: { outputFormat: 'text' },
      },
    ],
    edges: [
      { id: 'e1', source: 'code', target: 'generate' },
      { id: 'e2', source: 'framework', target: 'generate' },
      { id: 'e3', source: 'generate', target: 'output' },
    ],
  },
  // API 文档生成
  {
    name: 'API 文档生成',
    description: '从代码或 API 响应生成 API 文档',
    category: 'Developer Tools',
    nodes: [
      {
        id: 'api_spec',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { fieldName: 'api_spec', fieldType: 'text', required: true },
      },
      {
        id: 'generate_doc',
        type: 'llm',
        position: { x: 350, y: 200 },
        data: { 
          model: '', 
          provider: '', 
          systemPrompt: '生成专业的 API 文档，包括：端点说明、请求参数、响应格式、错误码说明、使用示例', 
          inputs: { api_spec: '{{inputs.api_spec}}' } 
        },
      },
      {
        id: 'output',
        type: 'output',
        position: { x: 600, y: 200 },
        data: { outputFormat: 'markdown' },
      },
    ],
    edges: [
      { id: 'e1', source: 'api_spec', target: 'generate_doc' },
      { id: 'e2', source: 'generate_doc', target: 'output' },
    ],
  },

  // ========== 真正解决痛点的工作流模板 ==========

  // 1. 客服工单自动回复 (RAG + LLM)
  {
    name: '客服工单自动回复',
    description: '输入客户问题 → 知识库检索 → LLM 生成专业回复 → 输出可发送的回复文本。解决客服重复性问题。',
    category: 'Customer Service',
    nodes: [
      { id: 'ticket', type: 'input', position: { x: 50, y: 200 },
        data: { fieldName: 'question', fieldType: 'text', required: true } },
      { id: 'rag', type: 'rag', position: { x: 250, y: 200 },
        data: { knowledgeBaseIds: [], queryTemplate: '{{inputs.question}}', topK: 5, includeSources: true } },
      { id: 'draft', type: 'llm', position: { x: 450, y: 200 },
        data: {
          model: '', provider: '',
          systemPrompt: '你是一名专业客服。基于提供的知识库上下文回答用户问题。要求:\n1. 礼貌、专业、简洁\n2. 必须基于上下文,不要编造\n3. 如果上下文无法回答,明确说明并建议转人工\n4. 末尾列出参考的知识库来源',
          inputs: { context: '{{rag.results}}', question: '{{inputs.question}}' },
          temperature: 0.3,
        } },
      { id: 'output', type: 'output', position: { x: 650, y: 200 },
        data: { outputFormat: 'text' } },
    ],
    edges: [
      { id: 'e1', source: 'ticket', target: 'rag' },
      { id: 'e2', source: 'rag', target: 'draft' },
      { id: 'e3', source: 'draft', target: 'output' },
    ],
  },

  // 2. 每日新闻摘要 (Webhook + LLM)
  {
    name: '每日新闻摘要',
    description: '从多个 RSS / 新闻源拉取最新内容 → 合并去重 → LLM 提炼重点 → 输出结构化简报。解决信息过载。',
    category: 'Content',
    nodes: [
      { id: 'feeds', type: 'input', position: { x: 50, y: 200 },
        data: { fieldName: 'sources', fieldType: 'text', required: true } },
      { id: 'fetch1', type: 'webhook', position: { x: 250, y: 100 },
        data: { url: 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20', method: 'GET', timeout: 15000 } },
      { id: 'fetch2', type: 'webhook', position: { x: 250, y: 300 },
        data: { url: 'https://www.reddit.com/r/technology/top.json?limit=15', method: 'GET', timeout: 15000 } },
      { id: 'merge', type: 'transformer', position: { x: 450, y: 200 },
        data: {
          transformType: 'custom',
          expression: '([...(input?.[0]?.hits || []).map(h => h.title), ...(input?.[1]?.data?.children || []).map(c => c.data.title)]).filter(Boolean).slice(0, 30).join("\\n- ")',
        } },
      { id: 'summarize', type: 'llm', position: { x: 650, y: 200 },
        data: {
          model: '', provider: '',
          systemPrompt: '你是一名新闻编辑。请从以下今日要闻中提炼最重要的 5 条,每条不超过 50 字,使用 Markdown 列表输出。开头写一句今日概览。',
          inputs: { headlines: '{{merge}}' },
          temperature: 0.4,
        } },
      { id: 'output', type: 'output', position: { x: 850, y: 200 },
        data: { outputFormat: 'markdown' } },
    ],
    edges: [
      { id: 'e1', source: 'feeds', target: 'fetch1' },
      { id: 'e2', source: 'feeds', target: 'fetch2' },
      { id: 'e3', source: 'fetch1', target: 'merge' },
      { id: 'e4', source: 'fetch2', target: 'merge' },
      { id: 'e5', source: 'merge', target: 'summarize' },
      { id: 'e6', source: 'summarize', target: 'output' },
    ],
  },

  // 3. 代码审查流水线 (输入 → LLM 安全分析 → LLM 风格建议 → 输出)
  {
    name: '代码审查流水线',
    description: '输入代码片段 → LLM 安全/性能/Bug 审查 → LLM 改进建议 → Markdown 报告。',
    category: 'Developer Tools',
    nodes: [
      { id: 'code', type: 'input', position: { x: 50, y: 200 },
        data: { fieldName: 'code', fieldType: 'text', required: true } },
      { id: 'lang', type: 'input', position: { x: 50, y: 320 },
        data: { fieldName: 'language', fieldType: 'text', required: false } },
      { id: 'audit', type: 'llm', position: { x: 280, y: 200 },
        data: {
          model: '', provider: '',
          systemPrompt: '你是一名严格的代码审查员。按以下维度审查代码:\n1. 安全性(SQL 注入/XSS/越权/敏感信息泄露)\n2. 性能(N+1/重复计算/内存泄漏)\n3. 错误处理(空指针/未捕获异常)\n4. 可读性(命名/复杂度/重复)\n\n输出 Markdown 报告:每个问题标注严重度(🔴 严重 / 🟡 中等 / 🟢 建议),给出位置和修复建议。',
          inputs: { code: '{{inputs.code}}', language: '{{inputs.language}}' },
          temperature: 0.2,
        } },
      { id: 'refactor', type: 'llm', position: { x: 510, y: 200 },
        data: {
          model: '', provider: '',
          systemPrompt: '基于审查报告,提供重构后的代码。保留原有功能,只修复发现的问题。输出格式:先用一句话总结改动,然后用 ``` 代码块 输出完整代码。',
          inputs: { code: '{{inputs.code}}', audit: '{{audit.result}}' },
          temperature: 0.2,
        } },
      { id: 'output', type: 'output', position: { x: 740, y: 200 },
        data: { outputFormat: 'markdown' } },
    ],
    edges: [
      { id: 'e1', source: 'code', target: 'audit' },
      { id: 'e2', source: 'lang', target: 'audit' },
      { id: 'e3', source: 'audit', target: 'refactor' },
      { id: 'e4', source: 'refactor', target: 'output' },
    ],
  },

  // 4. 学术论文摘要器 (URL 输入 → 抓取 → LLM 摘要 → 输出)
  {
    name: '学术论文摘要器',
    description: '输入论文 URL → 抓取页面 → 提取正文 → LLM 生成结构化摘要(背景/方法/结果/结论/局限)。解决读论文慢的痛点。',
    category: 'Content',
    nodes: [
      { id: 'url', type: 'input', position: { x: 50, y: 200 },
        data: { fieldName: 'paper_url', fieldType: 'text', required: true } },
      { id: 'fetch', type: 'webhook', position: { x: 250, y: 200 },
        data: { url: '{{inputs.paper_url}}', method: 'GET', timeout: 20000 } },
      { id: 'condense', type: 'llm', position: { x: 450, y: 200 },
        data: {
          model: '', provider: '',
          systemPrompt: '你是科研助理。基于以下论文原文,生成结构化中文摘要:\n\n## 背景与动机\n## 方法\n## 核心结果\n## 结论与意义\n## 局限与未来工作\n\n要求:客观准确、保留关键数据、术语规范、不超过 800 字。',
          inputs: { paper_text: '{{fetch.text}}' },
          temperature: 0.3,
        } },
      { id: 'output', type: 'output', position: { x: 650, y: 200 },
        data: { outputFormat: 'markdown' } },
    ],
    edges: [
      { id: 'e1', source: 'url', target: 'fetch' },
      { id: 'e2', source: 'fetch', target: 'condense' },
      { id: 'e3', source: 'condense', target: 'output' },
    ],
  },

  // 5. GitHub Issue 自动回复 (RAG + LLM)
  {
    name: 'GitHub Issue 自动回复',
    description: '输入 Issue 标题/正文 → 项目知识库检索相关文档 → LLM 起草回复 → 输出。',
    category: 'Customer Service',
    nodes: [
      { id: 'issue', type: 'input', position: { x: 50, y: 200 },
        data: { fieldName: 'issue_text', fieldType: 'text', required: true } },
      { id: 'rag', type: 'rag', position: { x: 250, y: 200 },
        data: { knowledgeBaseIds: [], queryTemplate: '{{inputs.issue_text}}', topK: 5, includeSources: true } },
      { id: 'classify', type: 'llm', position: { x: 450, y: 200 },
        data: {
          model: '', provider: '',
          systemPrompt: '判断 Issue 类型:Bug / Feature Request / Question / Docs / Other。仅输出一个标签。',
          inputs: { issue: '{{inputs.issue_text}}' },
          temperature: 0,
        } },
      { id: 'reply', type: 'llm', position: { x: 650, y: 200 },
        data: {
          model: '', provider: '',
          systemPrompt: '你是开源项目维护者。基于知识库上下文起草 Issue 回复。要求:\n1. 感谢用户提交\n2. 简洁说明相关背景或解决方案\n3. 引用相关文档/源码\n4. 询问必要细节(如果是 Bug)\n5. 避免承诺(不说"我们会马上修复")\n\n格式:Markdown,使用引用块引用上下文,200-400 字。',
          inputs: { context: '{{rag.results}}', issue: '{{inputs.issue_text}}', type: '{{classify.result}}' },
          temperature: 0.4,
        } },
      { id: 'output', type: 'output', position: { x: 850, y: 200 },
        data: { outputFormat: 'markdown' } },
    ],
    edges: [
      { id: 'e1', source: 'issue', target: 'rag' },
      { id: 'e2', source: 'issue', target: 'classify' },
      { id: 'e3', source: 'rag', target: 'reply' },
      { id: 'e4', source: 'classify', target: 'reply' },
      { id: 'e5', source: 'reply', target: 'output' },
    ],
  },

  // 6. 竞品情报聚合 (3 并行 webhook → LLM 对比)
  {
    name: '竞品情报聚合',
    description: '输入 3 个竞品 URL → 并行抓取 → LLM 对比功能/价格/优劣 → 输出对比表。',
    category: 'Data Processing',
    nodes: [
      { id: 'urls', type: 'input', position: { x: 50, y: 200 },
        data: { fieldName: 'competitor_urls', fieldType: 'text', required: true } },
      { id: 'fetch1', type: 'webhook', position: { x: 250, y: 100 },
        data: { url: '{{inputs.competitor_urls.split(",")[0]}}', method: 'GET', timeout: 15000 } },
      { id: 'fetch2', type: 'webhook', position: { x: 250, y: 200 },
        data: { url: '{{inputs.competitor_urls.split(",")[1] || inputs.competitor_urls.split(",")[0]}}', method: 'GET', timeout: 15000 } },
      { id: 'fetch3', type: 'webhook', position: { x: 250, y: 300 },
        data: { url: '{{inputs.competitor_urls.split(",")[2] || inputs.competitor_urls.split(",")[0]}}', method: 'GET', timeout: 15000 } },
      { id: 'compare', type: 'llm', position: { x: 500, y: 200 },
        data: {
          model: '', provider: '',
          systemPrompt: '你是市场分析师。基于 3 个竞品的网页内容,生成对比表格,字段:产品名/核心功能/价格/目标用户/差异化优势/劣势。Markdown 表格输出,表格前加 1 句总结。',
          inputs: { c1: '{{fetch1.text}}', c2: '{{fetch2.text}}', c3: '{{fetch3.text}}' },
          temperature: 0.3,
        } },
      { id: 'output', type: 'output', position: { x: 750, y: 200 },
        data: { outputFormat: 'markdown' } },
    ],
    edges: [
      { id: 'e1', source: 'urls', target: 'fetch1' },
      { id: 'e2', source: 'urls', target: 'fetch2' },
      { id: 'e3', source: 'urls', target: 'fetch3' },
      { id: 'e4', source: 'fetch1', target: 'compare' },
      { id: 'e5', source: 'fetch2', target: 'compare' },
      { id: 'e6', source: 'fetch3', target: 'compare' },
      { id: 'e7', source: 'compare', target: 'output' },
    ],
  },
];

// Workflow categories
export const WORKFLOW_CATEGORIES = [
  'Automation',
  'RAG',
  'Customer Service',
  'Content',
  'Data Processing',
  'Developer Tools',
  'Productivity',
  'Custom',
];
