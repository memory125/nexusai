/**
 * Data Management Service
 * 
 * Features:
 * - Data backup and restore
 * - Storage cleanup and optimization
 * - Data export/import
 * - Storage usage statistics
 * - Auto cleanup policies
 */

import { useStore, Conversation, Agent, Skill, ModelProvider } from '../store';

export interface BackupData {
  version: string;
  timestamp: number;
  conversations: Conversation[];
  agents: Agent[];
  skills: Skill[];
  settings: {
    theme: string;
    selectedModel: string;
    selectedProvider: string;
    [key: string]: any;
  };
  metadata: {
    totalConversations: number;
    totalMessages: number;
    backupSize: number;
  };
}

export interface StorageStats {
  totalSize: number;
  conversationsSize: number;
  knowledgeBaseSize: number;
  cacheSize: number;
  settingsSize: number;
  itemCount: {
    conversations: number;
    messages: number;
    knowledgeBases: number;
    documents: number;
  };
}

export interface CleanupOptions {
  olderThan?: number; // days
  keepStarred?: boolean;
  keepRecent?: number; // keep last N conversations
  clearCache?: boolean;
  clearHistory?: boolean;
}

export class DataManagementService {
  private readonly CURRENT_VERSION = '1.0.0';
  private readonly BACKUP_KEY = 'nexusai_backup';
  private readonly MAX_BACKUP_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * Create full backup
   */
  async createBackup(): Promise<BackupData> {
    const store = useStore.getState();
    
    const backup: BackupData = {
      version: this.CURRENT_VERSION,
      timestamp: Date.now(),
      conversations: store.conversations,
      agents: store.agents,
      skills: store.skills,
      settings: {
        theme: store.theme,
        selectedModel: store.selectedModel,
        selectedProvider: store.selectedProvider,
      },
      metadata: {
        totalConversations: store.conversations.length,
        totalMessages: store.conversations.reduce((sum, c) => sum + c.messages.length, 0),
        backupSize: 0,
      },
    };

    // Calculate size
    const backupJson = JSON.stringify(backup);
    backup.metadata.backupSize = new Blob([backupJson]).size;

    // Save to localStorage
    this.saveBackupToStorage(backup);

    return backup;
  }

