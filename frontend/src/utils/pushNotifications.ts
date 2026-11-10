export type PushSubscriptionJson = {
  endpoint: string
  expirationTime?: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4)
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const bytes = Uint8Array.from(rawData, (character) => character.charCodeAt(0))
  return bytes.buffer
}

export async function subscribeToPushNotifications(
  userId: string,
): Promise<PushSubscriptionJson> {
  if (!userId.trim()) {
    throw new Error("Enter the MongoDB user ID before subscribing")
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications are not supported by this browser")
  }

  const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!publicVapidKey) {
    throw new Error("VITE_VAPID_PUBLIC_KEY is not configured")
  }
  if (Notification.permission === "denied") {
    throw new Error("Notification permission was denied in browser settings")
  }

  await navigator.serviceWorker.register("/service-worker.js")
  const registration = await navigator.serviceWorker.ready
  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted")
  }

  const existingSubscription = await registration.pushManager.getSubscription()
  const subscription =
    existingSubscription ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToArrayBuffer(publicVapidKey),
    }))
  const serializedSubscription = subscription.toJSON() as PushSubscriptionJson
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"
  const response = await fetch(`${apiBaseUrl}/api/notifications/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId.trim(),
    },
    body: JSON.stringify({ subscription: serializedSubscription }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || "Failed to save push subscription")
  }

  return serializedSubscription
}

export async function sendTestNotification(userId: string): Promise<void> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"
  const response = await fetch(`${apiBaseUrl}/api/notifications/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId.trim(),
    },
    body: JSON.stringify({
      title: "GymBros Test",
      messageText: "Time to train!",
      url: "/",
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || "Failed to send test notification")
  }
}
