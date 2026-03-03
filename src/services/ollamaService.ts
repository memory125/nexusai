// Ollama API service
import { invoke } from '@tauri-apps/api/core';

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface OllamaResponse {
  message: {
    role: 'assistant';
    content: string;
  };
  done: boolean;
}

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(`[Ollama] Retry ${i + 1}/${retries}:`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
}

export class OllamaService {
  private endpoint: string;
  private defaultModel: string = 'llama3.3:latest';

  constructor(endpoint: string = 'http://localhost:11434') {
    this.endpoint = endpoint.replace(/\/$/, '');
  }

  setEndpoint(endpoint: string) {
    this.endpoint = endpoint.replace(/\/$/, '');
  }

  setDefaultModel(model: string) {
    this.defaultModel = model;
  }

  getEndpoint(): string {
    return this.endpoint;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetchWithRetry(async () => {
        return await invoke<string>('fetch_ollama', { 
          url: `${this.endpoint}/api/tags`,
          method: 'GET',
          body: null
        });
      }, 2, 3000);
      return response.length > 0;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetchWithRetry(async () => {
        return await invoke<string>('fetch_ollama', {
          url: `${this.endpoint}/api/tags`,
          method: 'GET',
          body: null
        });
      }, 2, 3000);
      
      const data = JSON.parse(response);
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  async chat(messages: OllamaMessage[], model?: string): Promise<string> {
    const request: OllamaRequest = {
      model: model || this.defaultModel,
      messages,
      stream: false,
    };

    try {
      const response = await fetchWithRetry(async () => {
        return await invoke<string>('fetch_ollama', {
          url: `${this.endpoint}/api/chat`,
          method: 'POST',
          body: JSON.stringify(request)
        });
      }, 2, 2000);

      const data: OllamaResponse = JSON.parse(response);
      return data.message.content;
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw error;
    }
  }

  async *streamChat(
    messages: OllamaMessage[],
    model?: string
  ): AsyncGenerator<string> {
    const request: OllamaRequest = {
      model: model || this.defaultModel,
      messages,
      stream: false,
    };

    const response = await fetchWithRetry(async () => {
      return await invoke<string>('fetch_ollama', {
        url: `${this.endpoint}/api/chat`,
        method: 'POST',
        body: JSON.stringify(request)
      });
    }, 2, 2000);

    const data: OllamaResponse = JSON.parse(response);
    yield data.message.content;
  }

  async generateEmbedding(text: string, model: string = 'nomic-embed-text:latest'): Promise<number[]> {
    try {
      const response = await fetchWithRetry(async () => {
        return await invoke<string>('fetch_ollama', {
          url: `${this.endpoint}/api/embeddings`,
          method: 'POST',
          body: JSON.stringify({ model, prompt: text })
        });
      }, 2, 2000);

      const data = JSON.parse(response);
      return data.embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }
}

let ollamaService: OllamaService | null = null;

export function getOllamaService(endpoint?: string): OllamaService {
  if (!ollamaService) {
    ollamaService = new OllamaService(endpoint);
  } else if (endpoint) {
    ollamaService.setEndpoint(endpoint);
  }
  return ollamaService;
}
