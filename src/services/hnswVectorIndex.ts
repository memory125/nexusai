// Optimized HNSW (Hierarchical Navigable Small World) Vector Index
// Provides approximate nearest neighbor search with O(log n) complexity
// Much faster than linear search for large datasets

import { cosineSimilarity } from './embeddingService';

interface HNSWNode {
  id: string;
  vector: number[];
  level: number;
  connections: Map<number, string[]>; // level -> connected node ids
}

interface HNSWConfig {
  M: number; // Max connections per node per level
  efConstruction: number; // Size of dynamic candidate list for construction
  efSearch: number; // Size of dynamic candidate list for search
  ml: number; // Max level multiplier
}

export class HNSWVectorIndex {
  private nodes: Map<string, HNSWNode> = new Map();
  private entryPoint: string | null = null;
  private dimensions: number;
  private config: HNSWConfig;
  private levelMax: number = 0;

  constructor(dimensions: number, config?: Partial<HNSWConfig>) {
    this.dimensions = dimensions;
    this.config = {
      M: 16,
      efConstruction: 200,
      efSearch: 64,
      ml: Math.log(16),
      ...config,
    };
  }

  // Random level assignment for new nodes
  private randomLevel(): number {
    let level = 0;
    while (Math.random() < 1 / Math.E && level < 16) {
      level++;
    }
    return level;
  }

  // Add vector to index
  add(id: string, vector: number[]): void {
    if (vector.length !== this.dimensions) {
      throw new Error(`Vector dimension mismatch. Expected ${this.dimensions}, got ${vector.length}`);
    }

    const level = this.randomLevel();
    const connections = new Map<number, string[]>();

    // Initialize connections for all levels
    for (let i = 0; i <= level; i++) {
      connections.set(i, []);
    }

    const newNode: HNSWNode = {
      id,
      vector: [...vector], // Clone vector
      level,
      connections,
    };

    // If index is empty, set as entry point
    if (!this.entryPoint) {
      this.entryPoint = id;
      this.nodes.set(id, newNode);
      this.levelMax = level;
      return;
    }

    // Search for nearest neighbors at each level
    let currentEntry = this.entryPoint;

    // Phase 1: Search from top level to level+1
    for (let i = this.levelMax; i > level; i--) {
      currentEntry = this.searchLevel(currentEntry, vector, i, 1)[0]?.id || currentEntry;
    }

    // Phase 2: Connect at each level from min(level, levelMax) down to 0
    const maxLevel = Math.min(level, this.levelMax);
    for (let i = maxLevel; i >= 0; i--) {
      // Find neighbors at this level
      const neighbors = this.searchLevel(currentEntry, vector, i, this.config.efConstruction);
      
      // Select M nearest neighbors
      const selectedNeighbors = neighbors
        .filter(n => n.id !== id)
        .slice(0, this.config.M)
        .map(n => n.id);

      // Add bidirectional connections
      connections.set(i, selectedNeighbors);
      
      for (const neighborId of selectedNeighbors) {
        const neighbor = this.nodes.get(neighborId);
        if (neighbor) {
          const neighborConns = neighbor.connections.get(i) || [];
          if (neighborConns.length < this.config.M) {
            neighborConns.push(id);
          } else {
            // Replace farthest connection if new one is closer
            const farthest = this.findFarthest(neighborConns, neighbor.vector);
            const newDist = this.distance(vector, neighbor.vector);
            const farthestDist = this.distance(
              this.nodes.get(farthest)!.vector,
              neighbor.vector
            );
            if (newDist > farthestDist) {
              const idx = neighborConns.indexOf(farthest);
              neighborConns[idx] = id;
            }
          }
          neighbor.connections.set(i, neighborConns);
        }
      }

      // Update entry for next level
      if (neighbors.length > 0) {
        currentEntry = neighbors[0].id;
      }
    }

    // Update entry point if new node has higher level
    if (level > this.levelMax) {
      this.entryPoint = id;
      this.levelMax = level;
    }

    this.nodes.set(id, newNode);
  }

  // Search for k nearest neighbors
  search(query: number[], k: number = 5): Array<{ id: string; score: number }> {
    if (!this.entryPoint) return [];

    // Phase 1: Search from top level to level 1
    let currentEntry = this.entryPoint;
    
    for (let i = this.levelMax; i > 0; i--) {
      const candidates = this.searchLevel(currentEntry, query, i, 1);
      if (candidates.length > 0) {
        currentEntry = candidates[0].id;
      }
    }

    // Phase 2: Search at level 0 with larger candidate list
    const candidates = this.searchLevel(currentEntry, query, 0, Math.max(k, this.config.efSearch));
    
    // Return top k results
    return candidates.slice(0, k).map(c => ({
      id: c.id,
      score: c.score,
    }));
  }

