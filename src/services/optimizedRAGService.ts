// Optimized RAG Service with Performance Enhancements
// Features:
// - Web Worker for non-blocking embedding generation
// - IndexedDB caching for vectors, documents, and search results
// - HNSW vector index for fast approximate nearest neighbor search
// - Search result caching with TTL
// - Incremental index updates

import { Document, DocumentChunk, splitTextIntoChunks } from '../types/rag';
import { DocumentParser } from './documentParser';
import { EmbeddingService, EmbeddingConfig, RAGPerformanceStats } from './embeddingService';
import { AdaptiveVectorIndex } from './hnswVectorIndex';
import { indexedDBCacheService } from './indexedDBCacheService';
import { ragWorkerManager } from './ragWorkerManager';

interface ProcessingOptions {
  useWorker?: boolean;
  useCache?: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
}

interface SearchOptions {
  useCache?: boolean;
  topK?: number;
  filterByKnowledgeBase?: string[];
  minScore?: number;
}

export class OptimizedRAGService {
  private embeddingService: EmbeddingService;
  private vectorIndex: AdaptiveVectorIndex;
  private knowledgeBaseId: string;
  private config: EmbeddingConfig;

  constructor(knowledgeBaseId: string, config: EmbeddingConfig) {
    this.knowledgeBaseId = knowledgeBaseId;
    this.config = config;
    this.embeddingService = new EmbeddingService(config);
    
    // Get dimensions from selected model
    const { EMBEDDING_MODELS } = require('./embeddingService');
    const model = EMBEDDING_MODELS.find((m: any) => m.id === config.model);
    const dimensions = model?.dimensions || 384;
    
    this.vectorIndex = new AdaptiveVectorIndex(dimensions);
  }

  // Initialize and load cached index
  async initialize(): Promise<void> {
    // Try to load cached vector index
    const cachedVectors = await indexedDBCacheService.getVectorIndex(this.knowledgeBaseId);
    if (cachedVectors) {
      for (const [chunkId, vector] of cachedVectors) {
        this.vectorIndex.add(chunkId, vector);
      }
    }
  }

