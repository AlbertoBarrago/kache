import kache from '../index.js';
import {performance} from 'node:perf_hooks';

/**
 * Measure the time
 * @param {import('axios').AxiosInstance} client
 * @param {string} url
 */
async function benchmarkRequest(client, url) {
    const start = performance.now();
    const response = await client.get(url);
    const end = performance.now();

    const duration = (end - start).toFixed(2);
    console.log(
        `Tempo: ${duration} ms | Status: ${response.status} ${response.statusText} 
        | X-Kache: ${response.headers['x-kache']} 
        | Cache-Control: ${response.headers['cache-control']}`
    );
    return response.data;
}

// const client = kache({
//     cache: {type: 'redis', ttl: 60} // 60 seconds TTL
// });
//To test memory cache:
const client = kache({
    cache: {type: 'memory', ttl: 30}
});

const runBenchmark = async () => {
    const url = 'https://api.coinbase.com/v2/exchange-rates?currency=BTC';

    console.log('▶️  First call (no kache, HTTP cache MISS from kache)...');
    await benchmarkRequest(client, url);

    console.log('\n▶️  Second call (kache HIT)...');
    await benchmarkRequest(client, url);

    console.log('\n▶️  Third call (kache HIT)...');
    await benchmarkRequest(client, url);

    console.log('\n▶️  POST call (not cached by kache)...');
    try {
        const postResponse = await client.post('https://jsonplaceholder.typicode.com/posts', {
            title: 'foo',
            body: 'bar',
            userId: 1
        });
        console.log(`POST request to jsonplaceholder succeeded with status ${postResponse.status}. kache did not cache it, as expected.`);
    } catch (error) {
        console.log(`POST request observed by kache, but not cached. Error: ${error.message}`);
    }
};

runBenchmark().catch(console.error);
