import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Performance monitoring helper for tracking function execution times
export const performanceMonitor = internalQuery({
  args: {
    functionName: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    queryCount: v.optional(v.number()),
    resultCount: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const duration = args.endTime - args.startTime;
    
    // Log performance metrics - in production, you might want to store these in a table
    console.log(`Performance: ${args.functionName} took ${duration}ms`, {
      function: args.functionName,
      duration,
      queryCount: args.queryCount,
      resultCount: args.resultCount,
      timestamp: new Date().toISOString(),
    });
    
    // Alert on slow operations (>2 seconds)
    if (duration > 2000) {
      console.warn(`⚠️ Slow operation detected: ${args.functionName} took ${duration}ms`);
    }
    
    return null;
  },
});

// Helper function to measure and log performance of any async operation
export async function measurePerformance<T>(
  operation: () => Promise<T>,
  functionName: string,
  queryCount?: number
): Promise<T> {
  const startTime = Date.now();
  const result = await operation();
  const endTime = Date.now();
  
  // In development, log directly. In production, you might queue this for async processing
  if (process.env.NODE_ENV === "development") {
    const duration = endTime - startTime;
    const resultCount = Array.isArray(result) ? result.length : typeof result === 'object' && result ? 1 : 0;
    
    console.log(`⚡ ${functionName}: ${duration}ms (${queryCount || 'unknown'} queries, ${resultCount} results)`);
    
    if (duration > 1000) {
      console.warn(`⚠️ Slow function: ${functionName} took ${duration}ms`);
    }
  }
  
  return result;
}

// Batch operation helper to prevent N+1 queries
export class BatchProcessor<K, V> {
  private cache = new Map<K, Promise<V>>();
  
  constructor(
    private fetchFunction: (key: K) => Promise<V>,
    private batchSize: number = 20
  ) {}
  
  async get(key: K): Promise<V> {
    if (!this.cache.has(key)) {
      this.cache.set(key, this.fetchFunction(key));
    }
    return this.cache.get(key)!;
  }
  
  async getMany(keys: K[]): Promise<V[]> {
    // Process in batches to avoid overwhelming the database
    const results: V[] = [];
    
    for (let i = 0; i < keys.length; i += this.batchSize) {
      const batch = keys.slice(i, i + this.batchSize);
      const batchResults = await Promise.all(
        batch.map(key => this.get(key))
      );
      results.push(...batchResults);
    }
    
    return results;
  }
  
  clear() {
    this.cache.clear();
  }
}

// Common query optimizations
export const QueryOptimizations = {
  // Limit recommendations for different query types
  SEARCH_LIMIT: 15,
  CONVERSATION_LIMIT: 20,
  MESSAGE_LIMIT: 50,
  LEADERBOARD_LIMIT: 25,
  
  // Batch sizes for different operations
  PROFILE_BATCH_SIZE: 20,
  MESSAGE_BATCH_SIZE: 20,
  ACHIEVEMENT_BATCH_SIZE: 10,
  
  // Cache durations (in milliseconds)
  PROFILE_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  UNREAD_COUNT_CACHE_DURATION: 30 * 1000, // 30 seconds
  LEADERBOARD_CACHE_DURATION: 10 * 60 * 1000, // 10 minutes
} as const;

// Type-safe database query helpers
export const DatabaseHelpers = {
  // Safe pagination helper
  getPaginationParams(args: { numItems?: number; cursor?: string }) {
    return {
      numItems: Math.min(args.numItems || 20, 100), // Cap at 100
      cursor: args.cursor,
    };
  },
  
  // Safe search term processing
  processSearchTerm(term: string, minLength = 2): string | null {
    const processed = term.toLowerCase().trim();
    return processed.length >= minLength ? processed : null;
  },
  
  // Safe limit processing
  processLimit(limit?: number, defaultLimit = 20, maxLimit = 100): number {
    return Math.min(limit || defaultLimit, maxLimit);
  },
} as const;
