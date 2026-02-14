import { useState } from 'react';
import { useWorkflowStore } from '../stores/workflowStore';
import { WORKFLOW_TEMPLATES } from '../types/workflow';
import {
  Workflow,
  Plus,
  Play,
  Trash2,
  X,
  Loader2,
  FileText,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'text-gray-400',
  published: 'text-green-400',
  running: 'text-blue-400',
  completed: 'text-green-400',
  failed: 'text-red-400',
  paused: 'text-yellow-400',
};

export function WorkflowPage() {
  const {
    workflows,
    activeWorkflowId,
    isExecuting,
    createWorkflow,
    deleteWorkflow,
    setActiveWorkflow,
    runWorkflow,
  } = useWorkflowStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [runInputs, setRunInputs] = useState<Record<string, string>>({});
  const [showRunModal, setShowRunModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleCreate = () => {
    if (newWorkflowName.trim()) {
      const id = createWorkflow(newWorkflowName, newWorkflowDesc);
      setNewWorkflowName('');
      setNewWorkflowDesc('');
      setShowCreateModal(false);
      setActiveWorkflow(id);
    }
  };

  const handleRun = async () => {
    if (selectedWorkflow) {
      await runWorkflow(selectedWorkflow, runInputs);
      setShowRunModal(false);
      setRunInputs({});
    }
  };

  const openRunModal = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      const inputs: Record<string, string> = {};
      workflow.inputs.forEach(input => {
        inputs[input.fieldName] = '';
      });
      setRunInputs(inputs);
      setSelectedWorkflow(workflowId);
      setShowRunModal(true);
    }
  };

  const activeWorkflow = workflows.find(w => w.id === activeWorkflowId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Workflow className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">工作流编排</h1>
            <p className="text-sm text-gray-400">创建和运行自动化工作流</p>
          </div>
        </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建工作流
          </button>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showTemplates 
                ? 'bg-purple-600 text-white' 
                : 'border border-white/10 hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            模板库
          </button>
        </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Workflow className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-lg font-medium mb-2">暂无工作流</h2>
            <p className="text-sm mb-4">创建一个工作流来自动化你的任务</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              创建工作流
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map(workflow => (
              <div
                key={workflow.id}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activeWorkflowId === workflow.id
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => setActiveWorkflow(workflow.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <Workflow className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">{workflow.name}</h3>
                      <p className="text-xs text-gray-400">{workflow.nodes.length} 个节点</p>
                    </div>
                  </div>
                  <span className={`text-xs ${statusColors[workflow.status]}`}>
                    {workflow.status === 'draft' && '草稿'}
                    {workflow.status === 'published' && '已发布'}
                    {workflow.status === 'running' && '运行中'}
                    {workflow.status === 'completed' && '已完成'}
                    {workflow.status === 'failed' && '失败'}
                    {workflow.status === 'paused' && '已暂停'}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {workflow.description || '暂无描述'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>运行 {workflow.runCount} 次</span>
                  <span>
                    {workflow.lastRunAt
                      ? new Date(workflow.lastRunAt).toLocaleDateString()
                      : '从未运行'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openRunModal(workflow.id);
                    }}
                    disabled={isExecuting}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    运行
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定要删除这个工作流吗？')) {
                        deleteWorkflow(workflow.id);
                      }
                    }}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Templates Section */}
      {showTemplates && (
        <div className="flex-1 overflow-auto p-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold">工作流模板</h2>
            <span className="text-sm text-gray-400">({WORKFLOW_TEMPLATES.length} 个模板)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WORKFLOW_TEMPLATES.map((template, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-purple-500/50 transition-all cursor-pointer"
                onClick={() => {
                  const id = createWorkflow(template.name, template.description);
                  setActiveWorkflow(id);
                  setShowTemplates(false);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-xs text-gray-400">{template.category}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {template.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{template.nodes.length} 个节点</span>
                  <span className="text-purple-400">点击创建</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">创建工作流</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">名称</label>
                <input
                  type="text"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="输入工作流名称"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">描述</label>
                <textarea
                  value={newWorkflowDesc}
                  onChange={(e) => setNewWorkflowDesc(e.target.value)}
                  placeholder="输入工作流描述（可选）"
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newWorkflowName.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Modal */}
      {showRunModal && activeWorkflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">运行工作流</h2>
              <button
                onClick={() => setShowRunModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-400 mb-4">
                为工作流 "{activeWorkflow.name}" 提供输入参数
              </p>
              {activeWorkflow.inputs.length === 0 ? (
                <p className="text-sm text-gray-500">此工作流不需要输入参数</p>
              ) : (
                activeWorkflow.inputs.map(input => (
                  <div key={input.fieldName}>
                    <label className="block text-sm text-gray-400 mb-1">
                      {input.fieldName}
                      {input.required && <span className="text-red-400"> *</span>}
                    </label>
                    {input.fieldType === 'choice' && input.options ? (
                      <select
                        value={runInputs[input.fieldName] || ''}
                        onChange={(e) => setRunInputs({ ...runInputs, [input.fieldName]: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                      >
                        <option value="">选择...</option>
                        {input.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={input.fieldType === 'file' ? 'file' : 'text'}
                        value={runInputs[input.fieldName] || ''}
                        onChange={(e) => setRunInputs({ ...runInputs, [input.fieldName]: e.target.value })}
                        placeholder={`输入 ${input.fieldName}`}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                      />
                    )}
                  </div>
                ))
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowRunModal(false)}
                  className="flex-1 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleRun}
                  disabled={isExecuting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      运行中...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      运行
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowPage;
