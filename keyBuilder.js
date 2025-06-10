import crypto from 'crypto';

/**
 * Builds a unique hash key for caching based on the Axios request config.
 * @param {import('axios').AxiosRequestConfig} config
 * @returns {string} SHA256 hash string as a cache key
 */
export default function buildCacheKey(config) {
    const data = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}:${JSON.stringify(config.data || {})}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}
