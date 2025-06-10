import axios from 'axios';
import redisCache from './cache/redisCache.js';
import memoryCache from './cache/memoryCache.js';
import buildCacheKey from './keyBuilder.js';

/**
 * Creates a smart Axios client with built-in caching support.
 * @param {Object} options
 * @param {import('axios').AxiosInstance} [options.axiosInstance] - Custom Axios instance (optional).
 * @param {'redis'|'memory'} [options.cache.type='memory'] - Cache backend type.
 * @param {number} [options.cache.ttl=60] - Time to live in seconds for kache's internal cache and max-age for HTTP Cache-Control.
 * @returns {import('axios').AxiosInstance} - A wrapped Axios instance.
 */
export default function kache(options = {}) {
    const client = options.axiosInstance || axios.create();
    const ttl = options.cache?.ttl || 60;
    const cacheType = options.cache?.type === 'redis' ? redisCache : memoryCache;

    client.interceptors.request.use(async (config) => {
        if (config.method?.toLowerCase() !== 'get') {
            return config;
        }

        const key = buildCacheKey(config);
        const cachedItem = await cacheType.get(key);

        if (cachedItem) {
            const hitHeaders = { ...cachedItem.headers };
            hitHeaders['x-kache'] = 'HIT';

            config.adapter = () => Promise.resolve({
                data: cachedItem.data,
                status: cachedItem.status,
                statusText: `${cachedItem.statusText} (kache HIT)`,
                headers: hitHeaders,
                config: config
            });
        } else {
            config.metadata = { cacheKey: key };
        }
        return config;
    });

    client.interceptors.response.use(async (response) => {
        const key = response.config.metadata?.cacheKey;

        if (key && response.config.method?.toLowerCase() === 'get' && response.status >= 200 && response.status < 300) {
            const newHeaders = {};
            if (response.headers) {
                const originalHeaders = typeof response.headers.toJSON === 'function'
                    ? response.headers.toJSON()
                    : response.headers;

                for (const hKey in originalHeaders) {
                    if (Object.prototype.hasOwnProperty.call(originalHeaders, hKey)) {
                        newHeaders[hKey.toLowerCase()] = originalHeaders[hKey];
                    }
                }
            }

            newHeaders['cache-control'] = `public, max-age=${ttl}`;
            newHeaders['expires'] = new Date(Date.now() + ttl * 1000).toUTCString();
            newHeaders['x-kache'] = 'MISS';

            const itemToCache = {
                data: response.data,
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            };

            await cacheType.set(key, itemToCache, ttl);

            response.headers = newHeaders;
        }
        return response;
    }, (error) => {
        return Promise.reject(error);
    });

    return client;
}