/// <reference lib="webworker" />

// Minimal Service Worker for Vite PWA (injectManifest strategy)
// - Precache build assets
// - App Shell-style navigation fallback to index.html

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

// Take control ASAP on new versions
void self.skipWaiting()
clientsClaim()

// Clean old caches created by previous versions
cleanupOutdatedCaches()

// self.__WB_MANIFEST is injected at build time by workbox (via injectManifest)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST)

// App Shell routing: serve index.html for navigation requests
const navigationFallbackHandler = createHandlerBoundToURL('/index.html')

registerRoute(({ request, url }) => {
  if (request.mode !== 'navigate') return false
  if (url.pathname.startsWith('/_')) return false
  // Exclude URLs that look like files (e.g. /assets/main.js)
  if (/[^/?]+\.[^/]+$/.test(url.pathname)) return false
  return true
}, navigationFallbackHandler)

export {}


// --- Web Push handlers ---
self.addEventListener('push', (event) => {
  const data = (() => {
    try {
      return event.data ? event.data.json() : {};
    } catch {
      return {};
    }
  })();

  const title = data.title || 'Games of the Generals';
  const body = data.body || 'New notification';
  const tag = data.tag || 'gog';
  const url = data.url || '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      data: { url, ...(data.data || {}) },
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destination = event.notification?.data?.url || '/';
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing = allClients.find((c) => {
        try {
          const href = (c as any).url as string | undefined;
          return href ? new URL(href).origin === self.location.origin : false;
        } catch {
          return false;
        }
      });
      if (existing && 'focus' in existing) {
        try { (existing as unknown as Window).focus(); } catch { /* noop */ }
      }
      try { await self.clients.openWindow(destination); } catch { /* noop */ }
    })()
  );
});
