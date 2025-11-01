// src/services/live.service.js

import { fetchBeersForEvent } from '@/services/beers.service.js'
import api from "@/config/axiosConfig.js";

// Singleton-tilkobling og event listeners
let source = null
const listeners = new Map()

export function connectLive(eventId) {
  if (source) return source // allerede koblet

  if (!eventId) throw new Error('[live] eventId mangler')

  // hent baseURL og token fra axiosConfig
  const baseURL = api.defaults.baseURL
  const token = api.defaults.headers.common.Authorization?.replace('Bearer ', '')

  const url = `${baseURL}/api/live/events/${eventId}/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`
  console.info('[live] connecting to', url)

  source = new EventSource(url)

  // --- Event handlers ---
  source.addEventListener('open', () => console.info('[live] connected'))
  source.addEventListener('error', (err) => console.warn('[live] connection error', err))

  // 🔹 Prisoppdatering (øl)
  source.addEventListener('priceUpdate', async (e) => {
    try {
      const { eventId: id } = JSON.parse(e.data)
      if (id !== eventId) return
      const updated = await fetchBeersForEvent(eventId)
      emit('priceUpdate', updated)
    } catch (err) {
      console.warn('[live] priceUpdate parse failed', err)
    }
  })

  // 🔹 Ny kunde
  source.addEventListener('customerUpdate', (e) => {
    try {
      const data = JSON.parse(e.data)
      emit('customerUpdate', data)
    } catch (err) {
      console.warn('[live] customerUpdate parse failed', err)
    }
  })

  // 🔹 Ny transaksjon
  source.addEventListener('transactionUpdate', (e) => {
    try {
      const data = JSON.parse(e.data)
      emit('transactionUpdate', data)
    } catch (err) {
      console.warn('[live] transactionUpdate parse failed', err)
    }
  })

  return source
}

// --- Lytte / stoppe ---
export function on(event, callback) {
  if (!listeners.has(event)) listeners.set(event, new Set())
  listeners.get(event).add(callback)
}

export function off(event, callback) {
  listeners.get(event)?.delete(callback)
}

function emit(event, payload) {
  listeners.get(event)?.forEach((fn) => fn(payload))
}

export function disconnectLive() {
  if (source) {
    source.close()
    source = null
    listeners.clear()
    console.info('[live] disconnected')
  }
}
