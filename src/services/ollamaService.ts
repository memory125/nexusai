// Ollama API service
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
    this.endpoint = endpoint.replace(/\/$/, ''); // Remove trailing slash
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
      const response = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // List available models
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`);
      if (!response.ok) throw new Error('Failed to fetch models');
      
      const data = await response.json();
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
      const response = await fetch(`${this.endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${error}`);
      }

      const data: OllamaResponse = await response.json();
      return data.message.content;
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw error;
    }
  }

  // Streaming chat completion
  async *streamChat(
    messages: OllamaMessage[],
    model?: string
  ): AsyncGenerator<string> {
    const request: OllamaRequest = {
      model: model || this.defaultModel,
      messages,
      stream: true,
    };

    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              yield data.message.content;
            }
            if (data.done) break;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Generate embeddings (for RAG)
  async generateEmbedding(text: string, model: string = 'nomic-embed-text:latest'): Promise<number[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: text }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const data = await response.json();
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
