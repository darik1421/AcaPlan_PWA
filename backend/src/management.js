import {transitionDraft,PREPARATION_RULE_VERSION} from './draft-lifecycle.js'
import {hasGlobalAccess} from './roles.js'
import {assignmentCorrection} from './assignment-correction.js'
import {assignmentNeeds} from './assignment-needs.js'
import {yearTurn} from './year-turn.js'
import {consecutiveInput} from './consecutive-input.js'
import {collectPreparation,preparationReview} from './preparation-review.js'
import {travelSitesInput} from './travel-sites-input.js'
import {draftInput} from './draft-input.js'
import {draftVersionInput} from './draft-version.js'
import {componentsInput,draftWorkInput} from './academic-workflow-input.js'
import {reviewDraft} from './draft-review.js'
import {preparationVersion} from './preparation-version.js'
import {proposeGeneration,saveGeneration} from './generation-service.js'
import {assignmentTemplate,readAssignments,validateAssignmentDepartments} from './assignment-workbook.js'
import {preparationTemplate,previewPreparation} from './preparation-workbook.js'
import { AccessError } from './auth.js'
import { restrictionInput, unifiedRestrictionInput } from './restriction-input.js'
import { gridInput } from './grid-input.js'
import { programacionReport } from './programacion-report.js'
import { importTemplate } from './import-workbook.js'
import { accountInput, carreraInput, asignaturaInput, aulaInput, pabellonInput, departamentoInput, periodInput, positiveId } from './validation.js'

