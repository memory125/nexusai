// Workflow Store - State management for workflow orchestration

import { create } from 'zustand';
import type { Workflow, WorkflowExecution, WorkflowTemplate, WorkflowNode, WorkflowEdge } from '../types/workflow';

interface WorkflowState {
  // Workflows
  workflows: Workflow[];
  activeWorkflowId: string | null;
  currentExecution: WorkflowExecution | null;
  workflowTemplates: WorkflowTemplate[];
  isExecuting: boolean;

  // Actions
  setWorkflows: (workflows: Workflow[]) => void;
  createWorkflow: (name: string, description: string) => string;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  setActiveWorkflow: (id: string | null) => void;
  runWorkflow: (id: string, inputs: Record<string, any>) => Promise<void>;
  addWorkflowNode: (workflowId: string, node: WorkflowNode) => void;
  updateWorkflowNode: (workflowId: string, nodeId: string, data: Partial<WorkflowNode>) => void;
  removeWorkflowNode: (workflowId: string, nodeId: string) => void;
  addWorkflowEdge: (workflowId: string, edge: WorkflowEdge) => void;
  removeWorkflowEdge: (workflowId: string, edgeId: string) => void;
  setCurrentExecution: (execution: WorkflowExecution | null) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  activeWorkflowId: null,
  currentExecution: null,
  workflowTemplates: [],
  isExecuting: false,

  setWorkflows: (workflows) => set({ workflows }),

  createWorkflow: (name, description) => {
    const id = `wf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const workflow: Workflow = {
      id,
      name,
      description,
      status: 'draft',
      nodes: [],
      edges: [],
      inputs: [],
      outputs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      runCount: 0,
    };
    set(s => ({ workflows: [...s.workflows, workflow] }));
    return id;
  },

  updateWorkflow: (id, updates) => set(s => ({
    workflows: s.workflows.map(w => w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w),
  })),

  deleteWorkflow: (id) => set(s => ({
    workflows: s.workflows.filter(w => w.id !== id),
    activeWorkflowId: s.activeWorkflowId === id ? null : s.activeWorkflowId,
  })),

  setActiveWorkflow: (id) => set({ activeWorkflowId: id }),

  runWorkflow: async (id, inputs) => {
    const workflow = get().workflows.find(w => w.id === id);
    if (!workflow) return;

    set({ isExecuting: true });

    try {
      const { workflowService } = await import('../services/workflowService');
      const result = await workflowService.execute(workflow, inputs);

      set(s => ({
        workflows: s.workflows.map(w => w.id === id
          ? { ...w, lastRunAt: Date.now(), runCount: w.runCount + 1, status: result.success ? 'completed' : 'failed' }
          : w
        ),
        isExecuting: false,
      }));
    } catch (error) {
      set(s => ({
        workflows: s.workflows.map(w => w.id === id ? { ...w, status: 'failed' } : w),
        isExecuting: false,
      }));
    }
  },

  addWorkflowNode: (workflowId, node) => set(s => ({
    workflows: s.workflows.map(w => w.id === workflowId
      ? { ...w, nodes: [...w.nodes, node], updatedAt: Date.now() }
      : w
    ),
  })),

  updateWorkflowNode: (workflowId, nodeId, data) => set(s => ({
    workflows: s.workflows.map(w => w.id === workflowId
      ? { ...w, nodes: w.nodes.map(n => n.id === nodeId ? { ...n, ...data } : n), updatedAt: Date.now() }
      : w
    ),
  })),

  removeWorkflowNode: (workflowId, nodeId) => set(s => ({
    workflows: s.workflows.map(w => w.id === workflowId
      ? {
          ...w,
          nodes: w.nodes.filter(n => n.id !== nodeId),
          edges: w.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
          updatedAt: Date.now()
        }
      : w
    ),
  })),

  addWorkflowEdge: (workflowId, edge) => set(s => ({
    workflows: s.workflows.map(w => w.id === workflowId
      ? { ...w, edges: [...w.edges, edge], updatedAt: Date.now() }
      : w
    ),
  })),

  removeWorkflowEdge: (workflowId, edgeId) => set(s => ({
    workflows: s.workflows.map(w => w.id === workflowId
      ? { ...w, edges: w.edges.filter(e => e.id !== edgeId), updatedAt: Date.now() }
      : w
    ),
  })),

  setCurrentExecution: (execution) => set({ currentExecution: execution }),
}));

export default useWorkflowStore;
