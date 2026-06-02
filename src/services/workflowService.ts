// Workflow Service - Workflow execution engine and management

import type {
  Workflow,
  WorkflowExecution,
  WorkflowNode,
  WorkflowEdge,
  WorkflowResult,
  LLMNodeData,
  ConditionNodeData,
  ToolNodeData,
  RAGNodeData,
  TransformerNodeData,
  WebhookNodeData,
  DelayNodeData,
  ScriptNodeData,
} from '../types/workflow';
import { getMCPService } from './mcpService';
import { useStore } from '../store';
import { getOllamaService } from './ollamaService';
import { LLMService } from './llmService';
import { RAGService } from './ragService';
import { useKnowledgeBaseStore } from '../stores/knowledgeBaseStore';

class WorkflowService {
  private executions: Map<string, WorkflowExecution> = new Map();

  /**
   * Execute a workflow with given inputs
   */
  async execute(workflow: Workflow, inputs: Record<string, any>): Promise<WorkflowResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      startedAt: startTime,
      inputs,
      outputs: {},
      nodeOutputs: {},
      logs: [],
    };
    
    this.executions.set(executionId, execution);
    
    try {
      // Build adjacency list from edges
      const adjacencyList = this.buildAdjacencyList(workflow.edges);
      
      // Find start nodes (nodes with no incoming edges)
      const inDegree = this.calculateInDegree(workflow.nodes, workflow.edges);
      const startNodes = workflow.nodes.filter(n => inDegree.get(n.id) === 0);
      
      if (startNodes.length === 0) {
        throw new Error('Workflow has no starting node');
      }
      
      // Execute from start nodes
      const outputs = await this.executeNodeChain(
        workflow.nodes,
        workflow.edges,
        adjacencyList,
        startNodes[0].id,
        inputs,
        execution
      );
      
      execution.status = 'completed';
      execution.completedAt = Date.now();
      execution.outputs = outputs;
      
      return {
        success: true,
        outputs,
        executionTime: Date.now() - startTime,
        logs: execution.logs,
      };
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = Date.now();
      execution.error = String(error);
      execution.logs.push({
        timestamp: Date.now(),
        nodeId: 'root',
        level: 'error',
        message: String(error),
      });
      
      return {
        success: false,
        outputs: execution.nodeOutputs,
        executionTime: Date.now() - startTime,
        logs: execution.logs,
        error: String(error),
      };
    }
  }

  /**
   * Build adjacency list from edges
   */
  private buildAdjacencyList(edges: WorkflowEdge[]): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();
    
    for (const edge of edges) {
      if (!adjacency.has(edge.source)) {
        adjacency.set(edge.source, []);
      }
      adjacency.get(edge.source)!.push(edge.target);
    }
    
    return adjacency;
  }

  /**
   * Calculate in-degree for each node
   */
  private calculateInDegree(nodes: WorkflowNode[], edges: WorkflowEdge[]): Map<string, number> {
    const inDegree = new Map<string, number>();
    
    for (const node of nodes) {
      inDegree.set(node.id, 0);
    }
    
    for (const edge of edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
    
    return inDegree;
  }

  /**
   * Execute a chain of nodes
   */
  private async executeNodeChain(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    adjacencyList: Map<string, string[]>,
    currentNodeId: string,
    inputs: Record<string, any>,
    execution: WorkflowExecution
  ): Promise<Record<string, any>> {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const outputs: Record<string, any> = {};
    
    // Find all reachable nodes using BFS
    const visited = new Set<string>();
    const queue: string[] = [currentNodeId];
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      
      execution.currentNodeId = nodeId;
      execution.logs.push({
        timestamp: Date.now(),
        nodeId,
        level: 'info',
        message: `Executing node: ${node.type}`,
      });
      
      try {
        const nodeOutput = await this.executeNode(node, inputs, outputs, execution);
        outputs[nodeId] = nodeOutput;
        execution.nodeOutputs[nodeId] = nodeOutput;
        
        // Add connected nodes to queue
        const targets = adjacencyList.get(nodeId) || [];
        for (const targetId of targets) {
          // Check if this is a conditional edge
          const edge = edges.find(e => e.source === nodeId && e.target === targetId);
          if (edge?.sourceHandle) {
            // Conditional branch - only follow if condition matches
            if (node.type === 'condition' && nodeOutput.branch === edge.sourceHandle) {
              queue.push(targetId);
            }
          } else {
            queue.push(targetId);
          }
        }
      } catch (error) {
        execution.logs.push({
          timestamp: Date.now(),
          nodeId,
          level: 'error',
          message: String(error),
        });
        throw error;
      }
    }
    
    return outputs;
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    node: WorkflowNode,
    inputs: Record<string, any>,
    previousOutputs: Record<string, any>,
    _execution: WorkflowExecution
  ): Promise<any> {
    const data = node.data;
    
    switch (node.type) {
      case 'input':
        return inputs;
        
      case 'llm':
        return await this.executeLLMNode(data as LLMNodeData, previousOutputs);
        
      case 'condition':
        return await this.executeConditionNode(data as ConditionNodeData, previousOutputs);
        
      case 'tool':
        return await this.executeToolNode(data as ToolNodeData, previousOutputs);
        
      case 'rag':
        return await this.executeRAGNode(data as RAGNodeData, previousOutputs);
        
      case 'transformer':
        return this.executeTransformerNode(data as TransformerNodeData, previousOutputs);
        
      case 'webhook':
        return await this.executeWebhookNode(data as WebhookNodeData, previousOutputs);
        
      case 'delay':
        return await this.executeDelayNode(data as DelayNodeData);
        
      case 'script':
        return this.executeScriptNode(data as ScriptNodeData, previousOutputs);
        
      case 'output':
        return previousOutputs;
        
      default:
        return null;
    }
  }

  /**
   * Resolve template variables in string
   */
  private resolveTemplate(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      const parts = path.trim().split('.');
      let value: any = context;
      
      for (const part of parts) {
        if (value === undefined || value === null) return '';
        value = value[part];
      }
      
      return value ?? '';
    });
  }

  /**
   * Execute LLM node - REAL call to the configured LLM
   */
  private async executeLLMNode(data: LLMNodeData, context: Record<string, any>): Promise<any> {
    // Resolve inputs
    const resolvedInputs: Record<string, string> = {};
    for (const [key, value] of Object.entries(data.inputs)) {
      resolvedInputs[key] = this.resolveTemplate(value, context);
    }
    // Build messages
    const messages: Array<{ role: 'system'|'user'|'assistant'; content: string }> = [];
    if (data.systemPrompt) {
      messages.push({ role: 'system', content: this.resolveTemplate(data.systemPrompt, context) });
    }
    const userPrompt = resolvedInputs.question || resolvedInputs.message || resolvedInputs.prompt ||
      Object.values(resolvedInputs).filter(Boolean).join('\n\n');
    messages.push({ role: 'user', content: userPrompt });

    // Get model/provider from data, fallback to store's current selection
    const state = useStore.getState();
    const provider = data.provider || state.selectedProvider;
    const model = data.model || state.selectedModel;

    // Call real LLM based on provider
    let result = '';
    if (provider === 'ollama') {
      const ollama = getOllamaService(state.ollamaEndpoint);
      ollama.setDefaultModel(model);
      result = await ollama.chat(messages as any, model);
    } else if (provider === 'lmstudio') {
      const res = await fetch(`${state.lmstudioEndpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false, temperature: data.temperature ?? 0.7 }),
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) throw new Error(`LM Studio ${res.status}`);
      const json = await res.json();
      result = json.choices?.[0]?.message?.content || '';
    } else {
      const map: Record<string, { baseUrl: string; keyName: string }> = {
        openai:   { baseUrl: 'https://api.openai.com/v1', keyName: 'openai' },
        google:   { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', keyName: 'google' },
        qwen:     { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', keyName: 'qwen' },
        zhipu:    { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', keyName: 'zhipu' },
        deepseek: { baseUrl: 'https://api.deepseek.com/v1', keyName: 'deepseek' },
      };
      const cfg = map[provider];
      if (!cfg) throw new Error(`LLM 节点: 不支持的厂商 ${provider}`);
      const key = state.apiKeys[cfg.keyName];
      if (!key) throw new Error(`LLM 节点: 未配置 ${provider} API Key`);
      const llm = new LLMService(key, cfg.baseUrl);
      result = await llm.chatCompletion({
        model,
        messages,
        stream: false,
        temperature: data.temperature,
        max_tokens: data.maxTokens,
      });
    }

    return {
      result,
      model,
      provider,
      tokens: Math.ceil((userPrompt.length + result.length) / 4),
      userPrompt,
    };
  }

  /**
   * Execute condition node
   */
  private async executeConditionNode(data: ConditionNodeData, context: Record<string, any>): Promise<any> {
    // Resolve condition
    const condition = this.resolveTemplate(data.condition, context);
    
    // Evaluate condition (simple JavaScript evaluation)
    let result = false;
    try {
      // Create a safe evaluation context
      const evalContext = { ...context };
      const evalFunc = new Function(...Object.keys(evalContext), `return ${condition}`);
      result = evalFunc(...Object.values(evalContext));
    } catch {
      result = condition.toLowerCase() === 'true';
    }
    
    return {
      branch: result ? 'true' : 'false',
      condition: condition,
      result,
    };
  }

  /**
   * Execute tool node
   */
  private async executeToolNode(data: ToolNodeData, context: Record<string, any>): Promise<any> {
    const mcpService = getMCPService();
    
    // Resolve parameters
    const resolvedParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(data.parameters)) {
      resolvedParams[key] = this.resolveTemplate(value, context);
    }
    
    if (data.toolType === 'mcp' && data.serverId) {
      const result = await mcpService.callTool(data.serverId, {
        name: data.toolName,
        arguments: resolvedParams,
      });
      return result;
    }
    
    // Simulate tool call
    return { result: `Tool ${data.toolName} executed` };
  }

  /**
   * Execute RAG node - REAL retrieval from user's knowledge bases
   */
  private async executeRAGNode(data: RAGNodeData, context: Record<string, any>): Promise<any> {
    const query = this.resolveTemplate(data.queryTemplate, context);
    const state = useStore.getState();
    const kbState = useKnowledgeBaseStore.getState();

    // Resolve target KBs: prefer data.knowledgeBaseIds, fallback to all selected
    let targetKBs = data.knowledgeBaseIds || [];
    if (targetKBs.length === 0) {
      targetKBs = kbState.selectedKnowledgeBaseIds;
    }
    if (targetKBs.length === 0) {
      return { results: [], query, count: 0, message: '未选择任何知识库' };
    }

    // Collect chunks from target KBs
    const chunks: Array<{ id: string; content: string; metadata: any; embedding?: number[] }> = [];
    for (const kbId of targetKBs) {
      const kb = kbState.knowledgeBases.find(k => k.id === kbId);
      if (!kb) continue;
      for (const c of kb.chunks) {
        chunks.push({
          id: c.id,
          content: c.content,
          metadata: { documentId: c.metadata?.documentId, documentName: c.metadata?.documentName, knowledgeBaseId: kbId },
        });
      }
    }
    if (chunks.length === 0) {
      return { results: [], query, count: 0, message: '所选知识库中没有任何文档' };
    }

    try {
      const ragService = new RAGService(state.embeddingConfig);
      const result = await ragService.searchRelevantChunks(query, chunks as any, data.topK || 5);
      return {
        results: result.results.map(r => ({
          content: r.chunk.content,
          documentName: (r.chunk.metadata as any)?.documentName,
          similarity: r.score,
        })),
        query,
        count: result.results.length,
        stats: result.stats,
      };
    } catch (e) {
      return {
        results: [],
        query,
        count: 0,
        error: e instanceof Error ? e.message : String(e),
        message: 'RAG 检索失败(已优雅降级)',
      };
    }
  }

  /**
   * Execute transformer node - real map/filter/reduce over arrays
   */
  private executeTransformerNode(data: TransformerNodeData, context: Record<string, any>): any {
    // Find the first array in context (typical: rag.results, llm.result etc)
    let inputData: any = context.input;
    if (inputData === undefined) {
      // Try to find array in context
      for (const v of Object.values(context)) {
        if (Array.isArray(v)) { inputData = v; break; }
        if (v && typeof v === 'object' && Array.isArray(v.results)) { inputData = v.results; break; }
      }
    }
    if (inputData === undefined) inputData = context;

    try {
      switch (data.transformType) {
        case 'map': {
          if (!Array.isArray(inputData)) return { error: 'map 需要数组输入', input: inputData };
          if (!data.expression.trim()) return inputData;
          const fn = new Function('item', 'idx', `return (${data.expression})`);
          return inputData.map((item, idx) => fn(item, idx));
        }
        case 'filter': {
          if (!Array.isArray(inputData)) return { error: 'filter 需要数组输入', input: inputData };
          if (!data.expression.trim()) return inputData;
          const fn = new Function('item', 'idx', `return (${data.expression})`);
          return inputData.filter((item, idx) => fn(item, idx));
        }
        case 'reduce': {
          if (!Array.isArray(inputData)) return { error: 'reduce 需要数组输入', input: inputData };
          if (!data.expression.trim()) return inputData;
          const fn = new Function('acc', 'item', 'idx', `return (${data.expression})`);
          return inputData.reduce((acc, item, idx) => fn(acc, item, idx), {});
        }
        default: {
          // Custom expression over input
          const func = new Function('input', `return (${data.expression})`);
          return func(inputData);
        }
      }
    } catch (error) {
      return { error: String(error), input: Array.isArray(inputData) ? `${inputData.length} items` : typeof inputData };
    }
  }

  /**
   * Execute webhook node
   */
  private async executeWebhookNode(data: WebhookNodeData, context: Record<string, any>): Promise<any> {
    // Resolve template variables
    const url = this.resolveTemplate(data.url, context);
    const body = data.body ? this.resolveTemplate(data.body, context) : undefined;
    
    try {
      const response = await fetch(url, {
        method: data.method,
        headers: {
          'Content-Type': 'application/json',
          ...data.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: data.timeout ? AbortSignal.timeout(data.timeout) : undefined,
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      
      return { text: await response.text() };
    } catch (error) {
      return { error: String(error) };
    }
  }

  /**
   * Execute delay node
   */
  private async executeDelayNode(data: DelayNodeData): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, data.duration));
  }

  /**
   * Execute script node
   */
  private executeScriptNode(data: ScriptNodeData, context: Record<string, any>): any {
    try {
      const func = new Function('inputs', 'outputs', data.code);
      return func(context, {});
    } catch (error) {
      return { error: String(error) };
    }
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions for a workflow
   */
  getWorkflowExecutions(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId)
      .sort((a, b) => b.startedAt - a.startedAt);
  }
}

// Singleton instance
export const workflowService = new WorkflowService();

export default workflowService;