  /**
   * Save backup to localStorage
   */
  private saveBackupToStorage(backup: BackupData) {
    try {
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
    } catch (error) {
      console.error('Failed to save backup:', error);
      throw new Error('存储空间不足，请清理数据后再试');
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupData: BackupData | string): Promise<boolean> {
    try {
      const backup: BackupData = typeof backupData === 'string' 
        ? JSON.parse(backupData) 
        : backupData;

      // Version check
      if (!this.isCompatibleVersion(backup.version)) {
        throw new Error(`备份版本 ${backup.version} 不兼容当前版本`);
      }

      const store = useStore.getState();

      // Restore data
      store.conversations.forEach(c => store.deleteConversation(c.id));
      backup.conversations.forEach(c => {
        store.conversations.push(c);
      });

      // Restore settings
      if (backup.settings.theme) {
        store.setTheme(backup.settings.theme);
      }

      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }

  /**
   * Check version compatibility
   */
  private isCompatibleVersion(version: string): boolean {
    // Simple version check - in production, use semver
    return version.startsWith('1.');
  }

  /**
   * Export backup as file
   */
  downloadBackup(backup?: BackupData) {
    const data = backup || localStorage.getItem(this.BACKUP_KEY);
    if (!data) {
      throw new Error('没有可用的备份');
    }

    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexusai-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import backup from file
   */
  async importBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const backup = JSON.parse(content);
          resolve(backup);
        } catch (error) {
          reject(new Error('无效的备份文件'));
        }
      };

      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const store = useStore.getState();
    
    const conversationsJson = JSON.stringify(store.conversations);
    const settingsJson = JSON.stringify({
      theme: store.theme,
      selectedModel: store.selectedModel,
      selectedProvider: store.selectedProvider,
    });

    // Calculate sizes
    const conversationsSize = new Blob([conversationsJson]).size;
    const settingsSize = new Blob([settingsJson]).size;
    
    // Estimate cache size
    let cacheSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('rag'))) {
        cacheSize += (localStorage.getItem(key)?.length || 0) * 2; // UTF-16
      }
    }

    const totalMessages = store.conversations.reduce((sum, c) => sum + c.messages.length, 0);

    return {
      totalSize: conversationsSize + settingsSize + cacheSize,
      conversationsSize,
      knowledgeBaseSize: cacheSize, // Approximation
      cacheSize,
      settingsSize,
      itemCount: {
        conversations: store.conversations.length,
        messages: totalMessages,
        knowledgeBases: 0, // Would need to get from knowledge base store
        documents: 0,
      },
    };
  }

  /**
   * Clean up data based on options
   */
  async cleanup(options: CleanupOptions): Promise<{
    deletedConversations: number;
    deletedMessages: number;
    freedSpace: number;
  }> {
    const store = useStore.getState();
    const stats = { deletedConversations: 0, deletedMessages: 0, freedSpace: 0 };

    const beforeSize = JSON.stringify(store.conversations).length;

    // Filter conversations to keep
    const conversationsToDelete: string[] = [];
    
    store.conversations.forEach((conv, index) => {
      let shouldDelete = false;

      // Check age
      if (options.olderThan) {
        const age = Date.now() - conv.updatedAt;
        const ageDays = age / (1000 * 60 * 60 * 24);
        if (ageDays > options.olderThan) {
          shouldDelete = true;
        }
      }

      // Keep recent conversations
      if (options.keepRecent !== undefined && index < options.keepRecent) {
        shouldDelete = false;
      }

      // TODO: Check if conversation is starred

      if (shouldDelete) {
        conversationsToDelete.push(conv.id);
      }
    });

    // Delete conversations
    conversationsToDelete.forEach(id => {
      const conv = store.conversations.find(c => c.id === id);
      if (conv) {
        stats.deletedMessages += conv.messages.length;
        stats.deletedConversations++;
        store.deleteConversation(id);
      }
    });

    // Clear cache if requested
    if (options.clearCache) {
      this.clearCache();
    }

    // Calculate freed space
    const afterSize = JSON.stringify(store.conversations).length;
    stats.freedSpace = Math.max(0, beforeSize - afterSize);

    return stats;
  }

  /**
   * Clear all cache
   */
  clearCache() {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('rag') || key.includes('search'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Auto cleanup based on policy
   */
  async autoCleanup(): Promise<void> {
    const policy = {
      maxConversations: 100,
      maxAge: 90, // days
      maxStorageSize: 50 * 1024 * 1024, // 50MB
    };

    const store = useStore.getState();
    const stats = await this.getStorageStats();

    // Check if cleanup needed
    if (store.conversations.length > policy.maxConversations || 
        stats.totalSize > policy.maxStorageSize) {
      
      await this.cleanup({
        keepRecent: 50,
        olderThan: policy.maxAge,
        clearCache: true,
      });
    }
  }

  /**
   * Delete all data
   */
  async deleteAllData(): Promise<void> {
    const store = useStore.getState();
    
    // Delete all conversations
    store.conversations.forEach(c => store.deleteConversation(c.id));

    // Clear all storage
    localStorage.clear();
  }

  /**
   * Get last backup info
   */
  getLastBackupInfo(): { exists: boolean; date?: Date; size?: number } {
    const backupData = localStorage.getItem(this.BACKUP_KEY);
    if (!backupData) {
      return { exists: false };
    }

    try {
      const backup: BackupData = JSON.parse(backupData);
      return {
        exists: true,
        date: new Date(backup.timestamp),
        size: backup.metadata.backupSize,
      };
    } catch {
      return { exists: false };
    }
  }

  /**
   * Schedule automatic backups
   */
  scheduleAutoBackup(intervalHours: number = 24) {
    // Check if backup needed on page load
    const lastBackup = this.getLastBackupInfo();
    
    if (!lastBackup.exists || !lastBackup.date) {
      this.createBackup();
      return;
    }

    const hoursSinceLastBackup = (Date.now() - lastBackup.date.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastBackup >= intervalHours) {
      this.createBackup();
    }

    // Set up interval for future backups
    setInterval(() => {
      this.createBackup();
    }, intervalHours * 60 * 60 * 1000);
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check storage quota
   */
  async checkStorageQuota(): Promise<{
    usage: number;
    quota: number;
    percentage: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      
      return {
        usage,
        quota,
        percentage: quota > 0 ? (usage / quota) * 100 : 0,
      };
    }

    return { usage: 0, quota: 0, percentage: 0 };
  }
}

// Singleton instance
export const dataManagementService = new DataManagementService();
export default dataManagementService;