  // Search a specific level
  private searchLevel(
    entryId: string,
    query: number[],
    level: number,
    ef: number
  ): Array<{ id: string; score: number }> {
    const visited = new Set<string>();
    const candidates = new Map<string, number>();
    const results: Array<{ id: string; score: number }> = [];

    // Priority queue using array (sorted by score descending)
    const entryNode = this.nodes.get(entryId);
    if (!entryNode) return [];

    const entryScore = this.distance(query, entryNode.vector);
    candidates.set(entryId, entryScore);
    results.push({ id: entryId, score: entryScore });
    visited.add(entryId);

    while (candidates.size > 0) {
      // Get best candidate
      const bestCandidate = this.getBestCandidate(candidates);
      if (!bestCandidate) break;

      const bestId = bestCandidate.id;
      const bestScore = bestCandidate.score;

      // Check if we can stop (worst result is better than best candidate)
      if (results.length >= ef && results[results.length - 1].score >= bestScore) {
        break;
      }

      candidates.delete(bestId);

      // Explore neighbors
      const node = this.nodes.get(bestId);
      if (!node) continue;

      const neighbors = node.connections.get(level) || [];
      for (const neighborId of neighbors) {
        if (visited.has(neighborId)) continue;

        const neighbor = this.nodes.get(neighborId);
        if (!neighbor) continue;

        const score = this.distance(query, neighbor.vector);
        visited.add(neighborId);

        // Add to results if better than worst result
        if (results.length < ef || score > results[results.length - 1].score) {
          candidates.set(neighborId, score);
          
          // Insert in sorted order
          const insertIdx = results.findIndex(r => r.score < score);
          if (insertIdx === -1) {
            results.push({ id: neighborId, score });
          } else {
            results.splice(insertIdx, 0, { id: neighborId, score });
          }

          // Keep only ef best results
          if (results.length > ef) {
            results.pop();
          }
        }
      }
    }

    return results;
  }

  // Calculate cosine similarity (returns score 0-1)
  private distance(a: number[], b: number[]): number {
    return cosineSimilarity(a, b);
  }

  // Get best candidate from map
  private getBestCandidate(candidates: Map<string, number>): { id: string; score: number } | null {
    let bestId: string | null = null;
    let bestScore = -Infinity;

    for (const [id, score] of candidates) {
      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }

    return bestId ? { id: bestId, score: bestScore } : null;
  }

  // Find farthest neighbor
  private findFarthest(neighborIds: string[], vector: number[]): string {
    let farthestId = neighborIds[0];
    let minDist = this.distance(vector, this.nodes.get(farthestId)!.vector);

    for (let i = 1; i < neighborIds.length; i++) {
      const dist = this.distance(vector, this.nodes.get(neighborIds[i])!.vector);
      if (dist < minDist) {
        minDist = dist;
        farthestId = neighborIds[i];
      }
    }

    return farthestId;
  }

  // Remove vector from index
  remove(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;

    // Remove connections from other nodes
    for (let i = 0; i <= node.level; i++) {
      const connections = node.connections.get(i) || [];
      for (const neighborId of connections) {
        const neighbor = this.nodes.get(neighborId);
        if (neighbor) {
          const neighborConns = neighbor.connections.get(i) || [];
          const idx = neighborConns.indexOf(id);
          if (idx !== -1) {
            neighborConns.splice(idx, 1);
            neighbor.connections.set(i, neighborConns);
          }
        }
      }
    }

    // Update entry point if necessary
    if (this.entryPoint === id) {
      // Find new entry point (node with highest level)
      let newEntry: string | null = null;
      let maxLevel = -1;
      
      for (const [nodeId, n] of this.nodes) {
        if (nodeId !== id && n.level > maxLevel) {
          maxLevel = n.level;
          newEntry = nodeId;
        }
      }
      
      this.entryPoint = newEntry;
      this.levelMax = maxLevel;
    }

    this.nodes.delete(id);
  }

  // Get index size
  size(): number {
    return this.nodes.size;
  }

  // Clear index
  clear(): void {
    this.nodes.clear();
    this.entryPoint = null;
    this.levelMax = 0;
  }

