import kache from '../index.js';
import Redis from 'ioredis';
import buildCacheKey from "../keyBuilder.js";

describe('Kache Redis Integration Tests (with real network calls)', () => {
  let redisClient;
  let kacheClient;
  const testUrl = 'https://api.coinbase.com/v2/exchange-rates?currency=BTC';
  const CACHE_TTL_SECONDS = 5;

  beforeAll(async () => {
    redisClient = new Redis();

    await new Promise((resolve, reject) => {
      redisClient.on('connect', resolve);
      redisClient.on('error', (err) => {
        console.error('Redis connection error in beforeAll:', err);
        reject(err);
      });
    });

    kacheClient = kache({ cache: { type: 'redis', ttl: CACHE_TTL_SECONDS } });
  });

  beforeEach(async () => {
    await redisClient.flushdb();
  });

  afterAll(async () => {
    if (redisClient) {
      await redisClient.quit();
    }
  });

  test('should fetch from origin and cache on first GET request, then serve from cache', async () => {
    const response1 = await kacheClient.get(testUrl);

    expect(response1.status).toBe(200);
    expect(response1.data).toBeDefined();
    expect(response1.data.data.currency).toBe('BTC');
    expect(response1.headers['x-kache']).toBe('MISS');
    expect(response1.headers['cache-control']).toBe(`public, max-age=${CACHE_TTL_SECONDS}`);

    const response2 = await kacheClient.get(testUrl);
    expect(response2.status).toBe(200);
    expect(response2.data).toEqual(response1.data); // Data should be identical
    expect(response2.headers['x-kache']).toBe('HIT');
    expect(response2.statusText).toMatch('(kache HIT)');
    expect(response2.headers['cache-control']).toBe(`public, max-age=${CACHE_TTL_SECONDS}`);
  }, 15000);

  test('should fetch from origin again after TTL expires', async () => {
    const initialResponse = await kacheClient.get(testUrl);
    expect(initialResponse.headers['x-kache']).toBe('MISS');

    const cachedResponse = await kacheClient.get(testUrl);
    expect(cachedResponse.headers['x-kache']).toBe('HIT');
    expect(cachedResponse.data).toEqual(initialResponse.data);

    await new Promise(resolve => setTimeout(resolve, CACHE_TTL_SECONDS * 1000 + 500));

    const expiredResponse = await kacheClient.get(testUrl);
    expect(expiredResponse.status).toBe(200);
    expect(expiredResponse.data).toBeDefined();
    expect(expiredResponse.headers['x-kache']).toBe('MISS');
  }, 20000);

  test('should not attempt to cache non-GET requests', async () => {
    const postUrl = 'https://jsonplaceholder.typicode.com/posts';
    const postData = { title: 'kache test', body: 'posting data', userId: 1 };

    const response = await kacheClient.post(postUrl, postData);

    expect(response.status).toBe(201);
    expect(response.data.title).toBe(postData.title);
    expect(response.headers['x-kache']).toBeUndefined();

    const key = buildCacheKey({ url: postUrl, method: 'post', data: postData });
    const cachedItem = await redisClient.get(key);
    expect(cachedItem).toBeNull();
  }, 15000);
});