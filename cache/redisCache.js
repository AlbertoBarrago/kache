import Redis from 'ioredis';
const redis = new Redis();

/**
 * Redis-based cache backend.
 * @type {import('./types').CacheEngine}
 */
const redisCache = {
    async get(key) {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    },
    async set(key, value, ttl) {
        await redis.set(key, JSON.stringify(value), 'EX', ttl);
    }
};


export default redisCache;
