/**
 * Normalizes header keys to lowercase.
 * @param {object | undefined} headers - The header object.
 * @returns {object} A new object with lowercase header keys.
 */
export default function normalizeHeaders(headers) {
    const newHeaders = {};
    if (headers) {
        // Axios response.headers can be an AxiosHeaders object or a plain object.
        // .toJSON() converts AxiosHeaders to a plain object if available.
        const originalHeaders = typeof headers.toJSON === 'function'
            ? headers.toJSON()
            : headers;

        for (const hKey in originalHeaders) {
            if (Object.prototype.hasOwnProperty.call(originalHeaders, hKey)) {
                newHeaders[hKey.toLowerCase()] = originalHeaders[hKey];
            }
        }
    }
    return newHeaders;
}