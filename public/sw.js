// Minimal service worker: makes the app installable and caches hashed static
// assets. HTML and data are always fetched from the network so the app never
// goes stale.
const STATIC_CACHE = "static-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ---- web push ----
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* ignore */ }
  const title = data.title || "TaskTeamPro";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag || undefined,          // same tag replaces, no duplicate stacks
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/tasks" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/tasks";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if ("focus" in win) { win.navigate(url); return win.focus(); }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isHashedStatic =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") || /\.(png|ico|svg|woff2?)$/.test(url.pathname));

  if (event.request.method !== "GET" || !isHashedStatic) return; // network passthrough

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const hit = await cache.match(event.request);
      if (hit) return hit;
      const res = await fetch(event.request);
      if (res.ok) cache.put(event.request, res.clone());
      return res;
    })
  );
});
