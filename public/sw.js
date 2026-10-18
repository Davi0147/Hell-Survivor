// Hell Survivor PWA Service Worker — Versionado & Atômico
const BUILD_ID = '__BUILD_ID__';
const CACHE_NAME = 'hell-survivor-' + BUILD_ID;

// 1. Instalação: NÃO usa skipWaiting automático (espera confirmação do jogador).
// Exceção ÚNICA de migração: se o cache legado 'hell-survivor-cache-v1' existir, ativa imediatamente.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.has('hell-survivor-cache-v1').then((hasLegacyCache) => {
      if (hasLegacyCache) {
        return self.skipWaiting();
      }
    })
  );
});

// 2. Mensagem: ativação sob demanda acionada pelo clique em "RECARREGAR" no banner
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 3. Ativação: apaga apenas caches pertencentes ao Hell Survivor (prefixo 'hell-survivor-')
// diferentes do CACHE_NAME atual (inclui o legado 'hell-survivor-cache-v1'),
// preservando caches de outros projetos na mesma origem do GitHub Pages.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('hell-survivor-') && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 4. Interceptação de Rede (Fetch):
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Ignora requisições de outras origens (ex: Google Fonts)
  if (url.origin !== self.location.origin) return;

  // A) index.html e rotas de navegação: Rede Primeiro (Network-First) com cache de reserva
  if (event.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // B) Arquivos com hash em /assets/ (JS e CSS compilados pelo Vite): Cache Primeiro (Cache-First)
  if (url.pathname.includes('/assets/') && /\.(js|css)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // C) Arquivos sem hash (sprites, áudio, imagens, fontes, manifest, favicon):
  // Rede com cache: 'no-cache' para revalidar, e cache de reserva offline
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' }).then((response) => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});
