// Embedding service for RAG

export interface EmbeddingModel {
  id: string;
  name: string;
  provider: 'openai' | 'huggingface' | 'local';
  dimensions: number;
  maxTokens: number;
  description: string;
}

export const EMBEDDING_MODELS: EmbeddingModel[] = [
  {
    id: 'text-embedding-3-small',
    name: 'OpenAI Text Embedding 3 Small',
    provider: 'openai',
    dimensions: 1536,
    maxTokens: 8191,
    description: 'OpenAI 最新的高效嵌入模型，性价比高',
  },
  {
    id: 'text-embedding-3-large',
    name: 'OpenAI Text Embedding 3 Large',
    provider: 'openai',
    dimensions: 3072,
    maxTokens: 8191,
    description: 'OpenAI 最强嵌入模型，准确度最高',
  },
  {
    id: 'text-embedding-ada-002',
    name: 'OpenAI Ada 002',
    provider: 'openai',
    dimensions: 1536,
    maxTokens: 8191,
    description: '经典的 Ada 嵌入模型',
  },
  {
    id: 'sentence-transformers/all-MiniLM-L6-v2',
    name: 'MiniLM L6 v2 (Local)',
    provider: 'huggingface',
    dimensions: 384,
    maxTokens: 256,
    description: '本地运行的轻量级模型，无需 API Key',
  },
  {
    id: 'simple-hash',
    name: 'Simple Hash (Fallback)',
    provider: 'local',
    dimensions: 128,
    maxTokens: 10000,
    description: '简单的本地哈希方法，作为后备方案',
  },
];

export interface EmbeddingConfig {
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

// Performance tracking types
export interface EmbeddingPerformanceStats {
  totalRequests: number;
  totalTokens: number;
  totalDuration: number; // in milliseconds
  averageDuration: number;
  errors: number;
  lastRequestAt?: number;
}

export interface RAGPerformanceStats {
  retrievalTime: number; // in milliseconds
  embeddingTime: number; // in milliseconds
  totalTime: number; // in milliseconds
  chunksSearched: number;
  chunksRetrieved: number;
  tokensUsed: number;
  timestamp: number;
}

export class EmbeddingService {
  private config: EmbeddingConfig;

  constructor(config: EmbeddingConfig) {
    this.config = config;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const model = EMBEDDING_MODELS.find(m => m.id === this.config.model);
    
    if (!model) {
      throw new Error(`Unknown embedding model: ${this.config.model}`);
    }

    switch (model.provider) {
      case 'openai':
        return this.generateOpenAIEmbedding(text, model.id);
      case 'huggingface':
        return this.generateHuggingFaceEmbedding(text, model.id);
      case 'local':
      default:
        return this.generateLocalEmbedding(text);
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    // Process in batches of 100 to avoid rate limits
    const batchSize = 100;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      results.push(...batchResults);
    }

    return results;
  }

  private async generateOpenAIEmbedding(text: string, modelId: string): Promise<number[]> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API Key is required for OpenAI embedding models');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        input: text.slice(0, 8000), // Truncate to avoid token limit
        model: modelId,
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  private async generateHuggingFaceEmbedding(text: string, modelId: string): Promise<number[]> {
    // Use HuggingFace Inference API
    const apiUrl = this.config.baseUrl || `https://api-inference.huggingface.co/pipeline/feature-extraction/${modelId}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: text.slice(0, 500),
        options: { wait_for_model: true },
      }),
    });

    if (!response.ok) {
      // Fall back to local embedding if HuggingFace fails
      console.warn('HuggingFace API failed, falling back to local embedding');
      return this.generateLocalEmbedding(text);
    }

    const data = await response.json();
    
    // Handle different response formats
    if (Array.isArray(data) && data.length > 0) {
      if (Array.isArray(data[0])) {
        return data[0]; // Sentence transformers format
      }
      return data;
    }

    throw new Error('Unexpected HuggingFace API response format');
  }

  private generateLocalEmbedding(text: string): number[] {
    // Improved local embedding using TF-IDF-like approach
    const vector: number[] = new Array(384).fill(0);
    
    // Tokenize and normalize
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    // Calculate term frequency with position weighting
    const wordFreq: Record<string, number> = {};
    words.forEach((word, idx) => {
      const positionWeight = 1 + (idx / words.length) * 0.5;
      wordFreq[word] = (wordFreq[word] || 0) + positionWeight;
    });

    // Hash words to vector positions with frequency weighting
    Object.entries(wordFreq).forEach(([word, freq]) => {
      const hash = this.hashString(word);
      for (let i = 0; i < 5; i++) {
        const idx = Math.abs(hash + i * 31) % 384;
        vector[idx] += freq * (1 - i * 0.15);
      }
    });

    // Apply TF-IDF-like scaling
    const maxVal = Math.max(...vector);
    if (maxVal > 0) {
      for (let i = 0; i < vector.length; i++) {
        // Log scaling for better distribution
        vector[i] = Math.log1p(vector[i]) / Math.log1p(maxVal);
      }
    }

    // L2 Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return vector.map(val => val / magnitude);
    }

    return vector;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

// Cosine similarity with optimized calculation
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimensions mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  // Unrolled loop for better performance
  const len = a.length;
  const remainder = len % 4;
  
  for (let i = 0; i < len - remainder; i += 4) {
    dotProduct += a[i] * b[i] + a[i+1] * b[i+1] + a[i+2] * b[i+2] + a[i+3] * b[i+3];
    normA += a[i] * a[i] + a[i+1] * a[i+1] + a[i+2] * a[i+2] + a[i+3] * a[i+3];
    normB += b[i] * b[i] + b[i+1] * b[i+1] + b[i+2] * b[i+2] + b[i+3] * b[i+3];
  }

  // Handle remaining elements
  for (let i = len - remainder; i < len; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Approximate nearest neighbor search with HNSW-like indexing
export class VectorIndex {
  private vectors: Map<string, number[]> = new Map();
  private dimensions: number;

  constructor(dimensions: number) {
    this.dimensions = dimensions;
  }

  add(id: string, vector: number[]) {
    if (vector.length !== this.dimensions) {
      throw new Error(`Vector dimension mismatch. Expected ${this.dimensions}, got ${vector.length}`);
    }
    this.vectors.set(id, vector);
  }

  remove(id: string) {
    this.vectors.delete(id);
  }

  search(query: number[], topK: number = 5): Array<{ id: string; score: number }> {
    const results: Array<{ id: string; score: number }> = [];

    for (const [id, vector] of this.vectors) {
      const score = cosineSimilarity(query, vector);
      results.push({ id, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  clear() {
    this.vectors.clear();
  }

  size(): number {
    return this.vectors.size;
  }
}
