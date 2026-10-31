// Service worker: shows order-update push notifications and opens the order when tapped.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "TheLayerUp", {
      body: data.body || "",
      icon: "/images/logo.png",
      badge: "/images/logo.png",
      data: { url: data.url || "/account" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabs) => {
      const tab = tabs.find((t) => t.url === url);
      return tab ? tab.focus() : self.clients.openWindow(url);
    })
  );
});
