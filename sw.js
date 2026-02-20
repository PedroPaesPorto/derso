const CACHE_NAME = 'derso-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/main.js',
  '/assets/logo.png'
];

// Instalação: Salva os arquivos básicos no cache
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

// Intercepta as requisições
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
