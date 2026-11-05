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
  if (!body.profile || typeof body.profile !== 'object' || Array.isArray(body.profile)) {
    const error = new Error('No se recibió un perfil completo. Vuelve a comprobar tu acceso.')
    error.status = 503
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
