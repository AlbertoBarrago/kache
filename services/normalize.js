/**
 * Returns a new object with all header keys converted to lowercase.
 * 
 * Accepts a headers object, which may be a plain object or an AxiosHeaders instance. If the input has a `toJSON` method, it is used to obtain a plain object before normalization.
 * 
 * @param {object | undefined} headers - The headers to normalize.
 * @returns {object} An object with all header keys in lowercase.
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