import { Document, DocumentChunk, splitTextIntoChunks, generateSimpleEmbedding } from '../types/rag';
import { DocumentParser } from './documentParser';
import { EmbeddingService, EmbeddingConfig, VectorIndex, cosineSimilarity, RAGPerformanceStats } from './embeddingService';

export class RAGService {
  private embeddingService: EmbeddingService;
  private vectorIndex: VectorIndex;

  constructor(config: EmbeddingConfig) {
    this.embeddingService = new EmbeddingService(config);
    
    // Get dimensions from selected model
    const { EMBEDDING_MODELS } = require('./embeddingService');
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
    
    // 3. Generate embeddings for all chunks
    if (onProgress) onProgress(30);
    const documentId = `doc_${Date.now()}`;
    
    const chunkEmbeddings: number[][] = [];
    const batchSize = 10;
    
    for (let i = 0; i < chunkTexts.length; i += batchSize) {
      const batch = chunkTexts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.embeddingService.generateEmbedding(text))
      );
      chunkEmbeddings.push(...batchEmbeddings);
      
      if (onProgress) {
        const progress = 30 + (i / chunkTexts.length) * 60;
        onProgress(Math.min(progress, 90));
      }
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
      embedding: chunkEmbeddings[index],
    }));

    // 5. Add to vector index
    chunks.forEach(chunk => {
      if (chunk.embedding) {
        this.vectorIndex.add(chunk.id, chunk.embedding);
      }
    });

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
    const { EMBEDDING_MODELS } = require('./embeddingService');
    return EMBEDDING_MODELS.find((m: any) => m.id === modelId);
  }

  // Get all available embedding models
  static getAllEmbeddingModels() {
    const { EMBEDDING_MODELS } = require('./embeddingService');
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
