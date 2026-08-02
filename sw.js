const CACHE_NAME = 'live-ledger-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html', // 작성하신 HTML 파일명으로 변경
  './xlsx.full.min.js'
];

// 설치 단계: 필수 파일 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 활성화 단계: 이전 캐시 정리
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

// 요청 가로채기: 네트워크 연결 안 될 경우 캐시된 파일 제공
self.addEventListener('fetch', (event) => {
  // 구글 앱스 스크립트(GAS) API 요청은 캐시하지 않고 네트워크로 직접 전달
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // 캐시된 파일이 있으면 반환하고, 배경에서 새 버전 업데이트 확인
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* 오프라인 시 무시 */});
        
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});