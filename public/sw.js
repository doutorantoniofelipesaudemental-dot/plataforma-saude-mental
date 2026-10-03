/* Service worker do PWA: abre a home e os recursos estáticos mesmo sem rede.
   Nunca guarda /api nem páginas de admin; HTML vai à rede primeiro (conteúdo médico atualizado). */
const VERSAO = 'v1';
const CACHE = `saude-mental-${VERSAO}`;
const BASICOS = ['/', '/assets/css/style.css', '/assets/css/extras.css', '/assets/js/site.js', '/assets/js/extras.js', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k.startsWith('saude-mental-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api') || url.pathname.startsWith('/admin')) return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('/'))));
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname === '/favicon.svg') {
    e.respondWith(
      caches.match(req).then((r) => r || fetch(req).then((resp) => {
        if (resp.ok) { const copia = resp.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
        return resp;
      }))
    );
  }
});
