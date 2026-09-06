/* CAP 221 — Service Worker
   Cache hors-ligne : le site reste consultable sans connexion.
   Stratégie :
   - App Shell (HTML/CSS/JS/icons) : cache-first + revalidation en arrière-plan.
   - Images externes : cache-first simple.
   - API IA + EmailJS : toujours réseau (jamais mis en cache).
*/
const CACHE_NAME = "cap221-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/mentions-legales.html",
  "/politique-confidentialite.html",
  "/css/style.css",
  "/css/legal.css",
  "/js/code.js",
  "/img/logo-cap221.png",
  "/img/icon-192.png",
  "/img/icon-512.png",
  "/site.webmanifest",
  "/404.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Jamais de cache pour l'IA ni pour l'envoi d'emails
  if (url.pathname.startsWith("/api/")) return;
  if (url.hostname.includes("emailjs")) return;

  // Navigations : réseau d'abord, cache en secours (hors-ligne)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/index.html")),
        ),
    );
    return;
  }

  // Ressources locales & CDN : cache-first, revalidation en arrière-plan
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (
            response &&
            (response.status === 200 || response.type === "opaque")
          ) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
