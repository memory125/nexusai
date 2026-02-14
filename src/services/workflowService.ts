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
   * Execute LLM node
   */
  private async executeLLMNode(data: LLMNodeData, context: Record<string, any>): Promise<any> {
    // Resolve inputs
    const resolvedInputs: Record<string, string> = {};
    for (const [key, value] of Object.entries(data.inputs)) {
      resolvedInputs[key] = this.resolveTemplate(value, context);
    }
    
    // Simulate LLM call (in real implementation, call actual LLM)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const prompt = resolvedInputs.context || resolvedInputs.message || resolvedInputs.question || '';
    
    return {
      result: `[LLM Response for: ${prompt.substring(0, 50)}...]`,
      model: data.model,
      tokens: Math.ceil(prompt.length / 4),
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
   * Execute RAG node
   */
  private async executeRAGNode(data: RAGNodeData, context: Record<string, any>): Promise<any> {
    // Resolve query
    const query = this.resolveTemplate(data.queryTemplate, context);
    
    // Simulate RAG search
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      results: [
        { content: `Relevant content for: ${query}`, similarity: 0.95 },
        { content: `Additional context for: ${query}`, similarity: 0.87 },
      ],
      query,
      count: 2,
    };
  }

  /**
   * Execute transformer node
   */
  private executeTransformerNode(data: TransformerNodeData, context: Record<string, any>): any {
    const inputData = context.input || context;
    
    try {
      switch (data.transformType) {
        case 'map':
          // Simple map transformation
          return inputData;
        case 'filter':
          return inputData;
        case 'reduce':
          return inputData;
        default:
          // Custom expression
          const func = new Function('input', `return ${data.expression}`);
          return func(inputData);
      }
    } catch (error) {
      return { error: String(error) };
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
