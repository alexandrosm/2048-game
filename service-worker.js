const CACHE_NAME = '2048-game-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// Install service worker and cache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => {
                    return name !== CACHE_NAME;
                }).map((name) => {
                    return caches.delete(name);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Serve files from cache or fetch from network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response; // Return cached file
                }
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache responses with status not 200
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // Clone the response to use it both for browser and cache
                        const responseToCache = response.clone();

                        // Cache new fetched files
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
            }).catch(() => {
                // Offline fallback - could return a specific offline page
                return new Response('You appear to be offline. Please try again when you have an internet connection.');
            })
    );
});
