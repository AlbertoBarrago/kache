import {HTTP_STATUS, STATUS} from "../const/index.js";

/**
 * @description Is Valid Response is a util function that verifies if the response is valid
 * @param response
 * @returns {boolean}
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
 * @description Assign Headers to response
 * @param newHeaders
 * @param cacheIsActive
 * @param ttl
 * @returns {*}
 */
export function assignHeaders(newHeaders, cacheIsActive, ttl) {
    newHeaders['cache-control'] = `public, max-age=${ttl}`;
    newHeaders['expires'] = new Date(Date.now() + ttl * 1000).toUTCString();
    newHeaders['x-kache'] = cacheIsActive ? STATUS.MISS : STATUS.BYPASS;
    return newHeaders;
}