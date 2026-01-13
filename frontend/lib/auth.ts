export const API_URL = "http://localhost:8000"

export async function getAuthToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

export async function getUserRole() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("user_role")
}

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken()

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  } as Record<string, string>

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user_role")
      window.location.href = "/login"
      // Halt execution to prevent callers from showing errors while redirecting
      await new Promise(() => { })
    }
  }

  return response
}

export function isAuthenticated() {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem("access_token")
}

export function isCeoAdmin() {
  if (typeof window === "undefined") return false
  return localStorage.getItem("user_role") === "ceoadmin"
}
