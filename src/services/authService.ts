// src/services/authService.ts
// Minimal auth & fetch helpers used across services

const TOKEN_KEY = 'jwt'

export function getToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function setToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {}
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

/**
 * authedFetch(url, init?)
 * Adds Authorization: Bearer <jwt> if present.
 * Leaves headers alone if you already passed them; merges otherwise.
 */
export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers = new Headers(init.headers || {})

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Let callers set Content-Type themselves (JSON or multipart)
  return fetch(input, { ...init, headers })
}

/** Example admin login helper (adjust endpoint to your server if different) */
export async function loginAdmin(username: string, password: string) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { const j = await res.json(); if (j?.error) msg = j.error } catch {}
    throw new Error(msg)
  }
  const data = await res.json()
  if (data?.token) setToken(data.token)
  return data
}

export function logout() {
  setToken(null)
}
