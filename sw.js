const DEFAULT_ICON = "/icons/connects-icon-192.png";
const DEFAULT_BADGE = "/icons/connects-badge-96.png";

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let payload = {};
      try {
        payload = event.data?.json() || {};
      } catch {
        payload = { body: event.data?.text() || "You have new activity." };
      }

      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const activeConnectsWindow = windows.find(
        (client) => client.visibilityState === "visible" && client.focused,
      );

      if (activeConnectsWindow) {
        activeConnectsWindow.postMessage({
          type: "CONNECTS_PUSH_RECEIVED",
          payload,
        });
        return;
      }

      await self.registration.showNotification(
        payload.title || "Connects University",
        {
          body: payload.body || "You have new activity.",
          icon: payload.icon || DEFAULT_ICON,
          badge: DEFAULT_BADGE,
          tag: payload.tag || `connects-${Date.now()}`,
          renotify: true,
          silent: false,
          vibrate: [180, 70, 180],
          timestamp: payload.timestamp || Date.now(),
          data: payload.data || { url: "/" },
        },
      );
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const data = event.notification.data || {};
      const destination = new URL(data.url || "/", self.location.origin).href;
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existing = windows.find(
        (client) => new URL(client.url).origin === self.location.origin,
      );
      if (existing) {
        await existing.focus();
        existing.postMessage({
          type: "CONNECTS_NOTIFICATION_CLICK",
          payload: data,
        });
        return;
      }
      await self.clients.openWindow(destination);
    })(),
  );
});

