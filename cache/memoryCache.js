import NodeCache from 'node-cache';
const cache = new NodeCache();

/**
 * In-memory cache backend.
 * @type {import('./types').CacheEngine}
 */
const memoryCache = {
    async get(key) {
        return cache.get(key);
    },
    async set(key, value, ttl) {
        cache.set(key, value, ttl);
    }
};

export default memoryCache;