const businessErrors = {
 CARRERA_INACTIVA:[409,'Solo puedes asignar carreras activas al coordinador.'],
 DEPARTAMENTO_REQUERIDO:[400,'Selecciona el departamento antes de guardar.'],
 DEPARTAMENTOS_MEZCLADOS:[409,'Un borrador solo puede incluir carreras de un mismo departamento.'],
 CARRERA_SIN_DEPARTAMENTO:[409,'Relaciona las carreras con su departamento antes de crear el borrador.'],
 DEPARTAMENTO_EN_USO:[409,'La carrera pertenece a un borrador de un semestre activo. Revisa ese borrador antes de cambiar su departamento.'],
 DEPARTAMENTO_SIN_ASIGNAR:[403,'Tu cuenta todavía no tiene un departamento asignado. Contacta a administración.'],
 DEPARTAMENTO_BORRADOR_PENDIENTE:[409,'Este borrador anterior no tiene departamento. Prepara un borrador separado por departamento antes de aprobar o publicar.'],
 CRUCE_DEPARTAMENTO:[409,'Hay una ocupación incompatible con otro departamento o un horario anterior pendiente de conciliar. Revisa el borrador.'],
 IDENTIDAD_DOCENTE_VINCULADA:[409,'La cuenta ya está vinculada a un registro docente con esa cédula. La corrección de identidad debe revisarse junto con el registro académico.'],
 TRANSICION_INVALIDA:[409,'El estado cambió. Consulta nuevamente el borrador.'],
 BORRADOR_INCOMPLETO:[409,'El borrador tiene conflictos o datos pendientes.'],
 HORARIOS_HISTORICOS_PENDIENTES:[409,'Este semestre conserva horarios del modelo anterior. Deben conciliarse antes de publicar.'],
 PUBLICACION_PARCIAL:[409,'La propuesta debe incluir las carreras de la publicación anterior para no omitir sus horarios.'],
 AUTORIZACION_REQUERIDA:[409,'Esta clase está fijada. Autoriza expresamente el cambio e indica su motivo.'],
 COMPONENTES_DESACTUALIZADOS:[409,'La asignación cambió. El coordinador debe revisar la distribución de teoría y práctica.'],
  RESTRICCION_SEMESTRE_INACTIVO: [409, 'Solo se pueden cambiar restricciones del semestre activo. Actualiza la página.'],
  REGLA_CONSECUTIVA_EXISTENTE: [409, 'Esta pareja ya tiene una regla. Corrige o reactiva la regla existente.'],
  ANO_CON_HORARIOS: [409, 'Este año ya tiene clases registradas. Revisa su horario antes de cambiar el turno; no se movió ninguna asignatura.'],
  INVENTARIO_AMBIGUO: [409, 'Hay códigos de espacio o nombres de catálogo ambiguos. El mismo pabellón y código no puede representar dos sedes; revisa el inventario antes de guardarlo.'],
  ASIGNACION_SEMESTRE_INACTIVO: [409, 'Solo puedes corregir asignaciones del semestre activo. Actualiza los datos.'],
  DOCENTE_FUERA_ASIGNACION: [400, 'Selecciona docentes activos ya recibidos para esta carrera. Un docente nuevo debe incorporarse mediante el Excel.'],
  IDENTIDAD_VINCULADA: [409, 'Este docente ya tiene un registro vinculado. Recarga la lista y selecciona su registro existente.'],
  IDENTIDAD_AMBIGUA: [409, 'La cédula coincide con varios registros anteriores. Administración debe resolver la identidad antes de importar.'],
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
      if(functionName==='pwa_nueva_version_borrador'&&body?.code==='PGRST202')throw new AccessError(503,'La creación de nuevas versiones todavía no está habilitada en esta base de datos.')
      if(functionName==='pwa_generador'&&body?.code==='PGRST202')throw new AccessError(503,'La conexión del generador requiere aplicar generador-flujo-actual.sql en Supabase.')
      if(functionName==='pwa_departamentos_api'&&body?.code==='PGRST202')throw new AccessError(503,'La organización por departamentos está pendiente de aplicar departamentos-base.sql en Supabase.')
      if(functionName==='pwa_necesidades_academicas'&&body?.code==='PGRST202')throw new AccessError(503,'Las necesidades de aula y equipamiento requieren aplicar su migración en Supabase.')
      if (['pwa_inventario','pwa_preparacion_academica'].includes(functionName) && body?.code==='PGRST202') throw new AccessError(503,'Esta función necesita aplicar la migración de cierre funcional del Sprint 2 en Supabase.');
      if (functionName==='pwa_corregir_asignacion' && body?.code==='PGRST202') throw new AccessError(503,'Las correcciones todavía no están habilitadas en esta base de datos. Falta aplicar su migración.');
      if (functionName==='pwa_restricciones_unificadas' && body?.code==='PGRST202') { const e=new AccessError(503,'Falta aplicar la conexión de docentes importados con restricciones.');e.migrationMissing=true;throw e }
      if (body?.code === 'PGRST202' || response.status === 404) throw new AccessError(503, ['pwa_sprint2', 'pwa_cuadriculas_api', 'pwa_grupos_turnos_api'].includes(functionName) ? 'Falta aplicar la preparación SQL del Sprint 2 en Supabase.' : functionName==='pwa_importar_asignacion'?'Falta aplicar la migración de importación académica en Supabase.':'Falta aplicar la preparación SQL correspondiente del Sprint 3 en Supabase.')
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

  async function confirmCycle(action,payload,functionName='pwa_ciclo_confirmar'){
    if(!serviceKey)throw new AccessError(503,'Falta la clave privada del backend para confirmar el estado.')
    let response
    try{response=await fetchImpl(`${url}/rest/v1/rpc/${functionName}`,{method:'POST',headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'},body:JSON.stringify({action,payload}),signal:AbortSignal.timeout(15000)})}catch{throw new AccessError(503,'No se pudo confirmar el resultado. Consulta el estado antes de reintentar.')}
    const body=await response.json().catch(()=>null)
    if(!response.ok){const mapped=businessErrors[body?.message];if(mapped)throw new AccessError(...mapped);throw new AccessError(503,'No se pudo confirmar el estado. Revisa la migración y consulta nuevamente.')}
    if(!body?.guardado)throw new AccessError(503,'Respuesta incompleta. Consulta el estado antes de reintentar.')
    return body
  }
  async function createAccount(request, data) {
    const input = accountInput(data, true)
    // Comprueba permisos, esquema y duplicados antes de crear en Auth.
    await rpc(request, 'accounts.check', { correo: input.correo, cedula: input.cedula, rol: input.rol, funciones: input.funciones, carreras: input.carreras, ...(input.id_departamento ? { id_departamento: input.id_departamento, revision_departamento: input.revision_departamento } : {}) })
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
      if(route==='drafts.version')return rpc2(request,'create',{...draftVersionInput(data),version_reglas:PREPARATION_RULE_VERSION},'pwa_nueva_version_borrador')
      if(route==='generation.propose'||route==='generation.save'){
        const load=id=>rpc2(request,'context',{id,version_reglas:PREPARATION_RULE_VERSION},'pwa_generador')
        if(route==='generation.propose')return proposeGeneration({data,load})
        return saveGeneration({data,actor:profile.id_usuario,load,confirm:payload=>confirmCycle('save',payload,'pwa_generador_confirmar')})
      }
      if (route.startsWith('departments.')) {
        if (!hasGlobalAccess(profile)) throw new AccessError(403, 'Solo administración puede organizar los departamentos en esta etapa.')
        if (route === 'departments.directors') return rpc2(request,'context',{},'pwa_vincular_director')
        if (route === 'departments.docentes') {
          if (!hasGlobalAccess(profile)) throw new AccessError(403, 'Solo administración puede consultar docentes para asignación de directores.')
          if (!serviceKey) throw new AccessError(503, 'Falta la clave de servicio en el backend.')

          const adminHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
          const [usersRes, dirsRes, deptsRes] = await Promise.all([
            fetchImpl(`${url}/rest/v1/usuarios?select=id_usuario,nombre,cedula,rol,estado&rol=in.(docente,director)&estado=eq.activo&order=nombre.asc`, { headers: adminHeaders }),
            fetchImpl(`${url}/rest/v1/pwa_directores_departamento?select=id_usuario,id_departamento,revision`, { headers: adminHeaders }),
            fetchImpl(`${url}/rest/v1/pwa_departamentos?select=id,nombre`, { headers: adminHeaders }),
          ])

          const users = await usersRes.json().catch(() => [])
          const dirs = await dirsRes.json().catch(() => [])
          const depts = await deptsRes.json().catch(() => [])

          const deptMap = new Map((Array.isArray(depts) ? depts : []).map(d => [d.id, d.nombre]))
          const dirMap = new Map((Array.isArray(dirs) ? dirs : []).map(d => [d.id_usuario, d.id_departamento]))

          const docentes = (Array.isArray(users) ? users : []).map(u => ({
            id_usuario: u.id_usuario,
            nombre: u.nombre,
            cedula: u.cedula || 'Sin cédula',
            id_departamento: dirMap.get(u.id_usuario) || null,
            departamento_nombre: dirMap.get(u.id_usuario) ? deptMap.get(dirMap.get(u.id_usuario)) : null,
          }))

          return { docentes }
        }
        if (route === 'departments.directorSave') {
          const idUsuario = positiveId(data.id_usuario)
          const isUnlinking = data.id_departamento === null || data.id_departamento === undefined || data.id_departamento === ''
          const idDept = isUnlinking ? null : positiveId(data.id_departamento)

          if (serviceKey) {
            const adminHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }

            if (idDept !== null) {
              // 1. Asegurar permiso 'jefe_departamento' en pwa_permisos_usuario
              try {
                const permRes = await fetchImpl(`${url}/rest/v1/pwa_permisos_usuario?id_usuario=eq.${encodeURIComponent(idUsuario)}`, { headers: adminHeaders })
                const permRows = await permRes.json().catch(() => [])
                const currentFunciones = permRows?.[0]?.funciones || []
                if (!currentFunciones.includes('jefe_departamento')) {
                  const nextFunciones = [...currentFunciones, 'jefe_departamento']
                  await fetchImpl(`${url}/rest/v1/pwa_permisos_usuario`, {
                    method: 'POST',
                    headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates' },
                    body: JSON.stringify({
                      id_usuario: idUsuario,
                      funciones: nextFunciones,
                      carreras: permRows?.[0]?.carreras || [],
                    }),
                  })
                }
              } catch {}

              // 2. Desvincular cualquier director anterior de este departamento
              try {
                const prevRes = await fetchImpl(`${url}/rest/v1/pwa_directores_departamento?id_departamento=eq.${encodeURIComponent(idDept)}`, { headers: adminHeaders })
                const prevRows = await prevRes.json().catch(() => [])
                for (const prev of prevRows) {
                  if (prev.id_usuario !== idUsuario) {
                    await fetchImpl(`${url}/rest/v1/pwa_directores_departamento?id_usuario=eq.${encodeURIComponent(prev.id_usuario)}`, {
                      method: 'PATCH',
                      headers: adminHeaders,
                      body: JSON.stringify({ id_departamento: null, revision: (prev.revision || 0) + 1 }),
                    })
                  }
                }
              } catch {}

              // 3. Vincular nuevo director en pwa_directores_departamento
              try {
                const curRes = await fetchImpl(`${url}/rest/v1/pwa_directores_departamento?id_usuario=eq.${encodeURIComponent(idUsuario)}`, { headers: adminHeaders })
                const curRows = await curRes.json().catch(() => [])
                if (curRows && curRows.length > 0) {
                  await fetchImpl(`${url}/rest/v1/pwa_directores_departamento?id_usuario=eq.${encodeURIComponent(idUsuario)}`, {
                    method: 'PATCH',
                    headers: adminHeaders,
                    body: JSON.stringify({ id_departamento: idDept, revision: (curRows[0].revision || 0) + 1 }),
                  })
                } else {
                  await fetchImpl(`${url}/rest/v1/pwa_directores_departamento`, {
                    method: 'POST',
                    headers: adminHeaders,
                    body: JSON.stringify({ id_usuario: idUsuario, id_departamento: idDept, revision: 1 }),
                  })
                }
              } catch {
                throw new AccessError(503, 'No se pudo vincular el director al departamento.')
              }
            } else {
              // Desvincular usuario de cualquier departamento
              try {
                const curRes = await fetchImpl(`${url}/rest/v1/pwa_directores_departamento?id_usuario=eq.${encodeURIComponent(idUsuario)}`, { headers: adminHeaders })
                const curRows = await curRes.json().catch(() => [])
                if (curRows && curRows.length > 0) {
                  await fetchImpl(`${url}/rest/v1/pwa_directores_departamento?id_usuario=eq.${encodeURIComponent(idUsuario)}`, {
                    method: 'PATCH',
                    headers: adminHeaders,
                    body: JSON.stringify({ id_departamento: null, revision: (curRows[0].revision || 0) + 1 }),
                  })
                }
              } catch {
                throw new AccessError(503, 'No se pudo desvincular el director.')
              }
            }
            return { guardado: true }
          }

          if (!(idDept===null || (Number.isInteger(idDept)&&idDept>=1))||!Number.isSafeInteger(data.revision)||data.revision<0||data.revision>999999999) throw new AccessError(400,'Selecciona el departamento y consulta la versión actual del director.')
          return rpc2(request,'save',{id_usuario:idUsuario,id_departamento:idDept,revision:data.revision},'pwa_vincular_director')
        }
        if (route === 'departments.context') return rpc2(request,'context',{},'pwa_departamentos_api')
        if (route === 'departments.update') {
          const input = departamentoInput(data)
          const adminHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
          let response
          try {
            response = await fetchImpl(`${url}/rest/v1/pwa_departamentos?id=eq.${encodeURIComponent(input.id)}`, {
              method: 'PATCH',
              headers: adminHeaders,
              body: JSON.stringify({ nombre: input.nombre }),
              signal: AbortSignal.timeout(15000),
            })
          } catch {
            const error = new AccessError(503, 'No se pudo confirmar la operación con la base de datos.')
            error.uncertain = true
            throw error
          }
          const body = await response.json().catch(() => null)
          if (!response.ok) {
            if (body?.code === '23505') throw new AccessError(409, 'Ya existe un departamento con ese nombre.')
            throw new AccessError(response.status || 500, body?.message || 'No se pudo actualizar el departamento.')
          }
          return { ok: true, departamento: body?.[0] }
        }
        if (route === 'departments.delete') {
          const id = positiveId(data.id ?? data.id_departamento)
          const adminHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
          let response
          try {
            response = await fetchImpl(`${url}/rest/v1/pwa_departamentos?id=eq.${encodeURIComponent(id)}`, {
              method: 'DELETE',
              headers: adminHeaders,
              signal: AbortSignal.timeout(15000),
            })
          } catch {
            const error = new AccessError(503, 'No se pudo confirmar la operación con la base de datos.')
            error.uncertain = true
            throw error
          }
          if (!response.ok) {
            const body = await response.json().catch(() => null)
            if (body?.code === '23503') throw new AccessError(409, 'No se puede eliminar el departamento porque tiene carreras o datos vinculados. Reasigna o elimina las carreras primero.')
            throw new AccessError(response.status || 500, body?.message || 'No se pudo eliminar el departamento.')
          }
          return { ok: true }
        }
        if (route === 'departments.create') {
          const input = departamentoInput(data, true)
          const adminHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
          let response
          try {
            let nextId = data.id
            if (!nextId) {
              const existing = await fetchImpl(`${url}/rest/v1/pwa_departamentos?select=id&order=id.desc&limit=1`, { headers: adminHeaders })
              const existingRows = await existing.json().catch(() => [])
              nextId = (existingRows?.[0]?.id || 0) + 1
            }
            response = await fetchImpl(`${url}/rest/v1/pwa_departamentos`, {
              method: 'POST',
              headers: adminHeaders,
              body: JSON.stringify({ id: nextId, nombre: input.nombre }),
              signal: AbortSignal.timeout(15000),
            })
          } catch {
            const error = new AccessError(503, 'No se pudo confirmar la operación con la base de datos.')
            error.uncertain = true
            throw error
          }
          const body = await response.json().catch(() => null)
          if (!response.ok) {
            if (body?.code === '23505') throw new AccessError(409, 'Ya existe un departamento con ese nombre o identificador.')
            throw new AccessError(response.status || 500, body?.message || 'No se pudo registrar el departamento.')
          }
          return { ok: true, departamento: body?.[0] }
        }
        if (route !== 'departments.assign' || !Number.isInteger(data.id_departamento) || data.id_departamento < 1 || data.id_departamento > 3 || !Number.isSafeInteger(data.revision) || data.revision < 0 || data.revision > 999999999) throw new AccessError(400,'Selecciona una carrera y un departamento, y consulta su versión actual.')
        return rpc2(request,'assign',{id_carrera:positiveId(data.id_carrera),id_departamento:data.id_departamento,revision:data.revision},'pwa_departamentos_api')
      }
      if(route==='departmentAcademic.list') return rpc2(request,'list',{},'pwa_resumen_departamento')
      if(route==='lifecycle.context')return rpc2(request,'context',{id:positiveId(data.id),version_reglas:PREPARATION_RULE_VERSION},'pwa_ciclo_contexto')
      if(route==='lifecycle.transition')return transitionDraft({input:data,actor:profile.id_usuario,call:(fn,action,payload)=>rpc2(request,action,payload,fn),confirm:confirmCycle})
      if(route==='publications.list')return rpc2(request,'list',{version_reglas:PREPARATION_RULE_VERSION},'pwa_publicaciones')
      if(route==='publications.personal')return rpc2(request,'list',{version_reglas:PREPARATION_RULE_VERSION},'pwa_horario_personal')
      if(route.startsWith('components.'))return rpc2(request,route==='components.save'?'save':'context',componentsInput(data,route==='components.save'),'pwa_componentes_api')
      if(route.startsWith('draftWork.')){
        const action=route.split('.')[1],input=draftWorkInput(data,action)
        if(action!=='review')return rpc2(request,action,input,'pwa_borrador_trabajo')
        const snapshot=await rpc2(request,'context',input,'pwa_borrador_trabajo')
        if(snapshot.borrador?.revision!==input.revision)throw new AccessError(409,'La propuesta cambió desde que abriste la pantalla. Consulta nuevamente antes de revisar.')
          const result=reviewDraft(snapshot)
        const current=await rpc2(request,'context',input,'pwa_borrador_trabajo')
        if(preparationVersion(current).huella_datos!==result.huella_datos)throw new AccessError(409,'El borrador o sus datos cambiaron durante la revisión. Vuelve a revisar.')
        return result
      }
      if(route==='drafts.context'||route==='drafts.create')return rpc2(request,route==='drafts.create'?'create':'context',draftInput(data,route==='drafts.create'),'pwa_borradores')
      if(route==='preparation.review')return preparationReview(await collectPreparation((fn,action,payload={})=>rpc2(request,action,payload,fn),data.id_periodo))
      if(route==='travel.context'||route==='travel.save')return rpc2(request,route==='travel.save'?'save':'context',travelSitesInput(data,route==='travel.save'),'pwa_sedes_traslado_api')
      if(route==='consecutive.context'||route==='consecutive.save')return rpc2(request,route==='consecutive.save'?'save':'context',consecutiveInput(data,route==='consecutive.save'),'pwa_clases_consecutivas')
      if(route==='academicTurn.context'||route==='academicTurn.save')return rpc2(request,route==='academicTurn.save'?'save':'context',yearTurn(data,route==='academicTurn.save'),'pwa_turno_academico')
      if(route==='academicNeeds.context'||route==='academicNeeds.save')return rpc2(request,route==='academicNeeds.save'?'save':'context',assignmentNeeds(data,route==='academicNeeds.save'),'pwa_necesidades_academicas')
      if(route==='inventory.list')return rpc2(request,'list',{},'pwa_inventario')
      if(route==='academicSubjects.list'||route==='academicYears.list')return rpc2(request,route==='academicSubjects.list'?'subjects':'years',{},'pwa_preparacion_academica')
      if(route==='academicSubjects.save'){
        if(typeof data.nombre!=='string'||!data.nombre.trim()||data.nombre.trim().length>150||typeof data.huella!=='string'||!/^[a-f0-9]{32}$/.test(data.huella))throw new AccessError(400,'Revisa el nombre y recarga la asignatura antes de guardar.')
        return rpc2(request,'subject.save',{id:positiveId(data.id),nombre:data.nombre.trim(),huella:data.huella},'pwa_preparacion_academica')
      }
      if(route==='academicYears.save'){
        if(!Number.isSafeInteger(data.revision)||data.revision<0||!Number.isInteger(data.ano_estudio)||data.ano_estudio<1||data.ano_estudio>10||(data.cantidad_estudiantes!==null&&(!Number.isInteger(data.cantidad_estudiantes)||data.cantidad_estudiantes<1||data.cantidad_estudiantes>999999))||(data.sede!==null&&(typeof data.sede!=='string'||!data.sede.trim()||data.sede.trim().length>100)))throw new AccessError(400,'Indica una cantidad de estudiantes positiva y una sede, o déjalos pendientes.')
        return rpc2(request,'year.save',{id_periodo:positiveId(data.id_periodo),id_carrera:positiveId(data.id_carrera),ano_estudio:data.ano_estudio,revision:data.revision,cantidad_estudiantes:data.cantidad_estudiantes,sede:data.sede?.trim()??null},'pwa_preparacion_academica')
      }
      if (['preparation.template','preparation.preview','preparation.confirm'].includes(route)) {
        if (!['asignaciones','espacios'].includes(data.tipo)) throw new AccessError(400,'Tipo de archivo no válido.')
        const context=await rpc(request,'context')
        const admin=hasGlobalAccess(profile)
        const allowed=admin || context.funciones?.includes(data.tipo==='espacios'?'planificador':'coordinador')
        if(!allowed) throw new AccessError(403,'No tienes permiso para revisar este tipo de archivo.')
        const [periodos,carreras,asignaturas,docentes]=await Promise.all([rpc(request,'periods.list'),...['carreras','asignaturas','docentes'].map(name=>rpc2(request,`${name}.list`))])
        const inScope=id=>admin||context.carreras?.includes(id)
        const catalog={carreras:carreras.filter(c=>inScope(c.id_carrera)),asignaturas:asignaturas.filter(a=>inScope(a.id_carrera)),docentes}
        if (data.tipo === 'asignaciones') {
          if (!serviceKey) throw new AccessError(503, 'Falta configurar el catálogo de departamentos en el backend.')
          const response = await fetchImpl(`${url}/rest/v1/pwa_carrera_departamento?select=id_carrera,pwa_departamentos(nombre)`, {
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
            signal: AbortSignal.timeout(10000),
          }).catch(() => null)
          const links = response?.ok ? await response.json().catch(() => null) : null
          if (!Array.isArray(links)) throw new AccessError(503, 'No se pudo consultar el catálogo de departamentos.')
          const byCareer = new Map(links.map(link => [link.id_carrera, link.pwa_departamentos?.nombre]))
          catalog.carreras = catalog.carreras.map(career => ({ ...career, departamento: byCareer.get(career.id_carrera) }))
        }
        if(route==='preparation.template') {
          const file=data.tipo==='asignaciones'?await assignmentTemplate(catalog.carreras):await preparationTemplate(data.tipo,catalog)
          return {archivo:`PROVISIONAL_${data.tipo}.xlsx`,base64:file.toString('base64')}
        }
        if(typeof data.base64!=='string'||data.base64.length>2800000||!data.base64.length||data.base64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(data.base64))throw new AccessError(400,'Archivo inválido o mayor de 2 MB.')
        if(data.tipo==='asignaciones'){
          const parsed=validateAssignmentDepartments(await readAssignments(Buffer.from(data.base64,'base64')),catalog.carreras)
          const period=periodos.find(p=>p.es_activo)
          if(!period)throw new AccessError(409,'Activa un semestre antes de revisar la asignación.')
          if(data.id_periodo!==period.id_periodo)throw new AccessError(409,'El semestre activo cambió. Actualiza la página y revisa de nuevo.')
          const columns=['cedula_docente','nombre_docente','codigo_asignatura','nombre_asignatura','carrera','departamento','ano_estudio','turno','horas_semestre','docente_estado','asignatura_estado']
          if(parsed.errors.length){
            if(route==='preparation.confirm')throw new AccessError(400,'El archivo tiene errores; vuelve a revisarlo.')
            return{tipo:data.tipo,semestre:period.id_periodo,columnas:columns,filas:parsed.rows,errores:parsed.errors,avisos:[],valido:false,guardado:false}
          }
          if(route==='preparation.confirm'&&(typeof data.huella!=='string'||!/^[a-f0-9]{32}$/.test(data.huella)))throw new AccessError(400,'Revisa el archivo antes de confirmar.')
          const result=await rpc2(request,route==='preparation.confirm'?'confirm':'preview',{rows:parsed.rows,id_periodo:period.id_periodo,huella:data.huella},'pwa_importar_asignacion')
          return{...result,tipo:data.tipo,columnas:columns,avisos:['Se añaden relaciones; no se retiran docentes anteriores ni se reemplazan asignaciones con otra carga. No se crean cuentas de acceso.']}
        }
        const period=periodos.find(p=>p.es_activo)
        if(!period || data.id_periodo!==period.id_periodo)throw new AccessError(409,'El semestre activo cambió. Actualiza la página y revisa de nuevo.')
        const parsed=await previewPreparation(data.tipo,Buffer.from(data.base64,'base64'),{period})
        if(!parsed.valido){if(route==='preparation.confirm')throw new AccessError(400,'El archivo tiene errores; vuelve a revisarlo.');return parsed}
        if(route==='preparation.confirm'&&(typeof data.huella!=='string'||!/^[a-f0-9]{32}$/.test(data.huella)))throw new AccessError(400,'Revisa el inventario antes de confirmar.')
        const result=await rpc2(request,route==='preparation.confirm'?'confirm':'preview',{rows:parsed.filas,id_periodo:period.id_periodo,huella:data.huella},'pwa_inventario')
        return {...parsed,...result,columnas:[...parsed.columnas,'accion'],avisos:['Se incorporan pabellones y aulas completas. No se sobrescriben capacidad, tipo ni estado de aulas existentes.']}
      }
      if (route === 'academicAssignments.context' || route === 'academicAssignments.save') return rpc2(request,route==='academicAssignments.save'?'save':'context',assignmentCorrection(data,route==='academicAssignments.save'),'pwa_corregir_asignacion')
      if (route === 'academicAssignments.list') return rpc2(request,'list',{},'pwa_importar_asignacion')
      if (route === 'academicAssignments.manual') {
        const context = await rpc(request, 'context')
        const admin = hasGlobalAccess(profile)
        const allowed = admin || context.funciones?.includes('coordinador')
        if (!allowed) throw new AccessError(403, 'No tienes permiso para registrar asignaciones académicas.')
        const periodos = await rpc(request, 'periods.list')
        const period = periodos.find(p => p.es_activo)
        if (!period) throw new AccessError(409, 'Activa un semestre antes de registrar la asignación.')
        if (data.id_periodo && data.id_periodo !== period.id_periodo) {
          throw new AccessError(409, 'El semestre activo cambió. Actualiza la página y revisa de nuevo.')
        }

        const {
          carrera,
          ano_estudio,
          turno,
          codigo_asignatura,
          nombre_asignatura,
          cedula_docente,
          nombre_docente,
          horas_semestre,
        } = data

        if (
          !carrera ||
          !ano_estudio ||
          !turno ||
          !codigo_asignatura ||
          !nombre_asignatura ||
          !cedula_docente ||
          !nombre_docente ||
          !horas_semestre
        ) {
          throw new AccessError(
            400,
            'Todos los campos son obligatorios: carrera, año, turno, asignatura, docente y horas.'
          )
        }

        const [carreras] = await Promise.all([rpc2(request, 'carreras.list')])
        const inScope = id => admin || context.carreras?.includes(id)
        let careers = carreras.filter(c => inScope(c.id_carrera))
        if (!serviceKey) throw new AccessError(503, 'Falta configurar el catálogo de departamentos en el backend.')
        const response = await fetchImpl(
          `${url}/rest/v1/pwa_carrera_departamento?select=id_carrera,pwa_departamentos(nombre)`,
          {
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
            signal: AbortSignal.timeout(10000),
          }
        ).catch(() => null)
        const links = response?.ok ? await response.json().catch(() => null) : null
        if (!Array.isArray(links)) throw new AccessError(503, 'No se pudo consultar el catálogo de departamentos.')
        const byCareer = new Map(links.map(link => [link.id_carrera, link.pwa_departamentos?.nombre]))
        careers = careers.map(c => ({ ...c, departamento: byCareer.get(c.id_carrera) }))

        const row = {
          fila: 2,
          carrera: String(carrera).trim(),
          ano_estudio: Number(ano_estudio),
          turno:
            {
              matutino: 'matutino',
              vespertino: 'vespertino',
              nocturno: 'nocturno',
              'por encuentros': 'encuentros',
              encuentros: 'encuentros',
            }[String(turno).trim().toLowerCase()] || '',
          codigo_asignatura: String(codigo_asignatura).trim().toUpperCase(),
          nombre_asignatura: String(nombre_asignatura).trim(),
          cedula_docente: String(cedula_docente).replace(/[\s-]/g, '').toUpperCase(),
          nombre_docente: String(nombre_docente).trim(),
          horas_semestre: Number(horas_semestre),
        }

        if (!row.turno)
          throw new AccessError(400, 'Turno inválido. Usa Matutino, Vespertino, Nocturno o Por encuentros.')
        if (!/^[A-Z0-9]{1,40}$/.test(row.cedula_docente))
          throw new AccessError(400, 'Cédula de docente inválida. Debe contener letras y números.')
        if (Number.isNaN(row.ano_estudio) || row.ano_estudio < 1 || row.ano_estudio > 10)
          throw new AccessError(400, 'Año inválido. Debe ser un número entre 1 y 10.')
        if (Number.isNaN(row.horas_semestre) || row.horas_semestre < 1 || row.horas_semestre > 10000)
          throw new AccessError(400, 'Horas semestrales inválidas.')

        const parsed = validateAssignmentDepartments({ rows: [row], errors: [] }, careers)
        if (parsed.errors.length) {
          throw new AccessError(400, parsed.errors[0].motivo)
        }

        const previewResult = await rpc2(
          request,
          'preview',
          { rows: parsed.rows, id_periodo: period.id_periodo },
          'pwa_importar_asignacion'
        )

        if (!previewResult?.valido || !previewResult?.huella) {
          const errMsg =
            previewResult?.errores?.[0]?.motivo ||
            previewResult?.errores?.[0]?.mensaje ||
            'La asignación no pudo validarse en la base de datos.'
          throw new AccessError(400, errMsg)
        }

        const confirmResult = await rpc2(
          request,
          'confirm',
          { rows: parsed.rows, id_periodo: period.id_periodo, huella: previewResult.huella },
          'pwa_importar_asignacion'
        )

        return { guardado: true, ...confirmResult, mensaje: 'Asignación académica registrada exitosamente.' }
      }
      if (route === 'restrictions.context') {
        try { return await rpc2(request,'context',{},'pwa_restricciones_unificadas') }
        catch(error) {
          if(!error.migrationMissing)throw error
          const [docentes,restricciones]=await Promise.all([rpc2(request,'docentes.list'),rpc2(request,'list',{},'pwa_restricciones_api')])
          return {version:1,docentes:docentes.map(d=>({...d,nombre:`${d.nombres} ${d.apellidos||''}`.trim(),origen:'historico'})),restricciones:restricciones.map(r=>({...r,origen:'historico'}))}
        }
      }
      if (route === 'restrictions.unifiedSave') {
        const input=unifiedRestrictionInput(data)
        if(input.origen==='historico') {const {origen,...payload}=input;return {...await rpc2(request,'save',payload,'pwa_restricciones_api'),origen}}
        return rpc2(request,'save',input,'pwa_restricciones_unificadas')
      }
      if (route === 'restrictions.list') return rpc2(request, 'list', {}, 'pwa_restricciones_api')
      if (route === 'restrictions.save') return rpc2(request, 'save', restrictionInput(data), 'pwa_restricciones_api')
      if (route === 'grids.list') return rpc2(request, 'list', {}, 'pwa_cuadriculas_api')
      if (route === 'grids.save') return rpc2(request, 'save', gridInput(data), 'pwa_cuadriculas_api')
      if (route === 'groupGrids.list') return rpc2(request, 'list', {}, 'pwa_grupos_turnos_api')

      if (['import.history', 'import.template'].includes(route)) {
        const context = await rpc(request, 'context')
        if (!hasGlobalAccess(profile) && !context.funciones?.includes('coordinador')) throw new AccessError(403, 'Solo administración o coordinación pueden importar programación.')
        if (route === 'import.history') return rpc2(request, 'history', {}, 'pwa_importacion')
        if (route === 'import.template') {
          const [periodos, carreras, secciones, asignaturas, docentes, recursos] = await Promise.all([rpc(request, 'periods.list'), ...['carreras', 'secciones', 'asignaturas', 'docentes', 'recursos'].map(name => rpc2(request, `${name}.list`))])
          const allowed = id => hasGlobalAccess(profile) || context.carreras?.includes(id)
          const buffer = await importTemplate({ periodos, carreras: carreras.filter(c => allowed(c.id_carrera)), secciones: secciones.filter(s => allowed(s.id_carrera)), asignaturas: asignaturas.filter(a => allowed(a.id_carrera)), docentes, recursos })
          return { archivo: 'AcaPlan_programacion.xlsx', base64: buffer.toString('base64') }
        }
      }
      if (route.startsWith('accounts.') && !hasGlobalAccess(profile)) throw new AccessError(403, 'Solo un administrador puede gestionar cuentas.')
      if (route === 'context') {
        const context = await rpc(request, 'context')
        const isAdmin = hasGlobalAccess(profile)
        const institutional = context.departmentScopeVersion >= 1
        const departmental = context.departmentScopeVersion >= 1 && context.esDirectorDepartamento === true
        const canManageCarreras = isAdmin || (!institutional && Boolean(context.funciones?.includes('planificador')))
        const canManageAsignaturas = isAdmin || (!departmental && Boolean(context.funciones?.includes('coordinador')))
        const canManageEspacios = canManageCarreras
        const canManageBloques = canManageEspacios
        const canReadDrafts = canManageBloques || (departmental ? Boolean(context.id_departamento) : !institutional && Boolean(context.funciones?.includes('aprobador')))
        const canManageSecciones = canManageAsignaturas
        const canManageDisponibilidad = isAdmin || (Boolean(context.funciones?.includes('jefe_departamento')) && (!departmental || Boolean(context.id_departamento)))
        return { ...context, isAdmin, canCreateAccounts: isAdmin && Boolean(serviceKey), canManageCarreras, canManageAsignaturas, canManageEspacios, canManageSecciones, canManageBloques, canReadDrafts, canManageDisponibilidad }
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
      if (route === 'aulas.update') return rpc2(request, 'update', aulaInput(data), 'pwa_inventario')
      if (route === 'pabellones.update' || route === 'pabellones.delete') {
        const admin = hasGlobalAccess(profile)
        if (!admin) {
          const context = await rpc(request, 'context')
          const institutional = context.departmentScopeVersion >= 1
          const canManageEspacios = !institutional && Boolean(context.funciones?.includes('planificador'))
          if (!canManageEspacios) throw new AccessError(403, 'No tienes permiso para gestionar espacios.')
        }
        if (!serviceKey) throw new AccessError(503, 'Falta la clave de servicio en el backend.')

        if (route === 'pabellones.update') {
          const input = pabellonInput(data)
          const adminHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
          let response
          try {
            response = await fetchImpl(`${url}/rest/v1/pabellones?id_pabellon=eq.${encodeURIComponent(input.id)}`, {
              method: 'PATCH',
              headers: adminHeaders,
              body: JSON.stringify({ nombre: input.nombre }),
              signal: AbortSignal.timeout(15000),
            })
          } catch {
            const error = new AccessError(503, 'No se pudo confirmar la operación con la base de datos.')
            error.uncertain = true
            throw error
          }
          const body = await response.json().catch(() => null)
          if (!response.ok) {
            if (body?.code === '23505') throw new AccessError(409, 'Ya existe un pabellón con ese nombre.')
            throw new AccessError(response.status || 500, body?.message || 'No se pudo actualizar el pabellón.')
          }
          return { ok: true, pabellon: body?.[0] }
        }

        if (route === 'pabellones.delete') {
          const id = positiveId(data.id ?? data.id_pabellon)
          const adminHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
          let response
          try {
            response = await fetchImpl(`${url}/rest/v1/pabellones?id_pabellon=eq.${encodeURIComponent(id)}`, {
              method: 'DELETE',
              headers: adminHeaders,
              signal: AbortSignal.timeout(15000),
            })
          } catch {
            const error = new AccessError(503, 'No se pudo confirmar la operación con la base de datos.')
            error.uncertain = true
            throw error
          }
          if (!response.ok) {
            const body = await response.json().catch(() => null)
            if (body?.code === '23503') throw new AccessError(409, 'No se puede eliminar el pabellón porque tiene aulas registradas. Reasigna o elimina las aulas primero.')
            throw new AccessError(response.status || 500, body?.message || 'No se pudo eliminar el pabellón.')
          }
          return { ok: true }
        }
      }
      // ── Sprint 2: H09 Secciones ──
      if (route === 'secciones.list') return rpc2(request, route)
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
