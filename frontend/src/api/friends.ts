const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "")
const usersApiUrl = `${apiBaseUrl}/api/users`
const authApiUrl = `${apiBaseUrl}/api/auth`

export interface Friend {
  friendId: string
  username: string
  streakCount: number
  bugCount: number
  lastBuggedAt: string | null
}

export interface UserSearchResult {
  id: string
  username: string
}

export interface FriendsByStats {
  otherFriends: Friend[]
  highestStreakFriend: Friend | null
  mostBuggedFriend: Friend | null
}

export interface FriendActionResult {
  message: string
  added?: boolean
  deleted?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getAuthToken(): string {
  const token = sessionStorage.getItem("authToken")
  if (!token) {
    throw new Error("Please sign in to view and manage your friends.")
  }

  return token
}

async function requestJson(
  url: string,
  init?: RequestInit,
): Promise<unknown> {
  const response = await fetch(url, init)
  let payload: unknown

  try {
    payload = await response.json()
  } catch {
    throw new Error("The server returned an invalid response.")
  }

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.message === "string"
      ? payload.message
      : "The request could not be completed."
    throw new Error(message)
  }

  return payload
}

function isFriend(value: unknown): value is Friend {
  return (
    isRecord(value) &&
    typeof value.friendId === "string" &&
    typeof value.username === "string" &&
    typeof value.streakCount === "number" &&
    typeof value.bugCount === "number" &&
    (typeof value.lastBuggedAt === "string" || value.lastBuggedAt === null)
  )
}

function isSearchResult(value: unknown): value is { _id: string; username: string } {
  return (
    isRecord(value) &&
    typeof value._id === "string" &&
    typeof value.username === "string"
  )
}

function parseFriend(value: unknown): Friend | null {
  if (value === null) {
    return null
  }

  if (!isFriend(value)) {
    throw new Error("The server returned invalid friend data.")
  }

  return value
}

export async function getCurrentUserId(): Promise<string> {
  const token = getAuthToken()
  const payload = await requestJson(`${authApiUrl}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!isRecord(payload) || typeof payload.id !== "string") {
    throw new Error("The server returned invalid account data.")
  }

  return payload.id
}

export async function searchUsers(
  query: string,
  currentUserId: string,
): Promise<UserSearchResult[]> {
  const params = new URLSearchParams({ q: query, currentUserId })
  const payload = await requestJson(`${usersApiUrl}/search?${params}`)

  if (
    !Array.isArray(payload) ||
    !payload.every(isSearchResult)
  ) {
    throw new Error("The server returned invalid search results.")
  }

  return payload.map((item) => ({
    id: item._id,
    username: item.username,
  }))
}

export async function getFriendsByStats(currentUserId: string): Promise<FriendsByStats> {
  const payload = await requestJson(
    `${usersApiUrl}/${encodeURIComponent(currentUserId)}/friends/stats`,
  )

  if (
    !isRecord(payload) ||
    !Array.isArray(payload.otherFriends) ||
    !payload.otherFriends.every(isFriend)
  ) {
    throw new Error("The server returned invalid friend data.")
  }

  return {
    otherFriends: payload.otherFriends,
    highestStreakFriend: parseFriend(payload.highestStreakFriend),
    mostBuggedFriend: parseFriend(payload.mostBuggedFriend),
  }
}

async function postFriendAction(
  currentUserId: string,
  friendId: string,
  method: "POST" | "DELETE",
): Promise<Record<string, unknown>> {
  const payload = await requestJson(
    `${usersApiUrl}/${encodeURIComponent(currentUserId)}/friends/${encodeURIComponent(friendId)}`,
    { method },
  )

  if (!isRecord(payload) || typeof payload.message !== "string") {
    throw new Error("The server returned an invalid response.")
  }

  if (method === "POST" && typeof payload.added !== "boolean") {
    throw new Error("The server returned an invalid response.")
  }

  if (method === "DELETE" && typeof payload.deleted !== "boolean") {
    throw new Error("The server returned an invalid response.")
  }

  return payload
}

export async function addFriend(
  currentUserId: string,
  friendId: string,
): Promise<FriendActionResult & { added: boolean }> {
  const payload = await postFriendAction(currentUserId, friendId, "POST")
  if (typeof payload.message !== "string" || typeof payload.added !== "boolean") {
    throw new Error("The server returned an invalid response.")
  }

  return { message: payload.message, added: payload.added }
}

export async function deleteFriend(
  currentUserId: string,
  friendId: string,
): Promise<FriendActionResult & { deleted: boolean }> {
  const payload = await postFriendAction(currentUserId, friendId, "DELETE")
  if (typeof payload.message !== "string" || typeof payload.deleted !== "boolean") {
    throw new Error("The server returned an invalid response.")
  }

  return { message: payload.message, deleted: payload.deleted }
}
