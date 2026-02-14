import { useState, useEffect } from 'react';
import { 
  Database, Download, Trash2, AlertTriangle, 
  CheckCircle, FileJson, HardDrive, Clock,
  Archive, RotateCcw, BarChart3
} from 'lucide-react';
import { dataManagementService, StorageStats } from '../services/dataManagementService';

export function DataManagementPage() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [backupInfo, setBackupInfo] = useState<{ exists: boolean; date?: Date; size?: number }>({ exists: false });
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [quota, setQuota] = useState({ usage: 0, quota: 0, percentage: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const storageStats = await dataManagementService.getStorageStats();
    const info = dataManagementService.getLastBackupInfo();
    const storageQuota = await dataManagementService.checkStorageQuota();
    setStats(storageStats);
    setBackupInfo(info);
    setQuota(storageQuota);
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await dataManagementService.createBackup();
      await loadData();
      showMessage('success', '备份创建成功');
    } catch (error) {
      showMessage('error', '备份失败: ' + (error as Error).message);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadBackup = () => {
    try {
      dataManagementService.downloadBackup();
      showMessage('success', '备份下载已开始');
    } catch (error) {
      showMessage('error', '下载失败: ' + (error as Error).message);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const backup = await dataManagementService.importBackup(file);
      const success = await dataManagementService.restoreBackup(backup);
      if (success) {
        await loadData();
        showMessage('success', '数据恢复成功');
      } else {
        showMessage('error', '数据恢复失败');
      }
    } catch (error) {
      showMessage('error', '导入失败: ' + (error as Error).message);
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  const handleCleanup = async () => {
    try {
      const result = await dataManagementService.cleanup({
        olderThan: 90,
        keepRecent: 50,
        clearCache: true,
      });
      await loadData();
      showMessage('success', `清理完成: 删除了 ${result.deletedConversations} 个对话，释放了 ${dataManagementService.formatBytes(result.freedSpace)}`);
    } catch (error) {
      showMessage('error', '清理失败: ' + (error as Error).message);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await dataManagementService.deleteAllData();
      setShowDeleteConfirm(false);
      await loadData();
      showMessage('success', '所有数据已删除');
    } catch (error) {
      showMessage('error', '删除失败: ' + (error as Error).message);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4" style={{ borderBottom: '1px solid var(--t-glass-border)' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/20">
            <Database className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--t-text)' }}>数据管理</h2>
            <p className="text-xs" style={{ color: 'var(--t-text-secondary)' }}>备份、恢复、清理与存储统计</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-400" />
          )}
          <span className="text-sm" style={{ color: message.type === 'success' ? '#4ade80' : '#f87171' }}>
            {message.text}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Storage Stats */}
          <section className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--t-text)' }}>
              <BarChart3 className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
              存储统计
            </h3>
            
            {stats && (
              <div className="space-y-4">
                {/* Total Usage */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-4 w-4" style={{ color: 'var(--t-text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--t-text-secondary)' }}>总使用量</span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>
                    {dataManagementService.formatBytes(stats.totalSize)}
                  </span>
                </div>

                {/* Storage Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5">
                    <div className="text-xs mb-1" style={{ color: 'var(--t-text-muted)' }}>对话</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>
                      {stats.itemCount.conversations} 个
                    </div>
                    <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                      {dataManagementService.formatBytes(stats.conversationsSize)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <div className="text-xs mb-1" style={{ color: 'var(--t-text-muted)' }}>消息</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>
                      {stats.itemCount.messages} 条
                    </div>
                  </div>
                </div>

                {/* Quota */}
                {quota.quota > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--t-text-muted)' }}>
                      <span>存储配额</span>
                      <span>{quota.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(quota.percentage, 100)}%`,
                          background: quota.percentage > 80 ? '#ef4444' : quota.percentage > 50 ? '#f59e0b' : '#10b981'
                        }}
                      />
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--t-text-muted)' }}>
                      已使用 {dataManagementService.formatBytes(quota.usage)} / {dataManagementService.formatBytes(quota.quota)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Backup & Restore */}
          <section className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--t-text)' }}>
              <Archive className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
              备份与恢复
            </h3>

            {/* Last Backup */}
            {backupInfo.exists && backupInfo.date && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 mb-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4" style={{ color: 'var(--t-text-muted)' }} />
                  <div>
                    <div className="text-sm" style={{ color: 'var(--t-text)' }}>上次备份</div>
                    <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                      {backupInfo.date.toLocaleString('zh-CN')}
                      {backupInfo.size && ` · ${dataManagementService.formatBytes(backupInfo.size)}`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDownloadBackup}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Download className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm disabled:opacity-50"
                style={{ color: 'var(--t-text)' }}
              >
                {isCreatingBackup ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                创建备份
              </button>

              <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm cursor-pointer disabled:opacity-50">
                {isRestoring ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                恢复备份
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  disabled={isRestoring}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleDownloadBackup}
                disabled={!backupInfo.exists}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm disabled:opacity-50"
                style={{ color: 'var(--t-text)' }}
              >
                <FileJson className="h-4 w-4" />
                下载备份
              </button>
            </div>
          </section>

          {/* Cleanup */}
          <section className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--t-text)' }}>
              <Trash2 className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />
              数据清理
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <div className="text-sm" style={{ color: 'var(--t-text)' }}>自动清理</div>
                  <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                    删除90天前的对话，保留最近50个
                  </div>
                </div>
                <button
                  onClick={handleCleanup}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm transition-colors"
                >
                  开始清理
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <div className="text-sm" style={{ color: 'var(--t-text)' }}>清除缓存</div>
                  <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                    清除搜索缓存和临时数据
                  </div>
                </div>
                <button
                  onClick={() => {
                    dataManagementService.clearCache();
                    showMessage('success', '缓存已清除');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
                  style={{ color: 'var(--t-text)' }}
                >
                  清除
                </button>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="glass-card rounded-2xl p-5 border border-red-500/20">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              危险区域
            </h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10">
              <div>
                <div className="text-sm" style={{ color: 'var(--t-text)' }}>删除所有数据</div>
                <div className="text-xs text-red-400/70">
                  此操作不可撤销，所有对话和设置将被永久删除
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors"
              >
                删除全部
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card rounded-2xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--t-text)' }}>确认删除</h3>
                <p className="text-sm" style={{ color: 'var(--t-text-muted)' }}>此操作不可撤销</p>
              </div>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--t-text-secondary)' }}>
              您确定要删除所有数据吗？所有对话、设置和缓存将被永久删除。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
                style={{ color: 'var(--t-text)' }}
              >
                取消
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
