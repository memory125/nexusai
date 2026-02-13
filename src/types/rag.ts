// RAG types and utilities

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  chunks: string[];
  createdAt: number;
  updatedAt: number;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    documentId: string;
    documentName: string;
    chunkIndex: number;
    totalChunks: number;
  };
  embedding?: number[];
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  tags: string[];
  documents: Document[];
  chunks: DocumentChunk[];
  createdAt: number;
  updatedAt: number;
}

// Predefined tag colors for visual distinction
export const TAG_COLORS = [
  { bg: 'rgba(99, 102, 241, 0.2)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.4)' }, // Indigo
  { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' }, // Emerald
  { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' }, // Amber
  { bg: 'rgba(236, 72, 153, 0.2)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.4)' }, // Pink
  { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)' }, // Blue
  { bg: 'rgba(139, 92, 246, 0.2)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.4)' }, // Violet
  { bg: 'rgba(14, 165, 233, 0.2)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.4)' }, // Sky
  { bg: 'rgba(249, 115, 22, 0.2)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.4)' }, // Orange
];

// Get color for a tag based on its hash
export function getTagColor(tag: string) {
  const hash = hashString(tag);
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
}

// Split text into chunks with overlap
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start >= end) break;
  }

  return chunks;
}

// Generate simple embedding (in production, use OpenAI API or local model)
export function generateSimpleEmbedding(text: string): number[] {
  const vector: number[] = new Array(128).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  words.forEach((word) => {
    const hash = hashString(word);
    const index = Math.abs(hash) % 128;
    vector[index] += 1;
  });

  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return vector.map(val => val / magnitude);
  }
  return vector;
}

// Simple string hash function
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}
