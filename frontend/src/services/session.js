import { supabase } from '../lib/supabase'

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
  // El alcance local evita cerrar la sesión de la app móvil.
  let remoteConfirmed = false
  try {
    const result = await Promise.race([
      supabase.auth.signOut({ scope: 'local' }),
      new Promise(resolve => setTimeout(() => resolve({ error: true }), 3500)),
    ])
    remoteConfirmed = !result.error
  } catch { /* El cierre local siempre se completa. */ }
  localStorage.removeItem('acaplan-pwa-auth')
  localStorage.removeItem('acaplan-pwa-auth-code-verifier')
  sessionStorage.removeItem('acaplan-recovery')
  await supabase.auth.stopAutoRefresh()
  window.location.replace(remoteConfirmed ? '/?salida=ok' : '/?salida=local')
}

