// Service Worker for TaskMate & Lock Screen Push Notifications
const CACHE_NAME = 'taskmate-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Background Push / Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickAction = event.action;
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen for messages from web application to trigger background notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: 'https://media.licdn.com/dms/image/v2/C560BAQF9ZB9CkX4iUA/company-logo_200_200/company-logo_200_200/0/1630643946400/sokha_printing_logo?e=2147483647&v=beta&t=pw-C2fZF3thYSrSFbhK49soL50jSUHpnBkpwzshWplw',
      badge: 'https://media.licdn.com/dms/image/v2/C560BAQF9ZB9CkX4iUA/company-logo_200_200/company-logo_200_200/0/1630643946400/sokha_printing_logo?e=2147483647&v=beta&t=pw-C2fZF3thYSrSFbhK49soL50jSUHpnBkpwzshWplw',
      vibrate: [250, 100, 250, 100, 250],
      requireInteraction: true,
      tag: 'taskmate-reminder-' + Date.now(),
      renotify: true,
      ...options,
    });
  }
});
