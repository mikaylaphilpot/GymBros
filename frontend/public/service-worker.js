self.addEventListener("push", (event) => {
  let data = { title: "GymBros Notification", body: "", url: "/" }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch {
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const existingClient = windowClients.find((client) => "focus" in client)
      if (existingClient) {
        existingClient.navigate(targetUrl)
        return existingClient.focus()
      }
      return clients.openWindow(targetUrl)
    }),
  )
})
