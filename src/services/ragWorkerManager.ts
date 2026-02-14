// RAG Worker Manager - Manages Web Worker for embedding operations

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

class RAGWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private messageId = 0;
  private isInitialized = false;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof Worker === 'undefined') {
      console.warn('Web Workers not supported in this environment');
      return;
    }

    try {
      // Create worker from blob to avoid CORS issues
      const workerScript = `
        // Inline worker implementation
        ${this.getWorkerCode()}
      `;
      
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      
      this.worker.onmessage = (event) => {
        const { id, type, result, error, progress } = event.data;
        
        if (type === 'progress') {
          // Handle progress updates
          const request = this.pendingRequests.get(id);
          if (request && 'onProgress' in request) {
            (request as any).onProgress?.(progress);
          }
          return;
        }

        const request = this.pendingRequests.get(id);
        if (!request) return;

        this.pendingRequests.delete(id);

        if (type === 'error') {
          request.reject(new Error(error));
        } else {
          request.resolve(result);
        }
      };

      this.worker.onerror = (error) => {
        console.error('RAG Worker error:', error);
        // Reject all pending requests
        this.pendingRequests.forEach((request) => {
          request.reject(new Error('Worker error'));
        });
        this.pendingRequests.clear();
      };

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize RAG worker:', error);
    }
  }

  private getWorkerCode(): string {
    // Return the worker code as a string
    return `
      function generateLocalEmbedding(text, dimensions = 384) {
        const vector = new Array(dimensions).fill(0);
        
        const words = text.toLowerCase()
          .replace(/[^\\w\\s]/g, ' ')
          .split(/\\s+/)
          .filter(w => w.length > 2);
        
        const wordFreq = {};
        words.forEach((word, idx) => {
          const positionWeight = 1 + (idx / words.length) * 0.5;
          wordFreq[word] = (wordFreq[word] || 0) + positionWeight;
        });

        Object.entries(wordFreq).forEach(([word, freq]) => {
          let hash = 0;
          for (let i = 0; i < word.length; i++) {
            const char = word.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
          }
          
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

      function cosineSimilarity(a, b) {
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

      self.onmessage = (event) => {
        const { id, type, payload } = event.data;

        try {
          switch (type) {
            case 'generateEmbedding': {
              const { text, dimensions } = payload;
              const embedding = generateLocalEmbedding(text, dimensions);
              self.postMessage({ id, type: 'success', result: embedding });
              break;
            }

            case 'generateBatch': {
              const { texts, dimensions, batchSize = 10 } = payload;
              const results = [];
              
              for (let i = 0; i < texts.length; i += batchSize) {
                const batch = texts.slice(i, i + batchSize);
                const batchResults = batch.map(text => generateLocalEmbedding(text, dimensions));
                results.push(...batchResults);
                
                self.postMessage({
                  id,
                  type: 'progress',
                  progress: Math.round(((i + batch.length) / texts.length) * 100),
                });
              }
              
              self.postMessage({ id, type: 'success', result: results });
              break;
            }

            case 'searchSimilar': {
              const { query, vectors, topK = 5 } = payload;
              const queryEmbedding = generateLocalEmbedding(query);
              
              const results = [];
              
              for (const [id, vector] of Object.entries(vectors)) {
                const score = cosineSimilarity(queryEmbedding, vector);
                results.push({ id, score });
              }

              results.sort((a, b) => b.score - a.score);
              self.postMessage({ id, type: 'success', result: results.slice(0, topK) });
              break;
            }

            default:
              self.postMessage({ id, type: 'error', error: 'Unknown message type: ' + type });
          }
        } catch (error) {
          self.postMessage({
            id,
            type: 'error',
            error: error.message || String(error),
          });
        }
      };
    `;
  }

  private sendMessage(type: string, payload: any, onProgress?: (progress: number) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker || !this.isInitialized) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const id = `${++this.messageId}_${Date.now()}`;
      const request: PendingRequest & { onProgress?: (progress: number) => void } = { resolve, reject };
      if (onProgress) {
        request.onProgress = onProgress;
      }
      
      this.pendingRequests.set(id, request);
      this.worker.postMessage({ id, type, payload });
    });
  }

  // Generate single embedding
  async generateEmbedding(text: string, dimensions: number = 384): Promise<number[]> {
    return this.sendMessage('generateEmbedding', { text, dimensions });
  }

  // Generate batch embeddings with progress callback
  async generateBatchEmbeddings(
    texts: string[],
    dimensions: number = 384,
    batchSize: number = 10,
    onProgress?: (progress: number) => void
  ): Promise<number[][]> {
    return this.sendMessage('generateBatch', { texts, dimensions, batchSize }, onProgress);
  }

  // Search for similar vectors
  async searchSimilar(
    query: string,
    vectors: Record<string, number[]>,
    topK: number = 5
  ): Promise<Array<{ id: string; score: number }>> {
    return this.sendMessage('searchSimilar', { query, vectors, topK });
  }

  // Check if worker is available
  isAvailable(): boolean {
    return this.isInitialized && this.worker !== null;
  }

  // Terminate worker
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
export const ragWorkerManager = new RAGWorkerManager();
export default ragWorkerManager;
