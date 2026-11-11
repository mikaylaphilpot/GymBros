const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"
const tokenKey = "gymbros_auth_token"

interface ApiResponse {
  message?: string
  token?: string
}

async function request(path: string, body: Record<string, string>): Promise<ApiResponse> {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error("Could not reach the GymBros server. Check that the API is running.")
  }

  const data = (await response.json().catch(() => ({}))) as ApiResponse
  if (!response.ok) {
    throw new Error(data.message || "Request failed. Please try again.")
  }

  return data
}

export async function logIn(username: string, password: string): Promise<void> {
  const data = await request("login", { username, password })
  if (!data.token) throw new Error("The server did not return an authentication token.")
  localStorage.setItem(tokenKey, data.token)
}

export function signUp(
  username: string,
  email: string,
  password: string,
): Promise<ApiResponse> {
  return request("signup", { username, email, password })
}
