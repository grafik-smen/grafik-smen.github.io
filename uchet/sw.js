// Учёт переехал на https://razdensya-kabinet.github.io/ — старый офлайн-кэш учёта удаляется, сервис-воркер снимает себя
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('uchet-')).map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
  );
});
