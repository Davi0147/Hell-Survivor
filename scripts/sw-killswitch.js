// Hell Survivor — Service Worker Emergency Kill-Switch
// Quando publicado como public/sw.js, este script desativa o Service Worker em todos os clientes,
// apaga 100% dos caches armazenados e força os navegadores a buscar arquivos diretamente da rede.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.matchAll({ type: 'window' });
    }).then((clients) => {
      for (const client of clients) {
        if (client.url && 'navigate' in client) {
          client.navigate(client.url);
        }
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora o cache completamente e vai direto para a rede
  event.respondWith(fetch(event.request));
});
