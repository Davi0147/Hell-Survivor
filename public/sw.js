// Hell Survivor — Service Worker mínimo (só para o jogo poder ser instalado como app).
// Decisão (2026-11-25): o jogo NÃO guarda cópia de si mesmo. Toda abertura busca a página
// atual na internet e apaga caches antigos, para uma atualização nunca ficar presa nem
// misturar versões. Os arquivos de código têm o hash no nome (nunca mudam) e as imagens já
// são pedidas com um marcador novo a cada carregamento (BootScene), então o navegador resolve o resto.
const BUILD_ID = '__BUILD_ID__';

// Ativa na hora: este worker não guarda nada, então trocar de versão não afeta o jogo aberto
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('hell-survivor')).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // A página do jogo vem sempre da internet, sem cache (o GitHub Pages guarda por 10 min)
  const isPage = event.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (isPage) {
    event.respondWith(fetch(url.href, { cache: 'no-store', credentials: 'same-origin' }));
  }
  // O resto segue o caminho normal do navegador
});

// Mantido para o verify-build e para saber qual versão está ativa
self.BUILD_ID = BUILD_ID;
