import { AccessError } from './auth.js'
import { assignmentParts, reviewDraft } from './draft-review.js'
import { turnSessions } from './turn-sessions.js'
import { preparationVersion } from './preparation-version.js'
import { solveScheduleAI, timeToMinutes, intervalsOverlap } from '../../shared/schedule-ai-solver.js'

const days = ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo']
const normalize = s => typeof s === 'string' ? s.trim().toLocaleLowerCase('es') : ''
const key = (id, part) => `${id}:${part}`
export function generationInput(data) {
  if (!Number.isSafeInteger(data?.id) || data.id < 1) throw new AccessError(400, 'Selecciona un borrador de departamento.')
  if (data.lockedDays !== undefined && (!Array.isArray(data.lockedDays) || data.lockedDays.length > 7 || data.lockedDays.some(d => !days.includes(d)) || new Set(data.lockedDays).size !== data.lockedDays.length)) throw new AccessError(400, 'Revisa los días protegidos.')
  if (data.modoProfundo !== undefined && typeof data.modoProfundo !== 'boolean') throw new AccessError(400, 'Revisa el modo de búsqueda.')
  if (data.previas !== undefined && (!Array.isArray(data.previas) || data.previas.length > 2000 || data.previas.some(c => !c || !Number.isSafeInteger(c.id_asignacion) || c.id_asignacion < 1 || !['general','teoria','practica'].includes(c.componente) || !Number.isInteger(c.numero_sesion) || c.numero_sesion < 1 || c.numero_sesion > 2 || !days.includes(c.dia) || ![c.hora_inicio,c.hora_fin].every(t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t))))) throw new AccessError(400, 'La referencia de la propuesta anterior no es válida.')
  if (data.lockedClasses !== undefined && (!Array.isArray(data.lockedClasses) || data.lockedClasses.length > 2000 || data.lockedClasses.some(c => !c || !Number.isSafeInteger(c.id_asignacion) || c.id_asignacion < 1 || !['general','teoria','practica'].includes(c.componente) || !days.includes(c.dia) || ![c.hora_inicio,c.hora_fin].every(t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(t))))) {
    throw new AccessError(400, 'Las clases bloqueadas no son válidas.')
  }
  return {
    id: data.id,
    lockedDays: data.lockedDays || [],
    lockedClasses: (data.lockedClasses || []).map(c => ({
      id_asignacion: c.id_asignacion,
      componente: c.componente,
      dia: c.dia,
      hora_inicio: c.hora_inicio.slice(0, 5),
      hora_fin: c.hora_fin.slice(0, 5),
      id_aula: c.id_aula || null,
    })),
    modoProfundo: data.modoProfundo ?? true,
    ...(data.previas !== undefined ? {previas:data.previas}: {})
  }
}

export function generationVersion(context) {
  return preparationVersion(context).huella_datos
}

