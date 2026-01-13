/*
 * SERVICE WORKER FOR KIREITAB
 * Handles image caching and instant loading
 * VERSION: v1.3.40 - Instant Image Loading
 * DATE: 2026-01-13
 * AUTHOR: khdxsohee
 */

const CACHE_NAME = 'kireitab-cache-v1';
const IMAGE_CACHE_NAME = 'kireitab-images-v1';

// Default images to cache
const DEFAULT_IMAGES = [
  'images/1.jpg',
  'images/2.jpg', 
  'images/3.jpg'
];

// Install - Cache essential resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache default images
      caches.open(IMAGE_CACHE_NAME).then(cache => {
        console.log('[Service Worker] Caching default images...');
        return cache.addAll(DEFAULT_IMAGES.map(img => new Request(img, {cache: 'reload'})));
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate - Clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients
      return self.clients.claim();
    })
  );
});

// Fetch - Serve from cache when possible
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle image requests (cache-first strategy)
  if (event.request.destination === 'image' || 
      url.pathname.endsWith('.jpg') || 
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpeg')) {
    
    event.respondWith(
      caches.match(event.request, {cacheName: IMAGE_CACHE_NAME})
        .then(cachedResponse => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', url.pathname);
            return cachedResponse;
          }
          
          // Not in cache, fetch from network
          return fetch(event.request)
            .then(networkResponse => {
              // Clone and cache the response
              const responseToCache = networkResponse.clone();
              caches.open(IMAGE_CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return networkResponse;
            })
            .catch(error => {
              console.log('[Service Worker] Fetch failed:', error);
              // Return a fallback if available
              return caches.match('images/1.jpg');
            });
        })
    );
    return;
  }
  
  // For other requests, use network-first strategy
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Message handling from extension pages
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_CACHED_IMAGE') {
    const imageUrl = event.data.url;
    
    caches.match(imageUrl, {cacheName: IMAGE_CACHE_NAME})
      .then(cachedResponse => {
        if (cachedResponse) {
          cachedResponse.blob().then(blob => {
            event.ports[0].postMessage({
              type: 'CACHED_IMAGE_RESPONSE',
              url: imageUrl,
              blob: blob
            });
          });
        } else {
          event.ports[0].postMessage({
            type: 'CACHED_IMAGE_RESPONSE',
            url: imageUrl,
            blob: null
          });
        }
      });
  }
});