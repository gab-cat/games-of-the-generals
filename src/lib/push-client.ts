export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    // If a SW is already registered, use it
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      // Use Vite PWA's helper in dev (and prod too, it's idempotent)
      try {
        const { registerSW } = await import('virtual:pwa-register');
        registerSW({ immediate: true });
      } catch {
        // Fallback: manual register only in production, where /sw.js exists
        if (!import.meta.env.DEV) {
          try {
            await navigator.serviceWorker.register('/sw.js');
          } catch (err) {
            console.error('SW manual registration failed', err);
          }
        }
      }
      // Wait until the active SW is ready
      registration = await navigator.serviceWorker.ready;
    }
    return registration;
  } catch (e) {
    console.error('SW registration/ready failed', e);
    return null;
  }
}

export async function getPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  const reg = await registerServiceWorker();
  if (!reg) return null;
  const permission = await getPushPermission();
  if (permission !== 'granted') return null;

  try {
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    return sub;
  } catch (e) {
    console.error('Push subscribe failed', e);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const existing = await reg.pushManager.getSubscription();
  if (!existing) return true;
  return await existing.unsubscribe();
}

export function serializeSubscription(sub: PushSubscription): any {
  return {
    endpoint: sub.endpoint,
    expirationTime: sub.expirationTime ?? undefined,
    keys: (sub.toJSON() as any).keys,
    userAgent: navigator.userAgent,
  };
}


