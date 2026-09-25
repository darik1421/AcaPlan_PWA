import { AccessError } from './auth.js'
import { accountInput, periodInput, positiveId } from './validation.js'

const businessErrors = {
  ULTIMO_ADMIN: [409, 'No puedes desactivar ni cambiar el rol del último administrador activo.'],
  NO_ENCONTRADO: [404, 'El registro ya no existe. Actualiza la lista.'],
  PERMISO_DENEGADO: [403, 'Tu cuenta no tiene permiso para esta operación.'],
  DUPLICADO: [409, 'El correo o la cédula ya están registrados.'],
  DATOS_INVALIDOS: [400, 'Revisa los campos, funciones y carreras seleccionadas.'],
  AUTH_NO_EXISTE: [409, 'No se encontró la cuenta de autenticación correspondiente.'],
}
export function createManagement({
  url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_ANON_KEY,
  serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
  fetchImpl = fetch,
} = {}) {
  async function rpc(request, action, payload = {}) {
    if (!url || !key) throw new AccessError(503, 'Falta configurar Supabase en el backend.')
    let response
    try {
      response = await fetchImpl(`${url}/rest/v1/rpc/pwa_sprint1`, {
        method: 'POST',
        headers: { apikey: key, Authorization: request.headers.authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
        signal: AbortSignal.timeout(15000),
      })
    } catch {
      const error = new AccessError(503, 'No se pudo confirmar la operación. Actualiza la lista antes de volver a intentarlo.')
      error.uncertain = true
      throw error
    }
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      if (body?.code === 'PGRST202' || response.status === 404) throw new AccessError(503, 'Falta aplicar la preparación SQL del Sprint 1 en Supabase.')
      const mapped = businessErrors[body?.message]
      if (mapped) throw new AccessError(...mapped)
      if (body?.code === '23505') throw new AccessError(409, 'Ya existe un registro con esos datos o un período activo. Actualiza la lista.')
      if (body?.code === '42501') throw new AccessError(403, 'No tienes permiso para esta operación.')
      if (body?.code?.startsWith('22') || body?.code === '23514') throw new AccessError(400, 'Revisa los datos del formulario.')
      const error = new AccessError(503, 'No se pudo confirmar la operación con la base de datos.')
      error.uncertain = true
      throw error
    }
    if (body === null) {
      const error = new AccessError(503, 'Respuesta incompleta. Actualiza la lista antes de reintentar.')
      error.uncertain = true
      throw error
    }
    return body
  }

  async function createAccount(request, data) {
    const input = accountInput(data, true)
    // Comprueba permisos, esquema y duplicados antes de crear en Auth.
    await rpc(request, 'accounts.check', { correo: input.correo, cedula: input.cedula })
    if (!serviceKey) throw new AccessError(503, 'Añade SUPABASE_SERVICE_ROLE_KEY en backend/.env y reinicia el backend para crear cuentas.')
    const adminHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
    let response
    try {
      response = await fetchImpl(`${url}/auth/v1/admin/users`, {
        method: 'POST', headers: adminHeaders,
        body: JSON.stringify({ email: input.correo, password: input.password, email_confirm: true }),
        signal: AbortSignal.timeout(15000),
      })
    } catch { throw new AccessError(503, 'No se pudo confirmar la creación en Auth. Revisa Supabase antes de reintentar.') }
    const auth = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new AccessError(503, 'La clave administrativa del backend no es válida.')
      throw new AccessError(409, 'No se pudo crear la cuenta en Auth. Revisa si el correo ya existe o la contraseña incumple la política.')
    }
    const authId = auth.id || auth.user?.id
    if (!authId) throw new AccessError(503, 'No se pudo confirmar la cuenta creada en Auth. Revisa Supabase.')
    const { password: _password, ...profile } = input
    try {
      return await rpc(request, 'accounts.create', profile)
    } catch (error) {
      // Un fallo de red puede ocurrir DESPUÉS del commit: nunca borrar en ese caso.
      if (error.uncertain) throw error
      try {
        const cleanup = await fetchImpl(`${url}/auth/v1/admin/users/${encodeURIComponent(authId)}`, {
          method: 'DELETE', headers: adminHeaders, signal: AbortSignal.timeout(10000),
        })
        if (!cleanup.ok) throw new Error('cleanup')
      } catch {
        throw new AccessError(503, 'La cuenta Auth fue creada, pero el perfil no se guardó. Un administrador debe revisar esa cuenta en Supabase.')
      }
      throw error
    }
  }

  return {
    async execute(request, profile, route, data) {
      if (route.startsWith('accounts.') && profile.rol !== 'administrador') throw new AccessError(403, 'Solo un administrador puede gestionar cuentas.')
      if (route === 'context') {
        const context = await rpc(request, 'context')
        return { ...context, canCreateAccounts: profile.rol === 'administrador' && Boolean(serviceKey) }
      }
      if (route === 'accounts.create') return createAccount(request, data)
      if (route === 'accounts.update') return rpc(request, route, accountInput(data))
      if (route === 'periods.save') return rpc(request, route, periodInput(data))
      if (route === 'periods.activate') {
        if (typeof data.active !== 'boolean') throw new AccessError(400, 'Estado del período no válido.')
        return rpc(request, route, { id: positiveId(data.id), active: data.active })
      }
      if (['accounts.list', 'periods.list'].includes(route)) return rpc(request, route)
      throw new AccessError(404, 'Operación no encontrada.')
    },
  }
}
