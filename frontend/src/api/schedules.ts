const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "")
const schedulesApiUrl = `${apiBaseUrl}/api/schedules`

export interface Schedule {
  _id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  activity: string
  isCompletedToday: boolean
}

function getAuthHeaders(): HeadersInit {
  const token = sessionStorage.getItem("authToken")
  if (!token) throw new Error("Please sign in to view your schedule.")
  return { Authorization: `Bearer ${token}` }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${schedulesApiUrl}${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...init?.headers },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "message" in payload
      ? String(payload.message)
      : "The schedule request could not be completed."
    throw new Error(message)
  }
  return payload
}

//Confirms the structure of a schedule item is as expected before use
function isSchedule(value: unknown): value is Schedule {
  return typeof value === "object" && value !== null &&
    typeof (value as Schedule)._id === "string" &&
    typeof (value as Schedule).dayOfWeek === "string" &&
    typeof (value as Schedule).startTime === "string" &&
    typeof (value as Schedule).endTime === "string" &&
    typeof (value as Schedule).activity === "string" &&
    typeof (value as Schedule).isCompletedToday === "boolean"
}

//Fetches user's schedule for the day from the DB
export async function getTodaySchedule(): Promise<Schedule[]> {
  const payload = await request("/today")
  if (!Array.isArray(payload) || !payload.every(isSchedule)) {
    throw new Error("The server returned invalid schedule data.")
  }
  return payload
}

//Updates the variable isCompletedToday in the DB based on user workout completion
export async function setScheduleCompletion(
  scheduleId: string,
  isCompletedToday: boolean,
): Promise<Schedule> {
  const payload = await request(`/${encodeURIComponent(scheduleId)}/completion`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isCompletedToday }),
  })
  if (!isSchedule(payload)) throw new Error("The server returned invalid schedule data.")
  return payload
}
