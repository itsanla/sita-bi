import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Add to end
    this.cache.set(key, value);
    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey as K);
      }
    }
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  keys(): IterableIterator<K> {
    return this.cache.keys();
  }
}

const store = new LRUCache<string, RateLimitEntry>(10000); // Max 10k IPs

export const createRateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) => {
  const { windowMs, maxRequests, message = 'Too many requests' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = store.get(identifier);

    if (entry === undefined || now > entry.resetTime) {
      store.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: message,
      });
      return;
    }

    entry.count++;
    store.set(identifier, entry);
    next();
  };
};

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const key of store.keys()) {
      const entry = store.get(key);
      if (entry !== undefined && now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      store.delete(key);
    });
  },
  5 * 60 * 1000,
);
