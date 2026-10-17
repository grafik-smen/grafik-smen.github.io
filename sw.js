// Офлайн-кэш для PWA.
// HTML — network-first (чтобы новые версии подхватывались сразу), остальное — cache-first.
const CACHE = 'shift-cal-v3';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // удаляем только старые кэши календаря: у учёта (uchet-*) свой кэш на этом же адресе
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('shift-cal-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  // учёт (/uchet/) и сайт (/site/) живут на этом же адресе — их страницы календарь не трогает
  const path = new URL(req.url).pathname;
  if (new URL(req.url).origin === location.origin && (path.startsWith('/uchet/') || path.startsWith('/site/'))) return;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // network-first: всегда пытаемся взять свежий index.html, офлайн — из кэша
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html').then(hit => hit || caches.match('./')))
    );
    return;
  }

  // прочие ресурсы — cache-first
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }))
  );
});
