/**
 * api.js — Authenticated fetch wrapper for the FastAPI backend.
 *
 * All requests automatically attach the Supabase JWT from the current session.
 * API_BASE reads from VITE_API_URL (default: http://localhost:8000)
 */

import { supabase } from '@/lib/supabase'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token ?? ''
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function handleResponse(res) {
  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`)
    throw new Error(msg)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: await authHeaders() })
    return handleResponse(res)
  },

  post: async (path, body = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  },

  put: async (path, body = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  },

  delete: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    })
    return handleResponse(res)
  },

  /**
   * stream — POST a request and return the raw Response for SSE reading.
   */
  stream: async (path, body = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Stream error: HTTP ${res.status}`)
    return res
  },

  /**
   * form — POST a multipart/form-data request.
   */
  form: async (path, formData) => {
    const headers = await authHeaders()
    delete headers['Content-Type'] // Let browser set boundary
    
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    })
    return handleResponse(res)
  },

  /**
   * streamForm — POST multipart/form-data and return raw Response for SSE.
   */
  streamForm: async (path, formData) => {
    const headers = await authHeaders()
    delete headers['Content-Type'] // Let browser set boundary
    
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    })
    if (!res.ok) throw new Error(`Stream error: HTTP ${res.status}`)
    return res
  },
}
