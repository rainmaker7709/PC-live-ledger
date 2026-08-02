const CACHE_NAME = 'live-ledger-v6';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './xlsx.full.min.js'
];

// 1. 설치 단계: 필수 파일 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. 활성화 단계: 이전 구버전 캐시 정리 및 즉시 제어권 획득
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. 요청 가로채기: HTML은 네트워크 우선, 기타 자원은 캐시 우선
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  // HTML 파일 요청 시 네트워크에서 먼저 최신 버전을 가져오고, 실패(오프라인) 시 캐시 사용
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 기타 정적 자원(JS, CSS 등)은 캐시 우선 사용
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});