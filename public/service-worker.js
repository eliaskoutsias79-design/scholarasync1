const CACHE_NAME = "scholarasync-v3";

const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache Supabase, OAuth, analytics, or any other cross-origin request.
  // Those responses may be private to the signed-in user.
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(event.request)) ||
            (await caches.match("/")) ||
            Response.error()
          );
        })
    );
    return;
  }

  const cacheableDestinations = new Set([
    "font",
    "image",
    "script",
    "style",
  ]);
  if (!cacheableDestinations.has(event.request.destination)) return;

  event.respondWith(
    caches.match(event.request).then(async (cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch {
    payload = { body: event.data?.text() || "You have a new ScholarAsync update." };
  }

  const title = payload.title || "ScholarAsync";
  const options = {
    body: payload.body || "You have a new notification.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag || "scholarasync-update",
    renotify: true,
    data: {
      url: payload.url || "/",
      ...payload.data,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) => client.url.startsWith(self.location.origin));
        if (existing) {
          existing.navigate(targetUrl);
          return existing.focus();
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
