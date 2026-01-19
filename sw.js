self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    // 기본 네트워크 우선 전략
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
