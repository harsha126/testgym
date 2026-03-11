/* eslint-disable no-restricted-globals */

// Service Worker for Push Notifications

self.addEventListener("push", function (event) {
    let data = {
        title: "Iron Addicts Gym",
        body: "You have a new notification",
        icon: "/vite.svg",
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
        icon: data.icon || "/vite.svg",
        badge: "/vite.svg",
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
