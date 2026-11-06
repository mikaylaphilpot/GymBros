export type PushSubscriptionJson = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type PushSubscriptionResponse = {
  message: string;
};

declare global {
  interface ImportMeta {
    readonly env: Record<string, string | undefined>;
  }
}

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const bytes = Uint8Array.from(rawData, (character) => character.charCodeAt(0));
  return bytes.buffer as ArrayBuffer;
}

export async function subscribeToPushNotifications(
  token: string,
  options: {
    apiBaseUrl?: string;
    publicVapidKey?: string;
  } = {},
): Promise<PushSubscriptionJson> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported by this browser');
  }
  if (Notification.permission === 'denied') {
    throw new Error('Notification permission was denied');
  }

  const publicVapidKey = options.publicVapidKey || import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicVapidKey) {
    throw new Error('VITE_VAPID_PUBLIC_KEY is not configured');
  }

  const registration = await navigator.serviceWorker.register('/service-worker.js');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted');
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToArrayBuffer(publicVapidKey),
  });
  const serializedSubscription = subscription.toJSON() as PushSubscriptionJson;
  const response = await fetch(
    `${options.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || ''}/api/notifications/subscribe`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription: serializedSubscription }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to save push subscription');
  }

  await response.json() as Promise<PushSubscriptionResponse>;
  return serializedSubscription;
}