export function generateProposal(context, options = {}) {
  const { snapshot, cycle } = context
  if (!cycle?.canPlan) throw new AccessError(403, 'No tienes permiso para preparar horarios.')
  if (!snapshot?.semestre_activo || !snapshot.borrador?.id_departamento || cycle.estado !== 'borrador') throw new AccessError(409, 'Selecciona un borrador departamental editable del semestre activo.')
  if (!['asignaciones','anos','tiempos','espacios','restricciones','consecutivas','clases','ocupaciones_externas'].every(k => Array.isArray(snapshot[k]))) throw new AccessError(503, 'La consulta está incompleta. No se puede generar sobre datos parciales.')
  if (!snapshot.asignaciones.length) throw new AccessError(409, 'El borrador no tiene asignaciones académicas importadas.')
  if (snapshot.ocupaciones_externas.some(r => r.identidad_pendiente || !Array.isArray(r.docentes_ids))) throw new AccessError(409, 'Hay ocupaciones anteriores sin identificar. Deben conciliarse antes de generar.')

  const sections = [], subjects = [], needs = [], blocks = [], teachers = new Map(), parts = new Map(), groups = new Map()
  const teacherLoads = new Map()
  for (const a of snapshot.asignaciones) {
    if (a.estado_carrera !== 'activo' || !a.componentes_vigentes || !a.necesidades?.definidas) throw new AccessError(409, `${a.codigo}: revisa la carrera, teoría/práctica y las necesidades de aula antes de generar.`)
    const groupKey = `${a.id_carrera}:${a.ano_estudio}`
    const year = snapshot.anos.find(y => y.id_carrera === a.id_carrera && y.ano_estudio === a.ano_estudio)
    if (!Number.isInteger(year?.cantidad_estudiantes) || year.cantidad_estudiantes < 1 || !year.sede) throw new AccessError(409, `${a.carrera}, año ${a.ano_estudio}: faltan estudiantes o sede.`)
    const grids = snapshot.tiempos.filter(g => g.turno === a.turno)
    if (grids.length !== 1) throw new AccessError(409, `${a.codigo}: falta una configuración única de tiempos del turno.`)
    const sessions = turnSessions(grids[0])
    if (!sessions.sesiones_semanales_regla_general) throw new AccessError(409, `La frecuencia semanal del turno ${a.turno} sigue pendiente; no se deduce de las horas semestrales.`)
    if (!groups.has(groupKey)) {
      const section = { id_seccion: groupKey, codigo: `${a.carrera} · Año ${a.ano_estudio}`, id_carrera: a.id_carrera, ano_estudio: a.ano_estudio, cantidad_estudiantes: year.cantidad_estudiantes, sede: year.sede, turno: a.turno, modalidad: 'regular' }
      groups.set(groupKey, section); sections.push(section)
      for (const s of sessions.candidatos) blocks.push({ ...s, id_bloque: `${groupKey}:${blocks.length}`, turno: a.turno, id_seccion: groupKey, es_receso: false })
    } else if (groups.get(groupKey).turno !== a.turno) throw new AccessError(409, 'Un año de carrera contiene turnos incompatibles.')
    for (const p of assignmentParts(a)) {
      if (!Number.isInteger(p.sesiones) || p.sesiones < 1 || p.sesiones > 2 || !p.docentes.length || p.docentes.some(id => !a.docentes.some(d => d.id === id && d.activo))) throw new AccessError(409, `${a.codigo}: revisa las sesiones y todos sus docentes.`)
      const id = key(a.id, p.tipo)
      parts.set(id, { a, p, group: groups.get(groupKey) })
      subjects.push({ id_asignatura: id, nombre: a.nombre, codigo: a.codigo })
      for (const d of a.docentes) teachers.set(d.id, { id_docente: d.id, nombre: d.nombre })
      for (const docenteId of new Set(p.docentes)) {
        const loadKey = `${a.turno}:${docenteId}`
        const load = teacherLoads.get(loadKey) ?? {
          nombre: teachers.get(docenteId).nombre,
          turno: a.turno,
          capacidad: sessions.capacidad_sesiones_sin_solapar,
          sesiones: 0,
        }
        load.sesiones += p.sesiones
        teacherLoads.set(loadKey, load)
      }
      needs.push({ id_componente: id, id_seccion: groupKey, id_asignatura: id, id_docente: p.docentes[0], sesiones_semana: p.sesiones, duracion_minutos: sessions.minutos_sesion })
    }
  }
  const overloaded = [...teacherLoads.values()].filter(load => load.sesiones > load.capacidad)
  if (overloaded.length) {
    const details = overloaded.slice(0, 3).map(load =>
      `${load.nombre} necesita ${load.sesiones} sesiones en ${load.turno} y solo hay ${load.capacidad} franjas disponibles`
    )
    const remaining = overloaded.length > 3 ? ` Hay ${overloaded.length - 3} docentes más con exceso de carga.` : ''
    throw new AccessError(409, `La carga docente supera los tiempos del turno. ${details.join('. ')}.${remaining} Revisa los docentes asignados o la configuración de tiempos.`)
  }
  const lockedDays = options.lockedDays || []
  const clientLocked = options.lockedClasses || []
  const protectedClasses = snapshot.clases.filter(c => c.fijada || lockedDays.includes(c.dia))
  for (const lc of clientLocked) {
    if (!protectedClasses.some(c => c.id_asignacion === lc.id_asignacion && c.componente === lc.componente && c.dia === lc.dia && c.hora_inicio.slice(0, 5) === lc.hora_inicio.slice(0, 5))) {
      protectedClasses.push({ ...lc, fijada: true, es_fijada: true })
    }
  }
  const fixedClasses = protectedClasses.map(c => {
    const part = parts.get(key(c.id_asignacion, c.componente))
    if (!part) throw new AccessError(409, 'Una clase protegida ya no corresponde a la entrega académica. Revísala en Borradores.')
    const block = blocks.find(b => b.id_seccion === part.group.id_seccion && b.dia === c.dia && b.hora_inicio === c.hora_inicio.slice(0,5) && b.hora_fin === c.hora_fin.slice(0,5))
    if (!block) throw new AccessError(409, 'Una clase protegida quedó fuera de los tiempos actuales. Revísala antes de generar.')
    return { ...c, id_seccion: part.group.id_seccion, id_asignatura: key(c.id_asignacion,c.componente), id_docente: part.p.docentes[0], id_bloque: block.id_bloque, numero_sesion: 1, es_fijada: true }
  })
  const toClass = (task, candidate, index) => {
    const { a, p } = parts.get(task.subject.id_asignatura)
    const previous = protectedClasses.find(c => c.id_asignacion === a.id && c.componente === p.tipo && c.dia === candidate.block.dia && c.hora_inicio.slice(0,5) === candidate.block.hora_inicio.slice(0,5) && c.hora_fin.slice(0,5) === candidate.block.hora_fin.slice(0,5) && c.id_aula === candidate.room?.id_aula)
    return { id: previous?.id ?? -(index+1), id_asignacion: a.id, componente: p.tipo, id_aula: candidate.room?.id_aula ?? null, dia: candidate.block.dia, hora_inicio: candidate.block.hora_inicio.slice(0,5), hora_fin: candidate.block.hora_fin.slice(0,5), fijada: previous?.fijada ?? false }
  }
  const converted = placed => placed.map((p,i) => toClass(p.task,p.candidate,i))
  const solutionReview = placed => reviewDraft({ ...snapshot, clases: converted(placed) })
  const teacherIds = task => parts.get(task.subject.id_asignatura).p.docentes
  // Solo orientan el orden de búsqueda; no se usan como reservas ni hechos
  // académicos. Toda alternativa conserva las comprobaciones actuales.
  const previousUnfixedPlacements = (options.previas || []).flatMap(c => {
    const part = parts.get(key(c.id_asignacion,c.componente))
    const block = part && blocks.find(b => b.id_seccion === part.group.id_seccion && b.dia === c.dia && b.hora_inicio === c.hora_inicio && b.hora_fin === c.hora_fin)
    return block ? [{id_seccion:part.group.id_seccion,id_asignatura:key(c.id_asignacion,c.componente),sessionNumber:c.numero_sesion,id_bloque:block.id_bloque}] : []
  })
  const result = solveScheduleAI({
    sections, subjects, teachers: [...teachers.values()], rooms: snapshot.espacios, blocks, needs,
    restrictions: snapshot.restricciones, fixedClasses, lockedDays, considerarAulas: true, previousUnfixedPlacements,
    maxNodos: options.modoProfundo === false ? 4000 : 15000, maxTimeMs: options.modoProfundo === false ? 3000 : 8000,
    acceptCandidate: (task, candidate) => {
      const { a, p, group } = parts.get(task.subject.id_asignatura), room = candidate.room
      if (candidate.block.id_seccion !== group.id_seccion || !room || normalize(room.sede) !== normalize(group.sede) || a.necesidades.tipo_espacio && room.tipo !== a.necesidades.tipo_espacio) return false
      if (snapshot.restricciones.some(r => p.docentes.includes(r.id_docente) && r.dia === candidate.block.dia && intervalsOverlap(candidate.startMin,candidate.endMin,timeToMinutes(r.hora_inicio),timeToMinutes(r.hora_fin)))) return false
      return !snapshot.ocupaciones_externas.some(r => r.dia === candidate.block.dia && intervalsOverlap(candidate.startMin,candidate.endMin,timeToMinutes(r.hora_inicio),timeToMinutes(r.hora_fin)) && (r.id_aula === room.id_aula || r.docentes_ids.some(id => p.docentes.includes(id))))
    },
    acceptPlacement: (task,candidate,placed) => !placed.some(other => other.candidate.block.dia === candidate.block.dia && intervalsOverlap(candidate.startMin,candidate.endMin,other.candidate.startMin,other.candidate.endMin) && teacherIds(task).some(id => teacherIds(other.task).includes(id))),
    allowSameDay: task => {
      const { a } = parts.get(task.subject.id_asignatura)
      return snapshot.consecutivas.some(r => r.activa && r.asignacion_a === a.id && r.asignacion_b === a.id)
    },
    acceptSolution: placed => solutionReview(placed).completo,
  })
  const clases = result.clases.map((c,i) => {
    const part = parts.get(c.id_asignatura), candidate = { block: c, room: snapshot.espacios.find(r => r.id_aula === c.id_aula) }
    const placedClass = toClass({subject:{id_asignatura:c.id_asignatura}},candidate,i)
    return { ...c, ...placedClass, es_fijada: Boolean(c.es_fijada || placedClass.fijada), docente_nombre: part.a.docentes.filter(d => part.p.docentes.includes(d.id)).map(d => d.nombre).join(', ') }
  })
  const revision = reviewDraft({ ...snapshot, clases })
  return { ...result, clases, revision, listo_para_guardar: revision.completo, huella: generationVersion(context), mensaje: revision.completo ? 'Propuesta completa comprobada. Aún no está guardada, aprobada ni publicada.' : 'La búsqueda no obtuvo una propuesta completa y válida. Revisa los conflictos y pendientes; no se guardará como completa.' }
}
