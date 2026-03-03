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

  // Check if Ollama is running
  async checkConnection(): Promise<boolean> {
    try {
      const response = await invoke<string>('fetch_ollama', { 
        url: `${this.endpoint}/api/tags`,
        method: 'GET',
        body: null
      });
      return response.length > 0;
    } catch {
      return false;
    }
  }

  // List available models
  async listModels(): Promise<string[]> {
    try {
      const response = await invoke<string>('fetch_ollama', {
        url: `${this.endpoint}/api/tags`,
        method: 'GET',
        body: null
      });
      
      const data = JSON.parse(response);
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  // Non-streaming chat completion
  async chat(messages: OllamaMessage[], model?: string): Promise<string> {
    const request: OllamaRequest = {
      model: model || this.defaultModel,
      messages,
      stream: false,
    };

    try {
      const response = await invoke<string>('fetch_ollama', {
        url: `${this.endpoint}/api/chat`,
        method: 'POST',
        body: JSON.stringify(request)
      });

      const data: OllamaResponse = JSON.parse(response);
      return data.message.content;
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw error;
    }
  }

  // Streaming chat - use non-streaming API and yield chunks
  async *streamChat(
    messages: OllamaMessage[],
    model?: string
  ): AsyncGenerator<string> {
    // Use non-streaming API since we can't easily do streaming via Tauri invoke
    const request: OllamaRequest = {
      model: model || this.defaultModel,
      messages,
      stream: false,
    };

    const response = await invoke<string>('fetch_ollama', {
      url: `${this.endpoint}/api/chat`,
      method: 'POST',
      body: JSON.stringify(request)
    });

    const data: OllamaResponse = JSON.parse(response);
    // Yield the entire content at once (simulating stream)
    yield data.message.content;
  }

  // Generate embeddings
  async generateEmbedding(text: string, model: string = 'nomic-embed-text:latest'): Promise<number[]> {
    try {
      const response = await invoke<string>('fetch_ollama', {
        url: `${this.endpoint}/api/embeddings`,
        method: 'POST',
        body: JSON.stringify({ model, prompt: text })
      });

      const data = JSON.parse(response);
      return data.embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }
}

// Singleton instance
let ollamaService: OllamaService | null = null;

export function getOllamaService(endpoint?: string): OllamaService {
  if (!ollamaService) {
    ollamaService = new OllamaService(endpoint);
  } else if (endpoint) {
    ollamaService.setEndpoint(endpoint);
  }
  return ollamaService;
}
