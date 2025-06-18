import keyBuilder from '../services/keyBuilder.js';
import normalizeHeaders from "../services/normalize.js";
import {isValidResponse} from "../services/utils.js";

describe('keyBuilder', () => {
    const baseURL = 'https://api.example.com/resource';

    it('should generate a consistent SHA256 hex key for identical configs', () => {
        const config1 = {
            method: 'get',
            url: baseURL,
            params: { id: 123, filter: 'active' },
            data: { payload: 'data1' }
        };
        const config2 = {
            method: 'get',
            url: baseURL,
            params: { id: 123, filter: 'active' },
            data: { payload: 'data1' }
        };
        expect(keyBuilder(config1)).toBe(keyBuilder(config2));
        expect(keyBuilder(config1)).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different keys for different methods', () => {
        const config1 = { method: 'get', url: baseURL, params: { q: 'test' } };
        const config2 = { method: 'post', url: baseURL, params: { q: 'test' } };
        expect(keyBuilder(config1)).not.toBe(keyBuilder(config2));
    });

    it('should generate different keys for different URLs', () => {
        const config1 = { method: 'get', url: `${baseURL}/path1`, params: { q: 'test' } };
        const config2 = { method: 'get', url: `${baseURL}/path2`, params: { q: 'test' } };
        expect(keyBuilder(config1)).not.toBe(keyBuilder(config2));
    });

    it('should generate different keys for different params', () => {
        const config1 = { method: 'get', url: baseURL, params: { id: 1 } };
        const config2 = { method: 'get', url: baseURL, params: { id: 2 } };
        expect(keyBuilder(config1)).not.toBe(keyBuilder(config2));
    });

    it('should generate different keys for different data payloads', () => {
        const config1 = { method: 'post', url: baseURL, data: { name: 'alpha' } };
        const config2 = { method: 'post', url: baseURL, data: { name: 'beta' } };
        expect(keyBuilder(config1)).not.toBe(keyBuilder(config2));
    });

    it('should handle undefined params gracefully (treat as empty object)', () => {
        const configWithUndefinedParams = { method: 'get', url: baseURL, data: { info: 'test' } };
        const configWithEmptyParams = { method: 'get', url: baseURL, params: {}, data: { info: 'test' } };
        expect(keyBuilder(configWithUndefinedParams)).toBe(keyBuilder(configWithEmptyParams));
    });

    it('should handle null params gracefully (treat as empty object)', () => {
        const configWithNullParams = { method: 'get', url: baseURL, params: null, data: { info: 'test' } };
        const configWithEmptyParams = { method: 'get', url: baseURL, params: {}, data: { info: 'test' } };
        expect(keyBuilder(configWithNullParams)).toBe(keyBuilder(configWithEmptyParams));
    });

    it('should handle undefined data payload gracefully (treat as empty object)', () => {
        const configWithUndefinedData = { method: 'post', url: baseURL, params: { id: 1 } };
        const configWithEmptyData = { method: 'post', url: baseURL, params: { id: 1 }, data: {} };
        expect(keyBuilder(configWithUndefinedData)).toBe(keyBuilder(configWithEmptyData));
    });

    it('should handle null data payload gracefully (treat as empty object)', () => {
        const configWithNullData = { method: 'post', url: baseURL, params: { id: 1 }, data: null };
        const configWithEmptyData = { method: 'post', url: baseURL, params: { id: 1 }, data: {} };
        expect(keyBuilder(configWithNullData)).toBe(keyBuilder(configWithEmptyData));
    });

    it('should generate a key when only method and url are provided', () => {
        const config = { method: 'delete', url: `${baseURL}/123` };
        const key = keyBuilder(config);
        expect(key).toBeDefined();
        expect(key).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle complex nested objects in params and data', () => {
        const config1 = {
            method: 'put',
            url: `${baseURL}/complex`,
            params: { user: { id: 'u1', role: 'admin' }, settings: { theme: 'dark' } },
            data: { profile: { name: 'John Doe', preferences: [{ type: 'email', enabled: true }] } }
        };
        const config2 = {
            method: 'put',
            url: `${baseURL}/complex`,
            params: { user: { id: 'u1', role: 'admin' }, settings: { theme: 'dark' } },
            data: { profile: { name: 'John Doe', preferences: [{ type: 'email', enabled: true }] } }
        };
        const config3 = {
            method: 'put',
            url: `${baseURL}/complex`,
            params: { user: { id: 'u1', role: 'admin' }, settings: { theme: 'light' } }, // theme changed
            data: { profile: { name: 'John Doe', preferences: [{ type: 'email', enabled: true }] } }
        };
        expect(keyBuilder(config1)).toBe(keyBuilder(config2));
        expect(keyBuilder(config1)).not.toBe(keyBuilder(config3));
    });
});

describe('normalizeHeaders', () => {
    it("should return an empty object if headers are undefined", () => {
        const headers = undefined;
        const normalizedHeaders = normalizeHeaders(headers);
        expect(normalizedHeaders).toEqual({});
    })

    it("should return an empty object if headers are null", () => {
        const headers = null;
        const normalizedHeaders = normalizeHeaders(headers);
        expect(normalizedHeaders).toEqual({});
    })

    it("should return an empty object if headers are empty", () => {
        const headers = {};
        const normalizedHeaders = normalizeHeaders(headers);
        expect(normalizedHeaders).toEqual({});
    })

    it("should return an object with normalized keys", () => {
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': '123',
            'X-Custom-Header': 'custom-value'
        };
        const normalizedHeaders = normalizeHeaders(headers);
        expect(normalizedHeaders).toEqual({
            'content-type': 'application/json',
            'content-length': '123',
            'x-custom-header': 'custom-value'
        });
    })

    it("should return an object with normalized keys and lowercased values", () => {
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': '123',
            'x-Custom-header': 'custom-value-2'
        }
        const normalizedHeaders = normalizeHeaders(headers);
        expect(normalizedHeaders).toEqual({
            'content-type': 'application/json',
            'content-length': '123',
            'x-custom-header': 'custom-value-2'
        })
    })
})

describe('isValidResponse', () => {
    it('should return false if response is undefined', () => {
        const response = undefined;
        const isValid = isValidResponse(response);
        expect(isValid).toBe(false);
    })
    it('should return false if response is null', () => {
        const response = null;
        const isValid = isValidResponse(response);
        expect(isValid).toBe(false);
    })
    it('should return false if response status is not 2xx', () => {
        const response = {
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config: {}
        };
        const isValid = isValidResponse(response);
        expect(isValid).toBe(false);
    })
    it('should return false if response status is 2xx but headers are missing', () => {
        const response = {
            status: 200,
            statusText: 'OK',
        }
        const isValid = isValidResponse(response);
        expect(isValid).toBe(false);
    })
    it('should return false if response headers are missing', () => {
        const response = {
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        }
        const isValid = isValidResponse(response);
        expect(isValid).toBe(false);
    })
    it('should return false if response headers are missing "x-kache" header', () => {
        const response = {
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        }
        const isValid = isValidResponse(response);
        expect(isValid).toBe(false);
    })
})