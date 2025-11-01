// src/services/customers.service.js
import { authedFetch } from './authService'

const BASE = '/api/customers'

export async function listCustomers(eventId) {
  const res = await authedFetch(`${BASE}/event/${eventId}`)
  if (!res.ok) throw new Error('Failed to list customers')
  return res.json()
}

export async function listCustomersWithStats(eventId) {
  const res = await authedFetch(`${BASE}/event/${eventId}/stats`)
  if (!res.ok) throw new Error('Failed to list customers with stats')
  return res.json()
}
export async function getCustomerDetails(eventId, customerId) {
  const res = await authedFetch(`/api/customers/${customerId}/event/${eventId}`)
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}


export async function updateCustomer(customerId, eventId, input) {
  const res = await authedFetch(`/api/customers/${customerId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, event_id: eventId }),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to update customer: ${txt}`)
  }

  return res.json()
}



const API = '/api/customers'

export async function listEventCustomers(eventId) {
  const res = await authedFetch(`${API}/event/${eventId}`)
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}

export async function createCustomer(eventId, form, isFormData = false) {
  let options
  if (isFormData) {
    options = { method: 'POST', body: form }
  } else {
    options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }
  }
  const res = await authedFetch(`${API}/event/${eventId}`, options)
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`Failed to create customer: ${msg}`)
  }
  return await res.json()
}

