import axios from 'axios';
import redisCache from './cache/redisCache.js';
import memoryCache from './cache/memoryCache.js';
import buildCacheKey from './services/keyBuilder.js';
import normalizeHeaders from "./services/normalize.js";
import {CACHE_TYPE, STATUS} from "./const"
import {assignHeaders, isValidResponse} from "./services/utils.js";

/**
 * @typedef {object} KacheCacheOptions
 * @property {'redis' | 'memory'} [type='memory'] - Cache backend type ('redis' or 'memory').
 * @property {number} [ttl=60] - Default Time To Live (TTL) in seconds for cache entries.
 * @property {object} [redisOptions] - Options for `ioredis` (if type is 'redis').
 * @property {object} [nodeCacheOptions] - Options for `node-cache` (if type is 'memory').
 * @property {boolean} [cacheIsActive=true] - Globally enables or disables caching. If false, no cache reads or writes will occur.
 */

/**
 * @typedef {object} KacheGlobalOptions
 * @property {import('axios').AxiosInstance} [axiosInstance] - Optional pre-configured Axios instance. If not provided, a new one is created.
 * @property {KacheCacheOptions} [cache] - Cache-specific configurations.
 */

/**
 * Creates an Axios client instance with caching capabilities.
 * Intercepts GET requests to serve from cache (memory/Redis) or cache new responses.
 * Adds 'Cache-Control', 'Expires', and 'x-kache' headers.
 *
 * @param {KacheGlobalOptions} [options={}] - Configuration options.
 * @returns {import('axios').AxiosInstance} An Axios instance augmented with caching.
 */
export default function kache(options = {}) {
    const client = options.axiosInstance || axios.create(),
        cacheIsActive = options.cache?.cacheIsActive !== undefined ? options.cache.cacheIsActive : true,
        ttl = options.cache?.ttl || 60,
        cacheType = options.cache?.type === CACHE_TYPE.REDIS ? redisCache : memoryCache;

    client.interceptors.request.use(async (config) => {

        if (config.method?.toLowerCase() !== 'get' || !cacheIsActive) {
            return config;
        }

        const key = buildCacheKey(config);

        const cachedItem = await cacheType.get(key);

        if (cachedItem) {
            const hitHeaders = {...cachedItem.headers};
            hitHeaders['x-kache'] = STATUS.HIT;

            config.adapter = () => Promise.resolve({
                data: cachedItem.data,
                status: cachedItem.status,
                statusText: `${cachedItem.statusText} (kache HIT)`,
                headers: hitHeaders,
                config: config
            });

        } else {
            config.metadata = {...config.metadata, cacheKey: key};
        }
        return config;
    });


    client.interceptors.response.use(async (response) => {
        const key = response.config.metadata?.cacheKey;

        if (key && isValidResponse(response)) {

            let newHeaders = normalizeHeaders(response.headers);

            assignHeaders(newHeaders, cacheIsActive, ttl);

            const itemToCache = {
                data: response.data,
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            };

            if (cacheIsActive) {
                await cacheType.set(key, itemToCache, ttl);
            }

            response.headers = newHeaders;
        }

        return response;
    }, (error) => {
        return Promise.reject(error);
    });

    return client;
}