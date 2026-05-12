/**
 * Simple client-side Stale-While-Revalidate (SWR) cache manager
 */
class ClientCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Fetch data with SWR caching
   * @param {string} key - Cache key identifier
   * @param {function} fetchFn - Function to fetch fresh data from Supabase
   * @param {number} ttl - Time-to-Live in milliseconds (default 30 seconds)
   * @returns {Promise<any>} Cached or fresh data
   */
  async get(key, fetchFn, ttl = 30000) {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (entry) {
      const isStale = now - entry.timestamp > ttl;

      if (isStale) {
        // Trigger background revalidation (Stale-While-Revalidate)
        fetchFn()
          .then((freshData) => {
            this.cache.set(key, {
              data: freshData,
              timestamp: Date.now(),
            });
          })
          .catch((err) => {
            console.error(`[Cache Revalidation Failure] Key: ${key}`, err);
          });
      }

      // Return cached (possibly stale) data immediately
      return entry.data;
    }

    // Cache miss: perform initial fetch synchronously
    const freshData = await fetchFn();
    this.cache.set(key, {
      data: freshData,
      timestamp: Date.now(),
    });
    return freshData;
  }

  /**
   * Manually invalidate a cache entry
   * @param {string} key 
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }
}

export const clientCache = new ClientCache();
