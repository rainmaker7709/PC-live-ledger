const CACHE_NAME = 'live-ledger-v7'; // v7으로 강제 업데이트
const ASSETS_TO_CACHE = [
  './',
  './index.html'
];

// 1. 설치 단계: 파일이 없어도 업데이트가 멈추지 않도록 안전한 캐싱 도입
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 🚨 핵심 원인 해결: xlsx 파일이 깃허브에 없더라도 SW 설치가 터지지 않게 분리
      // 파일이 없으면 에러를 뿜지 않고 부드럽게 무시(.catch)합니다.
      cache.add('./xlsx.full.min.js').catch(() => console.log('xlsx 파일 로컬 캐싱 건너뜀'));
      
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // 즉시 새 버전 활성화
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