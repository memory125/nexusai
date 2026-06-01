import { Document, DocumentChunk, splitTextIntoChunks, generateSimpleEmbedding } from '../types/rag';
import { DocumentParser } from './documentParser';
import { EmbeddingService, EmbeddingConfig, VectorIndex, cosineSimilarity, RAGPerformanceStats, EMBEDDING_MODELS } from './embeddingService';

export class RAGService {
  private embeddingService: EmbeddingService;
  private vectorIndex: VectorIndex;

  constructor(config: EmbeddingConfig) {
    this.embeddingService = new EmbeddingService(config);

    const model = EMBEDDING_MODELS.find((m: any) => m.id === config.model);
    const dimensions = model?.dimensions || 384;

    this.vectorIndex = new VectorIndex(dimensions);
  }

  // Process document and generate chunks with embeddings
  async processDocument(
    file: File,
    _knowledgeBaseId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ document: Document; chunks: DocumentChunk[] }> {
    // 1. Parse document
    if (onProgress) onProgress(10);
    const parsedDoc = await DocumentParser.parseFile(file);
    const content = parsedDoc.content;

    // 2. Split into chunks
    if (onProgress) onProgress(20);
    const chunkTexts = splitTextIntoChunks(content, 800, 100);

    if (chunkTexts.length === 0) {
      throw new Error('文档内容为空,无法分块');
    }

    // 3. Generate embeddings for all chunks (with per-chunk fallback)
    if (onProgress) onProgress(30);
    const documentId = `doc_${Date.now()}`;

    const chunkEmbeddings: (number[] | null)[] = [];
    const fallbackDims = this.vectorIndex.getDimensions();
    let fallbackCount = 0;
    let lastError = '';

    const batchSize = 10;
    for (let i = 0; i < chunkTexts.length; i += batchSize) {
      const batch = chunkTexts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (text) => {
          try {
            return await this.embeddingService.generateEmbedding(text);
          } catch (e) {
            fallbackCount++;
            lastError = e instanceof Error ? e.message : String(e);
            console.warn(`Chunk ${i} embedding failed, using fallback:`, e);
            return this.fallbackEmbedding(text, fallbackDims);
          }
        })
      );
      chunkEmbeddings.push(...batchResults);

      if (onProgress) {
        const progress = 30 + ((i + batch.length) / chunkTexts.length) * 60;
        onProgress(Math.min(progress, 90));
      }
    }

    if (fallbackCount > 0) {
      console.warn(
        `${fallbackCount}/${chunkTexts.length} 个分块使用后备哈希嵌入。` +
        `最后错误: ${lastError.slice(0, 200)}`
      );
    }

    // 4. Create chunks
    const chunks: DocumentChunk[] = chunkTexts.map((chunkText, index) => ({
      id: `chunk_${Date.now()}_${index}`,
      content: chunkText,
      metadata: {
        documentId: documentId,
        documentName: file.name,
        chunkIndex: index,
        totalChunks: chunkTexts.length,
      },
      embedding: chunkEmbeddings[index] || this.fallbackEmbedding(chunkText, fallbackDims),
    }));

    // 5. Add to vector index (skip mismatched ones)
    let added = 0;
    let skipped = 0;
    chunks.forEach((chunk) => {
      if (chunk.embedding && chunk.embedding.length === this.vectorIndex.getDimensions()) {
        try {
          this.vectorIndex.add(chunk.id, chunk.embedding);
          added++;
        } catch {
          skipped++;
        }
      } else {
        skipped++;
      }
    });
    if (skipped > 0) {
      console.warn(`向量索引: 加入 ${added}, 跳过 ${skipped} (维度不匹配)`);
    }

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

    if (onProgress) onProgress(100);

    return { document, chunks };
  }

  // 本地后备嵌入 (固定维度, 永远不抛错)
  private fallbackEmbedding(text: string, dimensions: number): number[] {
    const safeDims = Number.isFinite(dimensions) && dimensions > 0 && dimensions < 100000
      ? Math.floor(dimensions) : 384;
    const vector = new Array(safeDims).fill(0);
    const words = String(text || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const wordFreq: Record<string, number> = {};
    words.forEach((w) => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
    Object.entries(wordFreq).forEach(([w, f]) => {
      let hash = 0;
      for (let i = 0; i < w.length; i++) hash = ((hash << 5) - hash) + w.charCodeAt(i);
      for (let i = 0; i < 5; i++) {
        const idx = Math.abs(hash + i * 31) % safeDims;
        vector[idx] += f * (1 - i * 0.15);
      }
    });
    const mag = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    return mag > 0 ? vector.map(v => v / mag) : vector;
  }

  // Search for relevant chunks using vector index with performance tracking
  async searchRelevantChunks(
    query: string,
    chunks: DocumentChunk[],
    topK: number = 5
  ): Promise<{
    results: Array<{ chunk: DocumentChunk; score: number }>;
    stats: RAGPerformanceStats;
  }> {
    const startTime = performance.now();
    
    // Generate query embedding with timing
    const embeddingStartTime = performance.now();
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    const embeddingTime = performance.now() - embeddingStartTime;
    
    // Rebuild index if needed
    if (this.vectorIndex.size() !== chunks.length) {
      this.vectorIndex.clear();
      chunks.forEach(chunk => {
        if (chunk.embedding) {
          this.vectorIndex.add(chunk.id, chunk.embedding);
        }
      });
    }

    // Search using vector index
    const retrievalStartTime = performance.now();
    const searchResults = this.vectorIndex.search(queryEmbedding, topK);
    const retrievalTime = performance.now() - retrievalStartTime;
    
    // Map results back to chunks
    const results = searchResults
      .map(result => {
        const chunk = chunks.find(c => c.id === result.id);
        return chunk ? { chunk, score: result.score } : null;
      })
      .filter((item): item is { chunk: DocumentChunk; score: number } => item !== null);
    
    const totalTime = performance.now() - startTime;
    
    // Estimate token usage (rough estimate: 1 token ≈ 4 characters for English, 2 for Chinese)
    const estimatedTokens = Math.ceil(query.length / 2);
    
    const stats: RAGPerformanceStats = {
      retrievalTime: Math.round(retrievalTime),
      embeddingTime: Math.round(embeddingTime),
      totalTime: Math.round(totalTime),
      chunksSearched: chunks.length,
      chunksRetrieved: results.length,
      tokensUsed: estimatedTokens,
      timestamp: Date.now(),
    };
    
    return { results, stats };
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

  // Get embedding model info
  static getEmbeddingModelInfo(modelId: string) {
    return EMBEDDING_MODELS.find((m: any) => m.id === modelId);
  }

  // Get all available embedding models
  static getAllEmbeddingModels() {
    return EMBEDDING_MODELS;
  }
}

// Legacy function for backwards compatibility
export function searchRelevantChunksLegacy(
  query: string,
  chunks: DocumentChunk[],
  topK: number = 5
): DocumentChunk[] {
  const queryEmbedding = generateSimpleEmbedding(query);
  
  const scoredChunks = chunks.map(chunk => ({
    chunk,
    score: chunk.embedding 
      ? cosineSimilarity(queryEmbedding, chunk.embedding)
      : 0,
  }));

  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK).map(item => item.chunk);
}
