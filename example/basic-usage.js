import kache from '../index.js';

const kacheClient = kache(); // Or configure with Redis: kache({ cache: { type: 'redis', ttl: 60 }});

const sampleUrl = 'https://jsonplaceholder.typicode.com/todos/1';

async function runExample() {
    try {
        console.log(`Fetching ${sampleUrl} for the first time...`);
        const response1 = await kacheClient.get(sampleUrl);
        console.log('Response 1 Status:', response1.status);
        console.log('Response 1 x-kache header:', response1.headers['x-kache']);
        // console.log('Response 1 Data:', response1.data);

        console.log('\nFetching the same URL again...');
        const response2 = await kacheClient.get(sampleUrl);
        console.log('Response 2 Status:', response2.status);
        console.log('Response 2 x-kache header:', response2.headers['x-kache']);
        // console.log('Response 2 Data:', response2.data);

        if (response1.headers['x-kache'] === 'MISS' && response2.headers['x-kache'] === 'HIT') {
            console.log('\n✅ Kache basic example successful: Fetched from origin then from cache.');
        } else {
            console.log('\n⚠️ Kache basic example issue: Caching behavior not as expected.');
        }

    } catch (error) {
        console.error('Error during example run:', error.message);
    }
}

runExample();