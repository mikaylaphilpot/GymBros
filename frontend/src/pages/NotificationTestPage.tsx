import { useState } from "react"
import {
  sendTestNotification,
  subscribeToPushNotifications,
} from "../utils/pushNotifications"

export default function NotificationTestPage() {
  const [userId, setUserId] = useState("")
  const [status, setStatus] = useState("")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isSending, setIsSending] = useState(false)

  async function handleSubscribe() {
    setStatus("")
    setIsSubscribing(true)
    try {
      await subscribeToPushNotifications()
      setStatus("Notifications enabled. You can now send a test notification.")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Subscription failed")
    } finally {
      setIsSubscribing(false)
    }
  }

  async function handleSendTest() {
    setStatus("")
    setIsSending(true)
    try {
      await sendTestNotification()
      setStatus("Test notification sent.")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sending failed")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl font-bold">GymBros notification test</h1>
      <p>
        Enter the MongoDB user ID that should receive the notification, then
        allow notifications in your browser.
      </p>
      <label htmlFor="notification-user-id">Recipient user ID</label>
      <input
        id="notification-user-id"
        value={userId}
        onChange={(event) => setUserId(event.target.value)}
        className="rounded border border-gray-400 px-3 py-2"
        placeholder="MongoDB ObjectId"
      />
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={isSubscribing}
        className="rounded bg-[#b31517] px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {isSubscribing ? "Enabling..." : "Enable notifications"}
      </button>
      <button
        type="button"
        onClick={handleSendTest}
        disabled={isSending}
        className="rounded border border-[#b31517] px-4 py-2 font-semibold text-[#b31517] disabled:opacity-50"
      >
        {isSending ? "Sending..." : "Send test notification"}
      </button>
      {status && <p role="status">{status}</p>}
    </main>
  )
}
