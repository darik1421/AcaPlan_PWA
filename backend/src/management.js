import { AccessError } from './auth.js'
import { restrictionInput } from './restriction-input.js'
import { gridInput } from './grid-input.js'
import { programacionReport } from './programacion-report.js'
import { importTemplate } from './import-workbook.js'
import { accountInput, carreraInput, asignaturaInput, aulaInput, seccionInput, periodInput, positiveId } from './validation.js'

const businessErrors = {
  TURNO_CON_CLASES: [409, 'No puedes cambiar los tiempos ni el turno de esta configuración porque hay grupos con clases registradas. Puedes corregir su nombre. Revisa esas clases antes de cambiar su configuración.'],
  SEMESTRE_INCOMPATIBLE: [400, 'El grupo y la configuración de bloques deben pertenecer al mismo semestre.'],
  NOCTURNO_SIN_RECESO: [400, 'El turno nocturno no admite recesos.'],
  DURACION_CUADRICULA: [400, 'Usa bloques de 45 minutos en matutino y vespertino, o de 60 en nocturno y encuentros.'],
  BLOQUE_NO_LECTIVO: [409, 'La base de datos rechazó el bloque con una validación del modelo anterior. Esta operación requiere adaptar las reglas compartidas antes de continuar.'],
  SESIONES_INCOMPLETAS: [409, 'La publicación requiere cubrir todas las sesiones con bloques consecutivos y duración correcta.'],
  CAPACIDAD_INSUFICIENTE: [409, 'El aula no tiene capacidad suficiente para la sección.'],
  PROGRAMACION_INCOMPLETA: [409, 'Completa la programación, sus recursos y el docente antes de asignar clases.'],
  LABORATORIO_REQUERIDO: [409, 'Esta necesidad requiere un laboratorio.'],
  RECURSO_REQUERIDO: [409, 'El aula no dispone de todos los recursos obligatorios.'],
  REGLAS_SIN_CONFIGURAR: [409, 'Guarda las reglas del semestre antes de publicar.'],
  VERSION_CAMBIO: [409, 'Otro usuario modificó este registro. Recarga los datos antes de guardar.'],
  CONFIRMACION_REQUERIDA: [409, 'Confirma las sustituciones mostradas en la vista previa antes de guardar.'],
  CARGA_INCOMPATIBLE: [400, 'La base de datos conserva una equivalencia de carga del modelo anterior. No cambies las horas del catálogo para forzar esa equivalencia; la programación requiere adaptación.'],
  PROGRAMACION_EXISTENTE: [409, 'Esta asignatura ya tiene programación en la sección. Utiliza Editar para modificarla.'],
  ULTIMO_ADMIN: [409, 'No puedes desactivar ni cambiar el rol del último administrador activo.'],
  NO_ENCONTRADO: [404, 'El registro ya no existe. Actualiza la lista.'],
  PERMISO_DENEGADO: [403, 'Tu cuenta no tiene permiso para esta operación.'],
  DUPLICADO: [409, 'El correo o la cédula ya están registrados.'],
  DATOS_INVALIDOS: [400, 'Revisa los campos, funciones y carreras seleccionadas.'],
  AUTH_NO_EXISTE: [409, 'No se encontró la cuenta de autenticación correspondiente.'],
  INTERVALO_OCUPADO: [409, 'El intervalo se superpone con otro del mismo día y semestre.'],
  REGISTRO_EN_USO: [409, 'El registro está en uso. Revisa las asignaciones antes de modificarlo.'],
  ASIGNATURA_INACTIVA: [409, 'La asignatura está inactiva y no admite nuevas asignaciones.'],
  ESPACIO_INACTIVO: [409, 'El espacio está inactivo y no admite nuevas clases.'],
  BLOQUE_RECESO: [409, 'Un receso no admite clases.'],
  DISPONIBILIDAD_INSUFICIENTE: [409, 'La base de datos aplicó la disponibilidad del modelo anterior. Falta adaptar esa validación a restricciones comunicadas; no registres disponibilidad ficticia para continuar.'],
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
      if (body?.code === '23505') throw new AccessError(409, 'Ya existe un registro con esos datos o un semestre activo. Actualiza la lista.')
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

  async function rpc2(request, action, payload = {}, functionName = 'pwa_sprint2') {
    if (!url || !key) throw new AccessError(503, 'Falta configurar Supabase en el backend.')
    let response
    try {
      response = await fetchImpl(`${url}/rest/v1/rpc/${functionName}`, {
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
      if (body?.code === 'PGRST202' || response.status === 404) throw new AccessError(503, ['pwa_sprint2', 'pwa_cuadriculas_api', 'pwa_grupos_turnos_api'].includes(functionName) ? 'Falta aplicar la preparación SQL del Sprint 2 en Supabase.' : 'Falta aplicar la preparación SQL correspondiente del Sprint 3 en Supabase.')
      if (['ASIGNACIONES_AFECTADAS', 'TURNO_CON_CLASES'].includes(body?.message)) {
        let ids = []
        try { const values = JSON.parse(body.details); if (Array.isArray(values)) ids = values.filter(value => Number.isSafeInteger(value) && value > 0) } catch { /* No mostrar detalles internos que no sean identificadores. */ }
        const classes = ids.length ? ` Clases afectadas (ID): ${ids.slice(0, 20).join(', ')}${ids.length > 20 ? '…' : ''}.` : ''
        const explanation = body.message === 'TURNO_CON_CLASES' ? businessErrors.TURNO_CON_CLASES[1] : 'Revisa y resuelve las asignaciones existentes antes de guardar este cambio.'
        throw new AccessError(409, `${explanation}${classes}`)
      }
      const mapped = businessErrors[body?.message]
      if (mapped) throw new AccessError(...mapped)
      if (body?.code === '23505') throw new AccessError(409, 'Ya existe un registro con esos datos.')
      if (body?.code === '23P01') throw new AccessError(409, 'Existe un traslape de docente, aula o sección. Revisa el diagnóstico institucional.')
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
      if (route === 'restrictions.list') return rpc2(request, 'list', {}, 'pwa_restricciones_api')
      if (route === 'restrictions.save') return rpc2(request, 'save', restrictionInput(data), 'pwa_restricciones_api')
      if (route === 'grids.list') return rpc2(request, 'list', {}, 'pwa_cuadriculas_api')
      if (route === 'grids.save') return rpc2(request, 'save', gridInput(data), 'pwa_cuadriculas_api')
      if (route === 'groupGrids.list') return rpc2(request, 'list', {}, 'pwa_grupos_turnos_api')
      if (route === 'groupGrids.save') {
        if (!Number.isSafeInteger(data.version) || data.version < 0) throw new AccessError(400, 'Recarga la asignación antes de guardar.')
        return rpc2(request, 'save', {id_seccion:positiveId(data.id_seccion),id_cuadricula:positiveId(data.id_cuadricula),version:data.version}, 'pwa_grupos_turnos_api')
      }
      if (['import.history', 'import.template'].includes(route)) {
        const context = await rpc(request, 'context')
        if (profile.rol !== 'administrador' && !context.funciones?.includes('coordinador')) throw new AccessError(403, 'Solo administración o coordinación pueden importar programación.')
        if (route === 'import.history') return rpc2(request, 'history', {}, 'pwa_importacion')
        if (route === 'import.template') {
          const [periodos, carreras, secciones, asignaturas, docentes, recursos] = await Promise.all([rpc(request, 'periods.list'), ...['carreras', 'secciones', 'asignaturas', 'docentes', 'recursos'].map(name => rpc2(request, `${name}.list`))])
          const allowed = id => profile.rol === 'administrador' || context.carreras?.includes(id)
          const buffer = await importTemplate({ periodos, carreras: carreras.filter(c => allowed(c.id_carrera)), secciones: secciones.filter(s => allowed(s.id_carrera)), asignaturas: asignaturas.filter(a => allowed(a.id_carrera)), docentes, recursos })
          return { archivo: 'AcaPlan_programacion.xlsx', base64: buffer.toString('base64') }
        }
      }
      if (route.startsWith('accounts.') && profile.rol !== 'administrador') throw new AccessError(403, 'Solo un administrador puede gestionar cuentas.')
      if (route === 'context') {
        const context = await rpc(request, 'context')
        const isAdmin = profile.rol === 'administrador'
        const canManageCarreras = isAdmin || Boolean(context.funciones?.includes('planificador'))
        const canManageAsignaturas = isAdmin || Boolean(context.funciones?.includes('coordinador'))
        const canManageEspacios = canManageCarreras
        const canManageBloques = canManageEspacios
        const canManageSecciones = canManageAsignaturas
        const canManageDisponibilidad = isAdmin || Boolean(context.funciones?.includes('jefe_departamento'))
        return { ...context, isAdmin, canCreateAccounts: isAdmin && Boolean(serviceKey), canManageCarreras, canManageAsignaturas, canManageEspacios, canManageSecciones, canManageBloques, canManageDisponibilidad }
      }
      if (route === 'accounts.create') return createAccount(request, data)
      if (route === 'accounts.update') return rpc(request, route, accountInput(data))
      if (route === 'periods.save') return rpc(request, route, periodInput(data))
      if (route === 'periods.activate') {
        if (typeof data.active !== 'boolean') throw new AccessError(400, 'Estado del semestre no válido.')
        return rpc(request, route, { id: positiveId(data.id), active: data.active })
      }
      if (['accounts.list', 'periods.list'].includes(route)) return rpc(request, route)
      if (route === 'programacion.report') {
        const [periodos, carreras, secciones, asignaturas, docentes, programacion, recursos, cuadriculas, gruposTurnos] = await Promise.all([
          rpc(request, 'periods.list'),
          ...['carreras', 'secciones', 'asignaturas', 'docentes'].map(name => rpc2(request, `${name}.list`)),
          rpc2(request, 'list', {}, 'pwa_programacion'),
          rpc2(request, 'recursos.list'),
          rpc2(request, 'list', {}, 'pwa_cuadriculas_api'),
          rpc2(request, 'list', {}, 'pwa_grupos_turnos_api'),
        ])
        return programacionReport({ periodos, carreras, secciones, asignaturas, docentes, programacion, recursos, cuadriculas, gruposTurnos })
      }
      if (route === 'programacion.detalle.list') return rpc2(request, 'list', {}, 'pwa_programacion')
      // ── Sprint 2: Carreras ──
      if (route === 'carreras.list') return rpc2(request, route)
      if (route === 'carreras.create') return rpc2(request, route, carreraInput(data, true))
      if (route === 'carreras.update') return rpc2(request, route, carreraInput(data))
      // ── Sprint 2: Asignaturas ──
      if (route === 'asignaturas.list') return rpc2(request, route)

      if (route === 'asignaturas.update') return rpc2(request, route, asignaturaInput(data))
      // ── Sprint 2: H08 Aulas y Recursos ──
      if (['pabellones.list', 'recursos.list', 'aulas.list'].includes(route)) return rpc2(request, route)
      if (route === 'aulas.update') return rpc2(request, route, aulaInput(data))
      // ── Sprint 2: H09 Secciones ──
      if (route === 'secciones.list') return rpc2(request, route)
      if (route === 'secciones.update') return rpc2(request, route, seccionInput(data))
      // ── Sprint 2: H10 Bloques ──
      if (route === 'bloques.list') return rpc2(request, route)
      // ── Sprint 2: H11 Disponibilidad ──
      if (['docentes.list', 'disponibilidad.list'].includes(route)) return rpc2(request, route)
      // ── Sprint 2: H12 Programacion ──
      if (route === 'programacion.list') return rpc2(request, route)

      throw new AccessError(404, 'Operación no encontrada.')
    },
  }
}
