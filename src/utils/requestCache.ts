// Request caching and deduplication utility
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

class RequestCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private pendingRequests: Map<string, PendingRequest[]> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Deduplicate concurrent requests for the same key
  async deduplicate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached) {
      return cached;
    }

    // Check if there's already a pending request
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return new Promise((resolve, reject) => {
        pending.push({ resolve: resolve as (value: unknown) => void, reject });
      });
    }

    // Create new pending requests array
    this.pendingRequests.set(key, []);

    try {
      const data = await fetcher();
      
      // Save to cache
      this.set(key, data, ttl);
      
      // Resolve all pending requests
      const pendingRequests = this.pendingRequests.get(key) || [];
      pendingRequests.forEach(({ resolve }) => resolve(data));
      this.pendingRequests.delete(key);
      
      return data;
    } catch (error) {
      // Reject all pending requests
      const pendingRequests = this.pendingRequests.get(key) || [];
      pendingRequests.forEach(({ reject }) => reject(error));
      this.pendingRequests.delete(key);
      
      throw error;
    }
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats(): { size: number; pending: number } {
    return {
      size: this.cache.size,
      pending: this.pendingRequests.size,
    };
  }
}

// Singleton instance
export const requestCache = new RequestCache();

// Helper function for API requests with caching
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  const cacheKey = `${options?.method || 'GET'}:${url}`;
  
  return requestCache.deduplicate<T>(
    cacheKey,
    async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    ttl
  );
}

// Clear all caches (useful for logout)
export function clearAllCaches(): void {
  requestCache.clear();
}

// Start cleanup interval
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestCache.cleanup();
  }, 60 * 1000); // Cleanup every minute
}