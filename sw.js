// CineSkills Service Worker — 100% Offline Capability (Network First with Cache Fallback)
const CACHE_NAME = "cineskills-v19";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./data.js",
  "./cineskills_db.json",
  "./manifest.json",
  "./js/app.js",
  "./js/state.js",
  "./js/matrix.js",
  "./js/profile.js",
  "./js/charts.js",
  "./js/gear.js",
  "./js/quests.js",
  "./js/sync.js"
];

// Install Event — Pre-cache static app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching CineSkills app shell");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event — Clean up all old caches immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event — Network First with Offline Cache Fallback strategy
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.includes("supabase.co")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
