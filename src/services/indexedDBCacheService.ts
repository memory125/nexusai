// IndexedDB Cache Service for RAG Vector Index and Document Processing
// Provides persistent caching for embeddings and search indices

const DB_NAME = 'NexusAI_RAG_Cache';
const DB_VERSION = 1;

enum StoreNames {
  VECTOR_INDEX = 'vector_index',
  DOCUMENT_CACHE = 'document_cache',
  SEARCH_CACHE = 'search_cache',
  EMBEDDING_CACHE = 'embedding_cache',
  METADATA = 'metadata',
}

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  size: number; // Size in bytes for cache management
}

interface VectorIndexEntry {
  knowledgeBaseId: string;
  chunkId: string;
  vector: number[];
  dimensions: number;
  timestamp: number;
}

interface DocumentCacheEntry {
  fileHash: string;
  fileName: string;
  content: string;
  chunks: string[];
  timestamp: number;
}

interface SearchCacheEntry {
  queryHash: string;
  knowledgeBaseIds: string[];
  results: Array<{ chunkId: string; score: number }>;
  timestamp: number;
  hitCount: number;
}

interface EmbeddingCacheEntry {
  textHash: string;
  modelId: string;
  embedding: number[];
  timestamp: number;
}

class IndexedDBCacheService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Vector index store
        if (!db.objectStoreNames.contains(StoreNames.VECTOR_INDEX)) {
          const vectorStore = db.createObjectStore(StoreNames.VECTOR_INDEX, { keyPath: 'key' });
          vectorStore.createIndex('knowledgeBaseId', 'knowledgeBaseId', { unique: false });
          vectorStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Document cache store
        if (!db.objectStoreNames.contains(StoreNames.DOCUMENT_CACHE)) {
          const docStore = db.createObjectStore(StoreNames.DOCUMENT_CACHE, { keyPath: 'fileHash' });
          docStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Search cache store
        if (!db.objectStoreNames.contains(StoreNames.SEARCH_CACHE)) {
          const searchStore = db.createObjectStore(StoreNames.SEARCH_CACHE, { keyPath: 'queryHash' });
          searchStore.createIndex('timestamp', 'timestamp', { unique: false });
          searchStore.createIndex('hitCount', 'hitCount', { unique: false });
        }

        // Embedding cache store
        if (!db.objectStoreNames.contains(StoreNames.EMBEDDING_CACHE)) {
          const embeddingStore = db.createObjectStore(StoreNames.EMBEDDING_CACHE, { keyPath: 'key' });
          embeddingStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Metadata store
        if (!db.objectStoreNames.contains(StoreNames.METADATA)) {
          db.createObjectStore(StoreNames.METADATA, { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  private async getStore(storeName: StoreNames, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  private generateKey(...parts: string[]): string {
    return parts.join('_');
  }

  private async set<T>(storeName: StoreNames, key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      size: JSON.stringify(data).length,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async get<T>(storeName: StoreNames, key: string): Promise<T | null> {
    const store = await this.getStore(storeName, 'readonly');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const entry: CacheEntry<T> | undefined = request.result;
        if (!entry) {
          resolve(null);
          return;
        }

        // Check TTL
        if (Date.now() - entry.timestamp > entry.ttl) {
          this.delete(storeName, key);
          resolve(null);
          return;
        }

        resolve(entry.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async delete(storeName: StoreNames, key: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clear(storeName: StoreNames): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // ============== Vector Index Cache ==============

  async cacheVectorIndex(knowledgeBaseId: string, chunks: Array<{ id: string; embedding: number[] }>): Promise<void> {
    const entries = chunks.map(chunk => ({
      key: this.generateKey(knowledgeBaseId, chunk.id),
      knowledgeBaseId,
      chunkId: chunk.id,
      vector: chunk.embedding,
      dimensions: chunk.embedding.length,
      timestamp: Date.now(),
    }));

    const store = await this.getStore(StoreNames.VECTOR_INDEX, 'readwrite');
    
    return new Promise((resolve, reject) => {
      let completed = 0;
      let hasError = false;

      entries.forEach(entry => {
        const request = store.put(entry);
        request.onsuccess = () => {
          completed++;
          if (completed === entries.length && !hasError) {
            resolve();
          }
        };
        request.onerror = () => {
          hasError = true;
          reject(request.error);
        };
      });

      if (entries.length === 0) resolve();
    });
  }

  async getVectorIndex(knowledgeBaseId: string): Promise<Map<string, number[]> | null> {
    const store = await this.getStore(StoreNames.VECTOR_INDEX, 'readonly');
    const index = store.index('knowledgeBaseId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(knowledgeBaseId);
      request.onsuccess = () => {
        const entries: VectorIndexEntry[] = request.result;
        if (entries.length === 0) {
          resolve(null);
          return;
        }

        const vectors = new Map<string, number[]>();
        entries.forEach(entry => {
          vectors.set(entry.chunkId, entry.vector);
        });
        resolve(vectors);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteVectorIndex(knowledgeBaseId: string): Promise<void> {
    const store = await this.getStore(StoreNames.VECTOR_INDEX, 'readwrite');
    const index = store.index('knowledgeBaseId');

    return new Promise((resolve, reject) => {
      const request = index.getAllKeys(knowledgeBaseId);
      request.onsuccess = () => {
        const keys = request.result as string[];
        let completed = 0;

        keys.forEach(key => {
          const deleteRequest = store.delete(key);
          deleteRequest.onsuccess = () => {
            completed++;
            if (completed === keys.length) resolve();
          };
        });

        if (keys.length === 0) resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============== Document Cache ==============

  async cacheDocument(file: File, chunks: string[]): Promise<void> {
    const fileHash = await this.computeFileHash(file);
    const content = await file.text();

    const entry: DocumentCacheEntry = {
      fileHash,
      fileName: file.name,
      content: content.slice(0, 10000), // Limit stored content
      chunks,
      timestamp: Date.now(),
    };

    await this.set(StoreNames.DOCUMENT_CACHE, fileHash, entry);
  }

  async getCachedDocument(file: File): Promise<DocumentCacheEntry | null> {
    const fileHash = await this.computeFileHash(file);
    return this.get(StoreNames.DOCUMENT_CACHE, fileHash);
  }

  private async computeFileHash(file: File): Promise<string> {
    // Simple hash based on file metadata and first/last chunks
    const buffer = await file.slice(0, 1024).arrayBuffer();
    const lastBuffer = await file.slice(Math.max(0, file.size - 1024)).arrayBuffer();
    
    const combined = new Uint8Array(buffer.byteLength + lastBuffer.byteLength);
    combined.set(new Uint8Array(buffer), 0);
    combined.set(new Uint8Array(lastBuffer), buffer.byteLength);
    
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined[i];
      hash = hash & hash;
    }
    
    return `${file.name}_${file.size}_${Math.abs(hash).toString(36)}`;
  }

  // ============== Search Cache ==============

  async cacheSearchResults(
    query: string,
    knowledgeBaseIds: string[],
    results: Array<{ chunkId: string; score: number }>
  ): Promise<void> {
    const queryHash = this.hashString(`${query}_${knowledgeBaseIds.sort().join(',')}`);
    
    const entry: SearchCacheEntry = {
      queryHash,
      knowledgeBaseIds,
      results,
      timestamp: Date.now(),
      hitCount: 1,
    };

    await this.set(StoreNames.SEARCH_CACHE, queryHash, entry, 60 * 60 * 1000); // 1 hour TTL
  }

  async getCachedSearchResults(
    query: string,
    knowledgeBaseIds: string[]
  ): Promise<Array<{ chunkId: string; score: number }> | null> {
    const queryHash = this.hashString(`${query}_${knowledgeBaseIds.sort().join(',')}`);
    const entry = await this.get<SearchCacheEntry>(StoreNames.SEARCH_CACHE, queryHash);
    
    if (entry) {
      // Update hit count
      entry.hitCount++;
      await this.set(StoreNames.SEARCH_CACHE, queryHash, entry, 60 * 60 * 1000);
    }
    
    return entry?.results || null;
  }

  // ============== Embedding Cache ==============

  async cacheEmbedding(text: string, modelId: string, embedding: number[]): Promise<void> {
    const textHash = this.hashString(`${text}_${modelId}`);
    const key = this.generateKey('emb', textHash);
    
    const entry: EmbeddingCacheEntry = {
      textHash,
      modelId,
      embedding,
      timestamp: Date.now(),
    };

    await this.set(StoreNames.EMBEDDING_CACHE, key, entry, 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  async getCachedEmbedding(text: string, modelId: string): Promise<number[] | null> {
    const textHash = this.hashString(`${text}_${modelId}`);
    const key = this.generateKey('emb', textHash);
    const entry = await this.get<EmbeddingCacheEntry>(StoreNames.EMBEDDING_CACHE, key);
    return entry?.embedding || null;
  }

  // ============== Cache Management ==============

  async clearAllCache(): Promise<void> {
    await Promise.all([
      this.clear(StoreNames.VECTOR_INDEX),
      this.clear(StoreNames.DOCUMENT_CACHE),
      this.clear(StoreNames.SEARCH_CACHE),
      this.clear(StoreNames.EMBEDDING_CACHE),
    ]);
  }

  async clearKnowledgeBaseCache(knowledgeBaseId: string): Promise<void> {
    await this.deleteVectorIndex(knowledgeBaseId);
  }

  async getCacheStats(): Promise<{
    vectorIndexCount: number;
    documentCacheCount: number;
    searchCacheCount: number;
    embeddingCacheCount: number;
    totalSize: number;
  }> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const stats = {
      vectorIndexCount: 0,
      documentCacheCount: 0,
      searchCacheCount: 0,
      embeddingCacheCount: 0,
      totalSize: 0,
    };

    for (const storeName of Object.values(StoreNames)) {
      const store = await this.getStore(storeName, 'readonly');
      const count = await new Promise<number>((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      switch (storeName) {
        case StoreNames.VECTOR_INDEX:
          stats.vectorIndexCount = count;
          break;
        case StoreNames.DOCUMENT_CACHE:
          stats.documentCacheCount = count;
          break;
        case StoreNames.SEARCH_CACHE:
          stats.searchCacheCount = count;
          break;
        case StoreNames.EMBEDDING_CACHE:
          stats.embeddingCacheCount = count;
          break;
      }
    }

    return stats;
  }

  // Cleanup expired entries
  async cleanup(): Promise<void> {
    await this.init();
    if (!this.db) return;

    const now = Date.now();

    for (const storeName of Object.values(StoreNames)) {
      const store = await this.getStore(storeName, 'readwrite');
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          const entry: CacheEntry<any> = cursor.value;
          if (now - entry.timestamp > entry.ttl) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    }
  }
}

// Singleton instance
export const indexedDBCacheService = new IndexedDBCacheService();
export default indexedDBCacheService;
