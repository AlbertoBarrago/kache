# @balby/kache
A smart HTTP client for Node.js that caches API responses using Redis or in-memory cache.
Ideal for reducing server load and redundant network calls.


[![npm version](https://badge.fury.io/js/%40balby%2Fkache.svg)](https://badge.fury.io/js/%40balby%2Fkache)
[![npm downloads](https://img.shields.io/npm/dm/%40balby%2Fkache.svg)](https://www.npmjs.com/package/%40balby%2Fkache)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## TypeScript Support

`@balby/kache` now ships with built-in type definitions, providing an improved developer experience with type safety and autocompletion in TypeScript projects.


## Why kache?

- **Reduce API Costs & Rate Limiting:** Avoid hitting API rate limits and potentially reduce costs associated with paid
  APIs by serving cached responses.
- **Improve Performance:** Deliver faster response times to your users by serving data from a high-speed cache.
- **Decrease Server Load:** Offload repetitive requests from your backend services or third-party APIs.
- **Resilience:** (If you implement stale-while-revalidate or serve stale on error) Provide a better user experience
  even when underlying APIs are slow or temporarily unavailable.

## Features

-   **Axios-Compatible Client:** Drop-in replacement for your existing Axios instances. Familiar API and interceptor support.
-   **Flexible Caching Strategies:**
    -   **Redis:** Leverage a persistent, distributed Redis cache for robust caching in production environments.
    -   **In-Memory:** Lightweight, fast caching suitable for development, testing, or single-instance deployments.
-   **TTL-Based Expiration:** Automatically expire and refresh cache entries based on a configurable Time-To-Live (TTL).
-   **Transparent Integration:** Caching logic is handled seamlessly. Your application code interacts with `kache` just like it would with a standard Axios client.
-   **Customizable:** Configure cache prefixes and serialization.
-   **Lightweight:** Minimal overhead added to your Axios requests.

## Installation

Install `kache` and its peer dependency `axios` using your preferred package manager (I use npm):

```npm
npm i @balby/kache axios
```

> #### Note on Dependencies:
> - *_axios_*: This is a peer dependency. 
 *You must install it* in your project alongside kache for kache to function correctly.
> - *_Caching Drivers_*: `kache` includes `ioredis` (for Redis support) and `node-cache` 
 (for in-memory caching) as direct dependencies. 
 You do not need to install these separately.

## Usage

```js
import kache from '@balby/kache';

const client = kache({
    cache: {type: 'redis', ttl: 60}
});

const res = await client.get('https://api.coinbase.com/v2/exchange-rates?currency=BTC');
console.log(res.data);
```

*(Note: Per-request cache control is a potential future enhancement. The syntax above is illustrative.)*

## API Reference

The `kache` client instance exposes the standard Axios HTTP methods:

-   `client.get(url[, config])`
-   `client.post(url[, data[, config]])` (Not cached by default)
-   `client.put(url[, data[, config]])` (Not cached by default)
-   `client.delete(url[, config])` (Not cached by default)
-   `client.patch(url[, data[, config]])` (Not cached by default)
-   `client.head(url[, config])`
-   `client.options(url[, config])`
-   `client.request(config)`

It also adds an `x-cache-status` header to responses from GET requests:
-   `HIT`: Response was served from cache.
-   `MISS`: Response was fetched from the origin server and potentially cached.
-   `BYPASS`: Caching was bypassed for this request (e.g., due to `exclude` rules or non-GET method).
-   `STALE`: (Future feature) A stale response was served while a fresh one is fetched in the background.

## Error Handling

`kache` uses standard Axios error handling.
If a network request fails or an error occurs during the caching process 
(e.g., Redis connection error), it will throw an error just like Axios would. 
Ensure you wrap your `await client.get(...)` calls in `try...catch` blocks.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/your-amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/your-amazing-feature`).
5.  Open a Pull Request.

Please make sure to update tests as appropriate and follow the existing code style.

## License

This project is licensed under the MIT License—see the `LICENSE` file for details.

**Enjoy** 😉



