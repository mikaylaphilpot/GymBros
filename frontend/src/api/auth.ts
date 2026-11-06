const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:5001").replace(/\/+$/, "")
const authApiUrl = `${apiBaseUrl}/api/auth`

interface ApiResponse {
  message?: string
  token?: string
}

function isApiResponse(value: unknown): value is ApiResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    (!("message" in value) || typeof value.message === "string") &&
    (!("token" in value) || typeof value.token === "string")
  )
}

async function postAuth(
  endpoint: "login" | "signup",
  body: Record<string, string>,
): Promise<ApiResponse> {
  const response = await fetch(`${authApiUrl}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error("The server returned an invalid response.")
  }

  if (!isApiResponse(payload)) {
    throw new Error("The server returned an invalid response.")
  }

  if (!response.ok) {
    throw new Error(payload.message ?? "The request could not be completed.")
  }

  return payload
}

export async function login(email: string, password: string): Promise<string> {
  const result = await postAuth("login", { email, password })

  if (!result.token) {
    throw new Error("The server did not return an authentication token.")
  }

  return result.token
}

export async function signup(
  username: string,
  email: string,
  password: string,
): Promise<string> {
  const result = await postAuth("signup", { username, email, password })
  return result.message ?? "Account created. Check your email to verify it."
}
