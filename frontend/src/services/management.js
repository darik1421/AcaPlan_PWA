import { supabase } from '../lib/supabase'
const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
export async function api(path, { method = 'GET', data, signal } = {}) {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) throw Object.assign(new Error('Inicia sesión para continuar.'),{status:error ? (error.status === 401 || error.status === 403 ? error.status : 503) : 401})
  let response
  try {
    response = await fetch(base + path, {
      method, headers: { Authorization: `Bearer ${session.access_token}`, ...(data ? { 'Content-Type': 'application/json' } : {}) },
      body: data ? JSON.stringify(data) : undefined, cache: 'no-store',
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(45000)]) : AbortSignal.timeout(45000),
    })
  } catch (err) {
    if (signal?.aborted) throw err
    throw Object.assign(new Error(method === 'GET' ? 'No se pudo conectar con el servidor.' : 'No se pudo confirmar el resultado. Actualiza la lista antes de repetir la operación.'),{status:503})
  }
  const body = await response.json().catch(() => null)
  if (!response.ok || body === null) throw Object.assign(new Error(body?.error || 'No se pudo confirmar la respuesta del servidor.'),{status:response.ok ? 503 : response.status})
  return body
}
