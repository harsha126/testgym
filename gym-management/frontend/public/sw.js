/* eslint-disable no-restricted-globals */

// ─── PWA: Caching ────────────────────────────────────────────────────────────

const CACHE_NAME = "iron-addicts-v1";

// Core shell assets to pre-cache on install
const PRECACHE_ASSETS = ["/", "/index.html", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME)
                        .map((key) => caches.delete(key)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", function (event) {
    const { request } = event;

    // Skip non-GET and chrome-extension requests
    if (request.method !== "GET" || request.url.startsWith("chrome-extension")) {
        return;
    }

    // Network-first for API calls — always try live data, fall back to cache
    if (request.url.includes("/api/")) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(request)),
        );
        return;
    }

    // Cache-first for static assets (JS, CSS, fonts, images)
    // For navigation requests (HTML) fall back to /index.html for SPA routing
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request)
                .then((response) => {
                    if (response.ok && request.method === "GET") {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    // Offline fallback: return the cached index.html for any navigation
                    if (request.destination === "document") {
                        return caches.match("/index.html");
                    }
                });
        }),
    );
});

// Allow the app to trigger a SW update check
self.addEventListener("message", function (event) {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

// ─── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener("push", function (event) {
    let data = {
        title: "Iron Addicts Gym",
        body: "You have a new notification",
        icon: "/icons/icon-192.png",
    };

    try {
        if (event.data) {
            data = { ...data, ...event.data.json() };
        }
    } catch (e) {
        // Use defaults
    }

    const options = {
        body: data.body,
        icon: data.icon || "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            url: self.location.origin,
        },
        actions: [
            { action: "open", title: "Open App" },
            { action: "dismiss", title: "Dismiss" },
        ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    if (event.action === "dismiss") return;

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then(function (clientList) {
                for (const client of clientList) {
                    if (
                        client.url.includes(self.location.origin) &&
                        "focus" in client
                    ) {
                        return client.focus();
                    }
                }
                return clients.openWindow(self.location.origin);
            }),
    );
});
