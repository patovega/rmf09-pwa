const PREFIJO = "pauta-rmf09-";
const CACHE = PREFIJO + "v1";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.png"
];

self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ARCHIVOS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (evento) {
  // Solo borra versiones VIEJAS DE ESTE MISMO RMF (mismo prefijo): el Cache
  // Storage es por origen, no por carpeta, así que si los 14 quedan
  // publicados bajo el mismo dominio (un repo, una carpeta por RMF), borrar
  // cualquier nombre que no calce con el propio se llevaba por delante la
  // caché de los otros 13.
  evento.waitUntil(
    caches.keys().then(function (nombres) {
      return Promise.all(
        nombres
          .filter(function (n) { return n.indexOf(PREFIJO) === 0 && n !== CACHE; })
          .map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (evento) {
  if (evento.request.method !== "GET") return;

  evento.respondWith(
    caches.match(evento.request).then(function (enCache) {
      const redFetch = fetch(evento.request)
        .then(function (respuesta) {
          if (respuesta && respuesta.ok && evento.request.url.startsWith(self.location.origin)) {
            const copia = respuesta.clone();
            caches.open(CACHE).then(function (cache) { cache.put(evento.request, copia); });
          }
          return respuesta;
        })
        .catch(function () { return enCache; });
      return enCache || redFetch;
    })
  );
});
