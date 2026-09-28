import { AccessError } from './auth.js'
import { accountInput, carreraInput, asignaturaInput, aulaInput, pabellonInput, recursoInput, seccionInput, bloqueInput, disponibilidadInput, programacionInput, periodInput, positiveId } from './validation.js'

const businessErrors = {
  ULTIMO_ADMIN: [409, 'No puedes desactivar ni cambiar el rol del último administrador activo.'],
  NO_ENCONTRADO: [404, 'El registro ya no existe. Actualiza la lista.'],
  PERMISO_DENEGADO: [403, 'Tu cuenta no tiene permiso para esta operación.'],
  DUPLICADO: [409, 'El correo o la cédula ya están registrados.'],
  DATOS_INVALIDOS: [400, 'Revisa los campos, funciones y carreras seleccionadas.'],
  AUTH_NO_EXISTE: [409, 'No se encontró la cuenta de autenticación correspondiente.'],
  INTERVALO_OCUPADO: [409, 'El intervalo se superpone con otro del mismo día y período.'],
  REGISTRO_EN_USO: [409, 'El registro está en uso. Revisa las asignaciones antes de modificarlo.'],
  ASIGNATURA_INACTIVA: [409, 'La asignatura está inactiva y no admite nuevas asignaciones.'],
  ESPACIO_INACTIVO: [409, 'El espacio está inactivo y no admite nuevas clases.'],
  BLOQUE_RECESO: [409, 'Un receso no admite clases.'],
  DISPONIBILIDAD_INSUFICIENTE: [409, 'Completa la disponibilidad del docente para cubrir toda la clase.'],
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

  async function rpc2(request, action, payload = {}) {
    if (!url || !key) throw new AccessError(503, 'Falta configurar Supabase en el backend.')
    let response
    try {
      response = await fetchImpl(`${url}/rest/v1/rpc/pwa_sprint2`, {
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
      if (body?.code === 'PGRST202' || response.status === 404) throw new AccessError(503, 'Falta aplicar la preparación SQL del Sprint 2 en Supabase.')
      if (body?.message === 'ASIGNACIONES_AFECTADAS') {
        let ids = []
        try { const values = JSON.parse(body.details); if (Array.isArray(values)) ids = values.filter(Number.isSafeInteger) } catch { /* No mostrar detalles internos que no sean identificadores. */ }
        const classes = ids.length ? ` Clases afectadas (ID): ${ids.slice(0, 20).join(', ')}${ids.length > 20 ? '…' : ''}.` : ''
        throw new AccessError(409, `Revisa y resuelve las asignaciones existentes antes de guardar este cambio.${classes}`)
      }
      const mapped = businessErrors[body?.message]
      if (mapped) throw new AccessError(...mapped)
      if (body?.code === '23505') throw new AccessError(409, 'Ya existe un registro con esos datos.')
      if (body?.code === '23503') throw new AccessError(409, 'La relación seleccionada no existe o el registro está en uso. Actualiza la lista.')
      if (body?.code === '42501') throw new AccessError(403, 'No tienes permiso para esta operación.')
      if (body?.code?.startsWith('22') || ['23514', '23502'].includes(body?.code)) throw new AccessError(400, 'Revisa los datos del formulario.')
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
        const isAdmin = profile.rol === 'administrador'
        const canManageCarreras = isAdmin || Boolean(context.funciones?.includes('planificador'))
        const canManageAsignaturas = isAdmin || Boolean(context.funciones?.includes('coordinador'))
        const canManageEspacios = canManageCarreras
        const canManageBloques = canManageEspacios
        const canManageSecciones = canManageAsignaturas
        const canManageDisponibilidad = canManageSecciones
        return { ...context, isAdmin, canCreateAccounts: isAdmin && Boolean(serviceKey), canManageCarreras, canManageAsignaturas, canManageEspacios, canManageSecciones, canManageBloques, canManageDisponibilidad }
      }
      if (route === 'accounts.create') return createAccount(request, data)
      if (route === 'accounts.update') return rpc(request, route, accountInput(data))
      if (route === 'periods.save') return rpc(request, route, periodInput(data))
      if (route === 'periods.activate') {
        if (typeof data.active !== 'boolean') throw new AccessError(400, 'Estado del período no válido.')
        return rpc(request, route, { id: positiveId(data.id), active: data.active })
      }
      if (['accounts.list', 'periods.list'].includes(route)) return rpc(request, route)
      // ── Sprint 2: Carreras ──
      if (route === 'carreras.list') return rpc2(request, route)
      if (route === 'carreras.create') return rpc2(request, route, carreraInput(data, true))
      if (route === 'carreras.update') return rpc2(request, route, carreraInput(data))
      // ── Sprint 2: Asignaturas ──
      if (route === 'asignaturas.list') return rpc2(request, route)
      if (route === 'asignaturas.create') return rpc2(request, route, asignaturaInput(data, true))
      if (route === 'asignaturas.update') return rpc2(request, route, asignaturaInput(data))
      // ── Sprint 2: H08 Aulas y Recursos ──
      if (['pabellones.list', 'recursos.list', 'aulas.list'].includes(route)) return rpc2(request, route)
      if (route === 'pabellones.create') return rpc2(request, route, pabellonInput(data))
      if (route === 'recursos.create') return rpc2(request, route, recursoInput(data))
      if (route === 'aulas.create') return rpc2(request, route, aulaInput(data, true))
      if (route === 'aulas.update') return rpc2(request, route, aulaInput(data))
      // ── Sprint 2: H09 Secciones ──
      if (route === 'secciones.list') return rpc2(request, route)
      if (route === 'secciones.create') return rpc2(request, route, seccionInput(data, true))
      if (route === 'secciones.update') return rpc2(request, route, seccionInput(data))
      // ── Sprint 2: H10 Bloques ──
      if (route === 'bloques.list') return rpc2(request, route)
      if (route === 'bloques.create') return rpc2(request, route, bloqueInput(data, true))
      if (route === 'bloques.update') return rpc2(request, route, bloqueInput(data))
      // ── Sprint 2: H11 Disponibilidad ──
      if (['docentes.list', 'disponibilidad.list'].includes(route)) return rpc2(request, route)
      if (route === 'disponibilidad.create') return rpc2(request, route, disponibilidadInput(data, true))
      if (route === 'disponibilidad.update') return rpc2(request, route, disponibilidadInput(data))
      // ── Sprint 2: H12 Programacion ──
      if (route === 'programacion.list') return rpc2(request, route)
      if (route === 'programacion.create') return rpc2(request, route, programacionInput(data))
      if (route === 'programacion.delete') return rpc2(request, route, { id: positiveId(data.id) })

      throw new AccessError(404, 'Operación no encontrada.')
    },
  }
}
