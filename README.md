# kache

A smart HTTP client for Node.js that caches API responses using Redis or in-memory cache. Ideal for reducing server load and redundant network calls.

## Features

- Axios-compatible client
- Redis or in-memory caching
- TTL-based automatic expiration
- Transparent integration

## Usage

```js
import kache from 'kache';

const client = kache({
  cache: { type: 'redis', ttl: 60 }
});

const res = await client.get('https://api.coinbase.com/v2/exchange-rates?currency=BTC');
console.log(res.data);
```


