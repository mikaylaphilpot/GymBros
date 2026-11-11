interface NotificationPayload {
  title: string;
  body: string;
  url: string;
}

interface PushEventLike extends ExtendableEvent {
  data?: {
    json(): Partial<NotificationPayload>;
    text(): string;
  };
}

interface NotificationClickEventLike extends ExtendableEvent {
  notification: {
    close(): void;
    data?: { url?: string };
  };
}

interface WorkerGlobalScopeLike {
  addEventListener(
    type: "push",
    listener: (event: PushEventLike) => void,
  ): void;
  addEventListener(
    type: "notificationclick",
    listener: (event: NotificationClickEventLike) => void,
  ): void;
  registration: ServiceWorkerRegistration;
  clients: Clients;
}

const worker = self as unknown as WorkerGlobalScopeLike;

// AI-assisted: displays push payloads and focuses an existing app window when
// a notification is opened, preserving the original notification behavior.
worker.addEventListener("push", (event) => {
  let data: NotificationPayload = {
    title: "GymBros Notification",
    body: "",
    url: "/",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    worker.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url },
    }),
  );
});

worker.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    worker.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (windowClients) => {
        const existingClient = windowClients.find((client) => "focus" in client);
        if (existingClient) {
          void existingClient.navigate(targetUrl);
          return existingClient.focus();
        }
        return worker.clients.openWindow(targetUrl);
      },
    ),
  );
});
