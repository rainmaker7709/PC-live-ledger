const CACHE_NAME = 'live-ledger-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './xlsx.full.min.js',
  './icon-vl.ico' // 👈 오프라인 캐시에 이미지 파일 추가[cite: 2]
];

// 설치 단계: 필수 파일 캐싱[cite: 2]
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE); //[cite: 2]
    })
  );
  self.skipWaiting(); //[cite: 2]
});

// 활성화 단계: 이전 캐시 정리[cite: 2]
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); //[cite: 2]
          }
        })
      );
    })
  );
  self.clients.claim(); //[cite: 2]
});

// 요청 가로채기: 네트워크 연결 안 될 경우 캐시된 파일 제공[cite: 2]
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('script.google.com')) { //[cite: 2]
    return; //[cite: 2]
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; //[cite: 2]
      }
      return fetch(event.request); //[cite: 2]
    })
  );
});