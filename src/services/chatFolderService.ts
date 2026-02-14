import { useStore, type ChatFolder, type Conversation } from '../store';

const STORAGE_KEY = 'nexusai_chat_folders';

class ChatFolderService {
  /**
   * Get all folders from storage
   */
  getFolders(): ChatFolder[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading folders:', e);
    }
    return [];
  }

  /**
   * Save folders to storage
   */
  saveFolders(folders: ChatFolder[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
    } catch (e) {
      console.error('Error saving folders:', e);
    }
  }

  /**
   * Initialize folders from storage to store
   */
  initFolders(): void {
    const folders = this.getFolders();
    const store = useStore.getState();
    // Only set if store is empty
    if (store.folders.length === 0 && folders.length > 0) {
      folders.forEach(folder => {
        store.createFolder(folder.name, folder.color);
      });
    }
  }

  /**
   * Get conversations by folder
   */
  getConversationsByFolder(folderId: string | undefined): Conversation[] {
    const store = useStore.getState();
    return store.conversations.filter(c => c.folderId === folderId);
  }

  /**
   * Get uncategorized conversations (no folder)
   */
  getUncategorizedConversations(): Conversation[] {
    const store = useStore.getState();
    return store.conversations.filter(c => !c.folderId);
  }

  /**
   * Get folder by ID
   */
  getFolderById(id: string): ChatFolder | undefined {
    const store = useStore.getState();
    return store.folders.find(f => f.id === id);
  }

  /**
   * Get conversation count in folder
   */
  getConversationCount(folderId: string): number {
    const store = useStore.getState();
    return store.conversations.filter(c => c.folderId === folderId).length;
  }
}

export const chatFolderService = new ChatFolderService();
export default chatFolderService;
