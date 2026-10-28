/* Keeps the app working offline once it has been opened from http://localhost. */
const CACHE = "gnh-inventory-v2";
const FILES = [
 "./",
 "index.html",
 "config.js",
 "local-runtime.js",
 "shared-runtime.js",
 "manifest.webmanifest",
 "icons/apple-touch-icon.png",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/icon-maskable-512.png",
 "vendor/qrcode-generator-1.4.4.js",
 "vendor/supabase-js-2.117.2.js",
 "vendor/xlsx-0.18.5.full.min.js",
 "vendor/zxing-0.21.3.min.js"
];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // fonts and product lookups go straight to the network
  // network first so updates show up, the saved copy when offline
  e.respondWith(fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
