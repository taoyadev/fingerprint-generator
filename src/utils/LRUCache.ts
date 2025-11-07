/**
 * Simple LRU (Least Recently Used) Cache
 *
 * A cache that automatically evicts the least recently used items when the maximum size is reached.
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache
   * Moves the item to the end (most recently used)
   */
  public get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Set value in cache
   * Evicts oldest item if cache is full
   */
  public set(key: K, value: V): void {
    // If key exists, delete it first to update its position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // If cache is full, remove the oldest item (first item)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value as K;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    // Add new item at the end
    this.cache.set(key, value);
  }

  /**
   * Check if key exists in cache
   */
  public has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete item from cache
   */
  public delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from cache
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  public get size(): number {
    return this.cache.size;
  }

  /**
   * Get maximum cache size
   */
  public get capacity(): number {
    return this.maxSize;
  }
}
