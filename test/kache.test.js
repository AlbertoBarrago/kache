import kachy from '../index.js';
import { performance } from 'node:perf_hooks';

describe('Kachy HTTP caching', () => {
  const url = 'https://api.coinbase.com/v2/exchange-rates?currency=BTC';

  test('should return the same data for cached response (memory)', async () => {
    const client = kachy({ cache: { type: 'memory', ttl: 60 } });

    const res1 = await client.get(url);
    const res2 = await client.get(url);

    expect(res1.data).toEqual(res2.data);
    expect(res2.statusText).toMatch('OK (kache HIT)');
  });

  test('should return faster response on cache hit (memory)', async () => {
    const client = kachy({ cache: { type: 'memory', ttl: 60 } });

    const start1 = performance.now();
    await client.get(url);
    const time1 = performance.now() - start1;

    const start2 = performance.now();
    await client.get(url);
    const time2 = performance.now() - start2;

    expect(time2).toBeLessThan(time1);
  });

  test('should support redis cache if available', async () => {
    const client = kachy({ cache: { type: 'redis', ttl: 60 } });

    const res1 = await client.get(url);
    const res2 = await client.get(url);

    expect(res1.data).toEqual(res2.data);
    expect(res2.statusText).toMatch('OK (kache HIT)');
  });
});
