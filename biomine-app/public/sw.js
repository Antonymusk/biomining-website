const CACHE_NAME = "biomine-cache-v0.9.5";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/manifest.webmanifest"
];

// Installation: Pre-cache static shell UI resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[BioMine SW] Pre-caching static app shell resources...");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation: Purge stale caches during deployments
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[BioMine SW] Deleting obsolete cache key:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Interceptor: Serving static shell UI, forcing network-only for critical live states
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 🚨 CRITICAL SECURITY EXCLUSIONS: Skip caching for non-http/https, dynamic queries, alerts, and authentication endpoints
  if (
    !event.request.url.startsWith("http") ||
    event.request.method !== "GET" ||
    url.pathname.includes("/rest/v1/") ||
    url.pathname.includes("/auth/v1/") ||
    url.hostname.includes("supabase.co") ||
    url.pathname.includes("/realtime/")
  ) {
    // Forward straight to network
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return static asset immediately from cache, and fetch fresh resource in background (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Offline */});
        
        return cachedResponse;
      }

      // Network Fallback for static assets not pre-cached
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse && 
            networkResponse.status === 200 && 
            event.request.method === "GET" && 
            !event.request.url.includes("chrome-extension")
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If completely offline and requesting document shell, serve cached index fallback
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});
