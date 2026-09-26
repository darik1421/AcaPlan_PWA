import { supabase } from '../lib/supabase'
import { endSession } from './endSession'

const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
export async function getProfile(token, signal) {
  const response = await fetch(base + '/me', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.error || 'No se pudo verificar el acceso.')
    error.status = response.status
    throw error
  }
  return body.profile
}

export async function logout() {
  return endSession({
    auth: supabase.auth, storage: localStorage, sessionStorage,
    navigate: url => window.location.replace(url),
  })
}
