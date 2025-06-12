import axios from 'axios';
import redisCache from './cache/redisCache.js';
import memoryCache from './cache/memoryCache.js';
import buildCacheKey from './services/keyBuilder.js';

/**
 * @typedef {object} KacheCacheOptions
 * @property {'redis' | 'memory'} [type='memory'] - Cache backend type ('redis' or 'memory').
 * @property {number} [ttl=60] - Default Time To Live (TTL) in seconds for cache entries.
 * @property {object} [redisOptions] - Options for `ioredis` (if type is 'redis').
 * @property {object} [nodeCacheOptions] - Options for `node-cache` (if type is 'memory').
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
    // Initialize the Axios client: use a provided instance or create a new one.
    const client = options.axiosInstance || axios.create();

    // Determine the Time To Live (TTL) for cache entries, defaulting to 60 seconds.
    const ttl = options.cache?.ttl || 60;

    // Select the cache storage mechanism based on the provided type, defaulting to memory cache.
    const cacheType = options.cache?.type === 'redis' ? redisCache : memoryCache;

    // --- Request Interceptor
    // This interceptor runs before any request is sent.
    // Its primary role is to check for cached responses for GET requests.
    client.interceptors.request.use(async (config) => {
        // Bypass caching logic for non-GET requests.
        // Caching is generally limited to GET requests due to their idempotent nature,
        // unlike methods like POST, PUT, PATCH, and DELETE which modify server state.
        if (config.method?.toLowerCase() !== 'get') {
            return config;
        }

        // Generate a unique cache key based on the request configuration.
        const key = buildCacheKey(config);
        // Attempt to retrieve an item from the cache using the generated key.
        const cachedItem = await cacheType.get(key);

        if (cachedItem) {
            // Cache HIT: A valid item was found in the cache.
            // console.log(`[Kache] Cache HIT for ${key}`);

            // Prepare headers for the cached response, indicating a cache hit.
            const hitHeaders = {...cachedItem.headers}; // Clone stored headers
            hitHeaders['x-kache'] = 'HIT'; // Add/overwrite our custom kache status header

            // Adapt the Axios request to resolve with the cached data immediately,
            // bypassing the actual network request.
            config.adapter = () => Promise.resolve({
                data: cachedItem.data,
                status: cachedItem.status,
                statusText: `${cachedItem.statusText} (kache HIT)`, // Append to statusText for clarity
                headers: hitHeaders,
                config: config // Axios expects the original config to be part of the response
            });
        } else {
            // Cache MISS: No valid item was found in the cache.
            // console.log(`[Kache] Cache MISS for ${key}`);
            // Store the cache key in request metadata. This allows the response interceptor
            // to know which key to use when caching the new response.
            config.metadata = {cacheKey: key};
        }
        return config; // Continue with the request (either adapted or original).
    });

    // --- Response Interceptor ---
    // This interceptor runs after a response is received from the server (or the adapter).
    // Its role is to cache successful GET responses and add appropriate HTTP caching headers.
    client.interceptors.response.use(async (response) => {
        // Retrieve the cache key stored by the request interceptor.
        const key = response.config.metadata?.cacheKey;

        // Conditions for caching the response:
        // 1. A cacheKey must exist (meaning it was a cache miss for a GET request).
        // 2. The request method must be GET.
        // 3. The response status must be successful (2xx).
        if (key
            && response.config.method?.toLowerCase() === 'get'
            && response.status >= 200
            && response.status < 300) {
            // console.log(`[Kache] Caching response for ${key}`);

            // Prepare a new headers object for the response and for caching.
            // Normalize original header keys to lowercase for consistency.
            const newHeaders = {};
            if (response.headers) {
                // Axios response.headers can be an AxiosHeaders object or a plain object.
                // .toJSON() converts AxiosHeaders to a plain object.
                const originalHeaders = typeof response.headers.toJSON === 'function'
                    ? response.headers.toJSON()
                    : response.headers;

                for (const hKey in originalHeaders) {
                    if (Object.prototype.hasOwnProperty.call(originalHeaders, hKey)) {
                        newHeaders[hKey.toLowerCase()] = originalHeaders[hKey];
                    }
                }
            }

            // Add/overwrite standard HTTP caching headers and our custom kache status header.
            // These headers instruct downstream caches (browsers, CDNs) on how to cache.
            newHeaders['cache-control'] = `public, max-age=${ttl}`;
            newHeaders['expires'] = new Date(Date.now() + ttl * 1000).toUTCString();
            newHeaders['x-kache'] = 'MISS'; // Indicate this response was fetched from origin by kache.

            // Construct the object to be stored in the cache.
            // This includes the response data, status, statusText, and the prepared headers.
            const itemToCache = {
                data: response.data,
                status: response.status,
                statusText: response.statusText, // Store original statusText
                headers: newHeaders
            };

            // Store the item in the selected cache backend with the specified TTL.
            await cacheType.set(key, itemToCache, ttl);

            // Update the actual response headers with the newly prepared headers
            // before it's returned to the caller.
            response.headers = newHeaders;
        }
        return response; // Return the (potentially modified) response.
    }, (error) => {
        // Error handler for the response interceptor.
        // By default, errors are not cached and are passed through.
        // console.error('[Kache] Error in response interceptor:', error);
        return Promise.reject(error); // Propagate the error.
    });

    return client; // Return the fully configured Axios client.
}