// growth-shelter アプリ用サービスワーカー
// 「ネットワーク優先・失敗したらキャッシュ」方式で、オフラインでも直前の状態を開けるようにする

const CACHE_NAME = "growth-shelter-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const fresh = await fetch(event.request);
        // 取得できたら常に最新版をキャッシュへ保存しておく
        cache.put(event.request, fresh.clone());
        return fresh;
      } catch (err) {
        // オフライン等でネットワークが使えない時はキャッシュを返す
        const cached = await cache.match(event.request);
        if (cached) return cached;
        throw err;
      }
    })
  );
});
