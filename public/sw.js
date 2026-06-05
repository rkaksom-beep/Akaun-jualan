/**
 * Service Worker untuk Aplikasi Sistem Kawalan Jualan & Inventori Pintar
 * Menyokong pemasangan (PWA Installable) dan keupayaan luar talian (Offline Caching).
 */

const CACHE_NAME = 'sistem-jualan-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.png'
];

// Fasa Pemasangan & Cache Fail Statik Utama
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Pembersihan Versi Cache Lama semasa Pengaktifan
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Pintasan Rangkaian & Penyimpanan Cache Dinamik
self.addEventListener('fetch', (event) => {
  // Hanya intercept permintaan jenis HTTP GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Pulangkan versi cache sekiranya talian internet terputus
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // Simpan sumber yang baru dimuat turun secara dinamik ke dalam cache
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Sekiranya gagal memohon halaman (luar talian sepenuhnya)
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});
