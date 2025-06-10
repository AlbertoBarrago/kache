import kache from '../index.js';

const CACHE_TTL_SECONDS = 10;
const NUM_REQUESTS = 100;
const testUrl = 'https://api.coinbase.com/v2/exchange-rates?currency=USD';

const kacheClient = kache({ cache: { type: 'redis', ttl: CACHE_TTL_SECONDS } });

async function runSingleRequest(url) {
    try {
        return kacheClient.get(url);
    } catch (error) {
        console.error(`Request failed for ${url}: ${error.message}`);
        throw error;
    }
}

async function benchmarkKache() {
    console.log(`Starting kache benchmark with ${NUM_REQUESTS} requests to ${testUrl}...`);

    console.log('Warming up cache with a single request...');
    try {
        await kacheClient.get(testUrl);
        console.log('Cache warmed up.');
    } catch (error) {
        console.error('Cache warm-up failed:', error.message);
        process.exit(1);
    }


    console.log(`Running ${NUM_REQUESTS} requests...`);
    const startTime = process.hrtime.bigint();

    const requests = [];
    for (let i = 0; i < NUM_REQUESTS; i++) {
        requests.push(runSingleRequest(testUrl));
        // await new Promise(resolve => setTimeout(resolve, 10));
    }

    try {
        await Promise.all(requests);
    } catch (error) {
        console.error('One or more benchmark requests failed.');
        // The individual errors are already logged by runSingleRequest's catch block
    }


    const endTime = process.hrtime.bigint();
    const durationNs = endTime - startTime;
    const durationMs = Number(durationNs) / 1_000_000; // Convert to milliseconds

    console.log(`\nBenchmark finished.`);
    console.log(`Total requests: ${NUM_REQUESTS}`);
    console.log(`Total time: ${durationMs.toFixed(2)} ms`);
    console.log(`Average time per request: ${(durationMs / NUM_REQUESTS).toFixed(2)} ms`);

    // Optional: Add a comparison point (e.g., direct axios calls)
    // console.log('\nRunning direct requests without kache for comparison...');
    // const axios = require('axios'); // You'd need to install axios if not already
    // const directStartTime = process.hrtime.bigint();
    // const directRequests = [];
    // for (let i = 0; i < NUM_REQUESTS; i++) {
    //     directRequests.push(axios.get(testUrl));
    // }
    // await Promise.all(directRequests);
    // const directEndTime = process.hrtime.bigint();
    // const directDurationMs = Number(directEndTime - directStartTime) / 1_000_000;
    // console.log(`Total time for direct requests: ${directDurationMs.toFixed(2)} ms`);
    // console.log(`Average time per direct request: ${(directDurationMs / NUM_REQUESTS).toFixed(2)} ms`);
}

// Run the benchmark
benchmarkKache().catch(console.error);