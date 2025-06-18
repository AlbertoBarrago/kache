/**
 * @description Different const status
 * @type {{HIT: string, MISS: string, BYPASS: string, STALE: string}}
 */
export const STATUS = {
    HIT: "HIT",
    MISS: "MISS",
    BYPASS: "BYPASS",
    STALE: "STALE"
};

/**
 * @description Cache type
 * @type {{REDIS: string}}
 */
export const CACHE_TYPE = {
    REDIS: "redis"
}

/**
 * @description HTTP status
 * @type {{OK: number, NOT_FOUND: number, BAD_REQUEST: number, INTERNAL_SERVER_ERROR: number}}
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    MULTIPLE_CHOICE: 300,
    NOT_FOUND: 404,
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500
}
