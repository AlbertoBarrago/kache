import {HTTP_STATUS, STATUS} from "../const/index.js";

/**
 * Determines whether an HTTP response object is valid based on required properties and expected values.
 * 
 * The response is considered valid if it has a config object, status and statusText fields, headers with a 'content-type' including 'application/json', a data property that is an object, the HTTP method is 'GET', and the status code is between 200 (inclusive) and 300 (exclusive).
 * 
 * @param {object} response - The HTTP response object to validate.
 * @returns {boolean} True if the response meets all validation criteria; otherwise, false.
 */
export function isValidResponse(response) {
    if (!response || !response.config
        || !response.status
        || !response.statusText
        || !response.headers
        || !response.headers['content-type']
        || !response.headers['content-type'].includes('application/json')
        || !response.data || typeof response.data !== 'object') {
        return false;
    }

    return (response.config.method?.toLowerCase() === 'get' &&
        response.status >= HTTP_STATUS.OK &&
        response.status < HTTP_STATUS.MULTIPLE_CHOICE) || false;
}

/**
 * Sets cache-related HTTP headers on the provided headers object.
 *
 * Modifies the headers to include 'cache-control' with a public directive and max-age, an 'expires' header set to the current time plus the specified TTL (in seconds), and a custom 'x-kache' header indicating cache status.
 * @param {object} newHeaders - The headers object to modify.
 * @param {boolean} cacheIsActive - Whether caching is active.
 * @param {number} ttl - Time-to-live in seconds for cache expiration.
 * @returns {object} The modified headers object.
 */
export function assignHeaders(newHeaders, cacheIsActive, ttl) {
    newHeaders['cache-control'] = `public, max-age=${ttl}`;
    newHeaders['expires'] = new Date(Date.now() + ttl * 1000).toUTCString();
    newHeaders['x-kache'] = cacheIsActive ? STATUS.MISS : STATUS.BYPASS;
    return newHeaders;
}