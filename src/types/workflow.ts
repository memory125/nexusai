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