  // Process document with optimizations
  async processDocument(
    file: File,
    onProgress?: (progress: number) => void,
    options: ProcessingOptions = {}
  ): Promise<{ document: Document; chunks: DocumentChunk[] }> {
    const {
      useWorker = true,
      useCache = true,
      chunkSize = 800,
      chunkOverlap = 100,
    } = options;

    // 1. Check document cache
    if (useCache) {
      onProgress?.(5);
      const cached = await indexedDBCacheService.getCachedDocument(file);
      if (cached) {
        onProgress?.(30);
        // Reuse cached chunks but generate new embeddings if needed
        const chunks: DocumentChunk[] = cached.chunks.map((content, index) => ({
          id: `chunk_${Date.now()}_${index}`,
          content,
          metadata: {
            documentId: `doc_${Date.now()}`,
            documentName: file.name,
            chunkIndex: index,
            totalChunks: cached.chunks.length,
          },
          embedding: undefined, // Will be generated
        }));

        // Generate embeddings using worker or main thread
        await this.generateEmbeddingsForChunks(chunks, onProgress, useWorker);

        const document: Document = {
          id: `doc_${Date.now()}`,
          name: file.name,
          type: file.type || file.name.split('.').pop() || 'unknown',
          size: file.size,
          content: cached.content,
          chunks: chunks.map(c => c.id),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        return { document, chunks };
      }
    }

    // 2. Parse document
    onProgress?.(10);
    const parsedDoc = await DocumentParser.parseFile(file);
    const content = parsedDoc.content;

    // 3. Split into chunks
    onProgress?.(20);
    const chunkTexts = splitTextIntoChunks(content, chunkSize, chunkOverlap);

    // 4. Cache document for future use
    if (useCache) {
      await indexedDBCacheService.cacheDocument(file, chunkTexts);
    }

    // 5. Generate embeddings
    onProgress?.(30);
    const documentId = `doc_${Date.now()}`;
    
    const chunks: DocumentChunk[] = chunkTexts.map((chunkText, index) => ({
      id: `chunk_${Date.now()}_${index}`,
      content: chunkText,
      metadata: {
        documentId,
        documentName: file.name,
        chunkIndex: index,
        totalChunks: chunkTexts.length,
      },
      embedding: undefined,
    }));

    await this.generateEmbeddingsForChunks(chunks, onProgress, useWorker);

    // 6. Create document
    const document: Document = {
      id: documentId,
      name: file.name,
      type: file.type || file.name.split('.').pop() || 'unknown',
      size: file.size,
      content: content.slice(0, 10000),
      chunks: chunks.map(c => c.id),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onProgress?.(100);
    return { document, chunks };
  }

  // Generate embeddings with worker support
  private async generateEmbeddingsForChunks(
    chunks: DocumentChunk[],
    onProgress?: (progress: number) => void,
    useWorker: boolean = true
  ): Promise<void> {
    // Check embedding cache first
    const texts = chunks.map(c => c.content);
    const cachedEmbeddings: (number[] | null)[] = await Promise.all(
      texts.map(text => indexedDBCacheService.getCachedEmbedding(text, this.config.model))
    );

    const uncachedIndices: number[] = [];
    const uncachedTexts: string[] = [];

    cachedEmbeddings.forEach((embedding, index) => {
      if (embedding) {
        chunks[index].embedding = embedding;
      } else {
        uncachedIndices.push(index);
        uncachedTexts.push(texts[index]);
      }
    });

    if (uncachedTexts.length === 0) {
      onProgress?.(90);
      return;
    }

    // Generate embeddings for uncached texts
    let chunkEmbeddings: number[][];

    if (useWorker && ragWorkerManager.isAvailable()) {
      // Use Web Worker for non-blocking generation
      chunkEmbeddings = await ragWorkerManager.generateBatchEmbeddings(
        uncachedTexts,
        384,
        10,
        (progress) => {
          onProgress?.(30 + progress * 0.6);
        }
      );
    } else {
      // Fallback to main thread with batching
      chunkEmbeddings = [];
      const batchSize = 10;
      
      for (let i = 0; i < uncachedTexts.length; i += batchSize) {
        const batch = uncachedTexts.slice(i, i + batchSize);
        const batchEmbeddings = await Promise.all(
          batch.map(text => this.embeddingService.generateEmbedding(text))
        );
        chunkEmbeddings.push(...batchEmbeddings);
        
        const progress = 30 + ((i + batch.length) / uncachedTexts.length) * 60;
        onProgress?.(Math.min(progress, 90));
      }
    }

    // Assign embeddings and cache them
    uncachedIndices.forEach((index, i) => {
      chunks[index].embedding = chunkEmbeddings[i];
      
      // Cache embedding
      indexedDBCacheService.cacheEmbedding(
        texts[index],
        this.config.model,
        chunkEmbeddings[i]
      );
    });
  }

  // Search with caching and pre-filtering
  async searchRelevantChunks(
    query: string,
    chunks: DocumentChunk[],
    options: SearchOptions = {}
  ): Promise<{
    results: Array<{ chunk: DocumentChunk; score: number }>;
    stats: RAGPerformanceStats;
    fromCache: boolean;
  }> {
    const {
      useCache = true,
      topK = 5,
      minScore = 0,
    } = options;

    const startTime = performance.now();

    // Check search cache
    if (useCache) {
      const cachedResults = await indexedDBCacheService.getCachedSearchResults(
        query,
        [this.knowledgeBaseId]
      );
      
      if (cachedResults) {
        const results = cachedResults
          .map(r => {
            const chunk = chunks.find(c => c.id === r.chunkId);
            return chunk ? { chunk, score: r.score } : null;
          })
          .filter((item): item is { chunk: DocumentChunk; score: number } => item !== null);

        return {
          results,
          stats: {
            retrievalTime: 0,
            embeddingTime: 0,
            totalTime: performance.now() - startTime,
            chunksSearched: chunks.length,
            chunksRetrieved: results.length,
            tokensUsed: Math.ceil(query.length / 2),
            timestamp: Date.now(),
          },
          fromCache: true,
        };
      }
    }

    // Generate query embedding
    const embeddingStartTime = performance.now();
    let queryEmbedding: number[];

    // Check embedding cache
    const cachedEmbedding = await indexedDBCacheService.getCachedEmbedding(query, this.config.model);
    if (cachedEmbedding) {
      queryEmbedding = cachedEmbedding;
    } else {
      queryEmbedding = await this.embeddingService.generateEmbedding(query);
      await indexedDBCacheService.cacheEmbedding(query, this.config.model, queryEmbedding);
    }

    const embeddingTime = performance.now() - embeddingStartTime;

    // Rebuild index if needed
    if (this.vectorIndex.size() !== chunks.length) {
      this.vectorIndex.clear();
      chunks.forEach(chunk => {
        if (chunk.embedding) {
          this.vectorIndex.add(chunk.id, chunk.embedding);
        }
      });

      // Cache vector index
      await indexedDBCacheService.cacheVectorIndex(
        this.knowledgeBaseId,
        chunks.filter(c => c.embedding).map(c => ({ id: c.id, embedding: c.embedding! }))
      );
    }

    // Search using optimized index
    const retrievalStartTime = performance.now();
    const searchResults = this.vectorIndex.search(queryEmbedding, topK * 2); // Get more results for filtering
    const retrievalTime = performance.now() - retrievalStartTime;

    // Map results back to chunks and filter by score
    const results = searchResults
      .map(result => {
        const chunk = chunks.find(c => c.id === result.id);
        return chunk ? { chunk, score: result.score } : null;
      })
      .filter((item): item is { chunk: DocumentChunk; score: number } => item !== null)
      .filter(item => item.score >= minScore)
      .slice(0, topK);

    const totalTime = performance.now() - startTime;

    // Cache search results
    if (useCache) {
      await indexedDBCacheService.cacheSearchResults(
        query,
        [this.knowledgeBaseId],
        results.map(r => ({ chunkId: r.chunk.id, score: r.score }))
      );
    }

    const stats: RAGPerformanceStats = {
      retrievalTime: Math.round(retrievalTime),
      embeddingTime: Math.round(embeddingTime),
      totalTime: Math.round(totalTime),
      chunksSearched: chunks.length,
      chunksRetrieved: results.length,
      tokensUsed: Math.ceil(query.length / 2),
      timestamp: Date.now(),
    };

    return { results, stats, fromCache: false };
  }

  // Incremental update - add new chunks without rebuilding entire index
  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    // Add to index
    chunks.forEach(chunk => {
      if (chunk.embedding) {
        this.vectorIndex.add(chunk.id, chunk.embedding);
      }
    });

    // Update cache
    await indexedDBCacheService.cacheVectorIndex(
      this.knowledgeBaseId,
      chunks.filter(c => c.embedding).map(c => ({ id: c.id, embedding: c.embedding! }))
    );
  }

  // Remove chunks from index
  async removeChunks(chunkIds: string[]): Promise<void> {
    chunkIds.forEach(id => {
      this.vectorIndex.remove(id);
    });

    // Note: Full cache update would require all chunks, handled separately
  }

  // Clear all cache for this knowledge base
  async clearCache(): Promise<void> {
    await indexedDBCacheService.clearKnowledgeBaseCache(this.knowledgeBaseId);
    this.vectorIndex.clear();
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    vectorIndexSize: number;
    dbStats: Awaited<ReturnType<typeof indexedDBCacheService.getCacheStats>>;
  }> {
    const dbStats = await indexedDBCacheService.getCacheStats();
    return {
      vectorIndexSize: this.vectorIndex.size(),
      dbStats,
    };
  }

  // Get index statistics
  getIndexStats(): object {
    return this.vectorIndex.getStats();
  }

  // Build RAG context from retrieved chunks
  static buildRAGContext(
    results: Array<{ chunk: DocumentChunk; score: number }>,
    maxTokens: number = 3000
  ): string {
    if (results.length === 0) return '';

    let totalLength = 0;
    const selectedChunks: Array<{ chunk: DocumentChunk; score: number }> = [];

    for (const result of results) {
      const chunkLength = result.chunk.content.length;
      if (totalLength + chunkLength > maxTokens * 4) {
        break;
      }
      selectedChunks.push(result);
      totalLength += chunkLength;
    }

    const contextParts = selectedChunks.map((result, idx) => {
      const relevance = Math.round(result.score * 100);
      return `[${idx + 1}] From "${result.chunk.metadata.documentName}" (Relevance: ${relevance}%)\n${result.chunk.content}`;
    });

    return `Based on the following relevant documents:\n\n${contextParts.join('\n\n')}\n\n---\n\nUsing the above information, please answer the following question.`;
  }
}

// Factory function to create optimized RAG service
export async function createOptimizedRAGService(
  knowledgeBaseId: string,
  config: EmbeddingConfig
): Promise<OptimizedRAGService> {
  const service = new OptimizedRAGService(knowledgeBaseId, config);
  await service.initialize();
  return service;
}

export default OptimizedRAGService;
