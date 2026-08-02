const CACHE_NAME = 'live-ledger-v3'; // 버전 업그레이드로 캐시 초기화
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './xlsx.full.min.js'
];

// 설치 단계: 필수 파일 개별 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('캐시 실패 파일:', asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// 활성화 단계: 이전 캐시 완전 삭제
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

// 요청 가로채기: 오프라인 모드 최우선 처리
self.addEventListener('fetch', (event) => {
  // 구글 앱스 스크립트(GAS) API는 캐시에서 제외
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // 새로고침(페이지 이동) 시 캐시가 없으면 기본 index.html 제공
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html') || caches.match('./');
      }

      return fetch(event.request).catch(() => {
        /* 오프라인 연결 실패 시 에러 방지 */
      });
    })
  );
});