// src/services/authService.ts

export type LoginResponse = { token: string }

const BASE = '/api'

export async function loginAdmin(username: string, password: string): Promise<{ data: LoginResponse }> {
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    let msg = `Login failed (${res.status})`
    try {
      const j = await res.json()
      if (j?.error) msg = j.error
    } catch {}
    throw new Error(msg)
  }
  const json = (await res.json()) as LoginResponse
  if (!json?.token) throw new Error('No token in response')
  return { data: json }
}

export function getToken(): string | null {
  return sessionStorage.getItem('jwt')
}
export function setToken(token: string) {
  sessionStorage.setItem('jwt', token)
}
export function clearToken() {
  sessionStorage.removeItem('jwt')
}
export function isAuthenticated(): boolean {
  return !!getToken()
}

// Attach JWT automatically for protected requests
export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getToken()
  const headers = new Headers(init.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(input, { ...init, headers })
}
