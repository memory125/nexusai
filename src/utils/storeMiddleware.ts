import { StateStorage } from 'zustand/middleware';

// Custom storage with error handling
export const customStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  },
  
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.warn('Failed to write to localStorage:', error);
    }
  },
  
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },
};

// Selective persistence - only persist certain keys
export const persistConfig = {
  name: 'nexusai-storage',
  storage: customStorage,
  partialize: (state: Record<string, unknown>) => {
    // Only persist these keys
    const keysToPersist = [
      'theme',
      'sidebarOpen',
      'apiKeys',
      'ollamaEndpoint',
      'vllmEndpoint',
      'selectedProvider',
      'selectedModel',
    ];
    
    const partialState: Record<string, unknown> = {};
    for (const key of keysToPersist) {
      if (key in state) {
        partialState[key] = state[key];
      }
    }
    
    return partialState;
  },
};

// Console logging middleware for debugging
export const loggerMiddleware = <T extends Record<string, unknown>>(
  config: (set: unknown, get: () => T, api: unknown) => T
) => (
  set: unknown, 
  get: () => T, 
  api: unknown
): T => {
  const loggedSet = (partial: unknown, replace?: boolean) => {
    console.log('[Zustand] Set:', partial);
    return (set as (partial: unknown, replace?: boolean) => void)(partial, replace);
  };
  
  return config(loggedSet, get, api);
};

// Performance tracking middleware
export const performanceMiddleware = <T extends Record<string, unknown>>(
  config: (set: unknown, get: () => T, api: unknown) => T
) => (
  set: unknown, 
  get: () => T, 
  api: unknown
): T => {
  let operationCount = 0;
  
  const trackedSet = (partial: unknown, replace?: boolean) => {
    const start = performance.now();
    const result = (set as (partial: unknown, replace?: boolean) => void)(partial, replace);
    operationCount++;
    
    if (operationCount % 100 === 0) {
      console.log(`[Zustand] Operations: ${operationCount}, Last op time: ${performance.now() - start}ms`);
    }
    
    return result;
  };
  
  return config(trackedSet, get, api);
};