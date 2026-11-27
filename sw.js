// 홈 화면 앱용 서비스 워커
// - 앱 화면(index.html·아이콘)을 저장해 두었다가 빨리 열어요. 항상 최신 버전을 먼저 받아오고, 인터넷이 없을 때만 저장본을 써요.
// - 편지 데이터(Firebase)는 저장하지 않아요. 항상 새로 받아와요.
// - 알림을 누르면 앱을 열고 그 편지를 보여줘요.
const CACHE = "airis-tree-v2";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Firebase·폰트 등 다른 곳은 그대로 통과
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const id = (e.notification.data && e.notification.data.id) || "";
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list){
      if ("focus" in c){ c.postMessage({ open: id }); return c.focus(); }
    }
    return self.clients.openWindow("./" + (id ? "?open=" + encodeURIComponent(id) : ""));
  })());
});
