// Web Worker for RAG embedding generation
// Runs in separate thread to avoid blocking main thread

interface WorkerMessage {
  id: string;
  type: 'generateEmbedding' | 'generateBatch' | 'searchSimilar';
  payload: any;
}

interface WorkerResponse {
  id: string;
  type: 'success' | 'error';
  result?: any;
  error?: string;
}

// Local embedding implementation (same as embeddingService)
function generateLocalEmbedding(text: string, dimensions: number = 384): number[] {
  const vector: number[] = new Array(dimensions).fill(0);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  const wordFreq: Record<string, number> = {};
  words.forEach((word, idx) => {
    const positionWeight = 1 + (idx / words.length) * 0.5;
    wordFreq[word] = (wordFreq[word] || 0) + positionWeight;
  });

  Object.entries(wordFreq).forEach(([word, freq]) => {
    const hash = hashString(word);
    for (let i = 0; i < 5; i++) {
      const idx = Math.abs(hash + i * 31) % dimensions;
      vector[idx] += freq * (1 - i * 0.15);
    }
  });

  const maxVal = Math.max(...vector);
  if (maxVal > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] = Math.log1p(vector[i]) / Math.log1p(maxVal);
    }
  }

  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return vector.map(val => val / magnitude);
  }

  return vector;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

// Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Message handler
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;

  try {
    switch (type) {
      case 'generateEmbedding': {
        const { text, dimensions } = payload;
        const embedding = generateLocalEmbedding(text, dimensions);
        self.postMessage({ id, type: 'success', result: embedding } as WorkerResponse);
        break;
      }

      case 'generateBatch': {
        const { texts, dimensions, batchSize = 10 } = payload;
        const results: number[][] = [];
        
        // Process in chunks to allow for progress updates
        for (let i = 0; i < texts.length; i += batchSize) {
          const batch = texts.slice(i, i + batchSize);
          const batchResults = batch.map((text: string) => generateLocalEmbedding(text, dimensions));
          results.push(...batchResults);
          
          // Send progress update
          self.postMessage({
            id,
            type: 'progress',
            progress: Math.round(((i + batch.length) / texts.length) * 100),
          } as any);
        }
        
        self.postMessage({ id, type: 'success', result: results } as WorkerResponse);
        break;
      }

      case 'searchSimilar': {
        const { query, vectors, topK = 5 } = payload;
        const queryEmbedding = generateLocalEmbedding(query);
        
        const results: Array<{ id: string; score: number }> = [];
        
        for (const [id, vector] of Object.entries(vectors)) {
          const score = cosineSimilarity(queryEmbedding, vector as number[]);
          results.push({ id, score });
        }

        results.sort((a, b) => b.score - a.score);
        self.postMessage({ id, type: 'success', result: results.slice(0, topK) } as WorkerResponse);
        break;
      }

      default:
        self.postMessage({ id, type: 'error', error: `Unknown message type: ${type}` } as WorkerResponse);
    }
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  }
};

export {};