  // Serialize index for persistence
  serialize(): object {
    return {
      dimensions: this.dimensions,
      config: this.config,
      nodes: Array.from(this.nodes.entries()).map(([id, node]) => ({
        id,
        vector: node.vector,
        level: node.level,
        connections: Array.from(node.connections.entries()),
      })),
      entryPoint: this.entryPoint,
      levelMax: this.levelMax,
    };
  }

  // Deserialize index from persistence
  deserialize(data: any): void {
    this.dimensions = data.dimensions;
    this.config = data.config;
    this.entryPoint = data.entryPoint;
    this.levelMax = data.levelMax;

    this.nodes.clear();
    for (const nodeData of data.nodes) {
      const connections = new Map<number, string[]>(nodeData.connections);
      this.nodes.set(nodeData.id, {
        id: nodeData.id,
        vector: nodeData.vector,
        level: nodeData.level,
        connections,
      });
    }
  }

  // Get statistics
  getStats(): {
    nodeCount: number;
    maxLevel: number;
    avgConnections: number;
    memoryEstimate: number;
  } {
    let totalConnections = 0;
    for (const node of this.nodes.values()) {
      for (const conns of node.connections.values()) {
        totalConnections += conns.length;
      }
    }

    const avgConnections = this.nodes.size > 0 ? totalConnections / this.nodes.size : 0;
    const memoryEstimate = this.nodes.size * (this.dimensions * 8 + 200); // Rough estimate

    return {
      nodeCount: this.nodes.size,
      maxLevel: this.levelMax,
      avgConnections: Math.round(avgConnections * 10) / 10,
      memoryEstimate,
    };
  }
}

// Fallback to simple vector index for small datasets
export class SimpleVectorIndex {
  private vectors: Map<string, number[]> = new Map();
  private dimensions: number;

  constructor(dimensions: number) {
    this.dimensions = dimensions;
  }

  add(id: string, vector: number[]): void {
    if (vector.length !== this.dimensions) {
      throw new Error(`Vector dimension mismatch. Expected ${this.dimensions}, got ${vector.length}`);
    }
    this.vectors.set(id, [...vector]);
  }

  remove(id: string): void {
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

  clear(): void {
    this.vectors.clear();
  }

  size(): number {
    return this.vectors.size;
  }
}

// Auto-selecting index based on dataset size
export class AdaptiveVectorIndex {
  private simpleIndex: SimpleVectorIndex;
  private hnswIndex: HNSWVectorIndex | null = null;
  private dimensions: number;
  private readonly HNSW_THRESHOLD = 1000; // Switch to HNSW at 1000 vectors

  constructor(dimensions: number) {
    this.dimensions = dimensions;
    this.simpleIndex = new SimpleVectorIndex(dimensions);
  }

  add(id: string, vector: number[]): void {
    // If we're approaching threshold, migrate to HNSW
    if (this.simpleIndex.size() >= this.HNSW_THRESHOLD && !this.hnswIndex) {
      this.migrateToHNSW();
    }

    if (this.hnswIndex) {
      this.hnswIndex.add(id, vector);
    } else {
      this.simpleIndex.add(id, vector);
    }
  }

  remove(id: string): void {
    if (this.hnswIndex) {
      this.hnswIndex.remove(id);
    } else {
      this.simpleIndex.remove(id);
    }
  }

  search(query: number[], topK: number = 5): Array<{ id: string; score: number }> {
    if (this.hnswIndex) {
      return this.hnswIndex.search(query, topK);
    }
    return this.simpleIndex.search(query, topK);
  }

  clear(): void {
    this.simpleIndex.clear();
    this.hnswIndex?.clear();
    this.hnswIndex = null;
  }

  size(): number {
    if (this.hnswIndex) {
      return this.hnswIndex.size();
    }
    return this.simpleIndex.size();
  }

  private migrateToHNSW(): void {
    this.hnswIndex = new HNSWVectorIndex(this.dimensions);
    
    // Migrate all vectors
    for (const [id, vector] of this.getAllVectors()) {
      this.hnswIndex.add(id, vector);
    }
  }

  private getAllVectors(): Map<string, number[]> {
    // Access internal map
    return (this.simpleIndex as any).vectors || new Map();
  }

  getStats(): object {
    if (this.hnswIndex) {
      return { type: 'HNSW', ...this.hnswIndex.getStats() };
    }
    return { type: 'Simple', nodeCount: this.simpleIndex.size() };
  }
}

export default AdaptiveVectorIndex;
