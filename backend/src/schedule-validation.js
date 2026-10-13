import { assignedTeacherIds } from './assigned-teachers.js'
// H15: validador puro de una propuesta completa sobre un snapshot institucional.
// Comprobación local: la persistencia SQL compartida todavía requiere adaptación.
import { academicRule } from './academic-rules.js'
import { studentGaps } from './student-gaps.js'
import { groupTurn } from './turn-sessions.js'
const seconds = value => {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)) return null
  const [h, m, s = '0'] = value.split(':'); return Number(h) * 3600 + Number(m) * 60 + Number(s)
}
const index = (rows, key) => new Map(rows.map(row => [row[key], row]))
const overlap = (a, b) => a.start < b.end && b.start < a.end
export function validateSchedule({ clases, secciones, asignaturas, docentes, aulas, bloques, restricciones, programacion, recursos, cuadriculas = [], gruposTurnos = [] }) {
  const sections = index(secciones, 'id_seccion'), subjects = index(asignaturas, 'id_asignatura')
  const teachers = index(docentes, 'id_docente'), rooms = index(aulas, 'id_aula'), slots = index(bloques, 'id_bloque')
  const resourceIds = new Set(recursos.map(r => r.id_recurso))
  const conflicts = [], intervals = [], seen = new Set(), counts = new Map()
  const issue = (codigo, motivo, ids, recurso = null) => conflicts.push({ codigo, motivo, clases: ids, recurso })
  const turns = new Map(secciones.map(section => [section.id_seccion, groupTurn(section, cuadriculas, gruposTurnos)]))
  for (const section of secciones) {
    const turn = turns.get(section.id_seccion)
    if (turn.estado !== 'configurado') issue('TURNO_PENDIENTE', turn.mensaje, [], { tipo: 'sección', id: section.id_seccion })
  }
  const restrictions = []
  if (!Array.isArray(restricciones)) issue('RESTRICCIONES_SIN_CARGAR', 'Falta consultar las restricciones comunicadas. Una consulta ausente no equivale a una lista vacía.', [])
  else for (const restriction of restricciones) {
    if (restriction?.activa === false) continue
    if (restriction?.activa !== undefined && restriction.activa !== true) {
      issue('RESTRICCION_INVALIDA', 'El estado de una restricción no es válido.', []); continue
    }
    const start = seconds(restriction?.hora_inicio), end = seconds(restriction?.hora_fin)
    if (!restriction || !teachers.has(restriction.id_docente) || !Number.isSafeInteger(restriction.id_periodo) || restriction.id_periodo < 1 ||
      !['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'].includes(restriction.dia) || start === null || end === null || start >= end) {
      issue('RESTRICCION_INVALIDA', 'Hay una restricción comunicada incompleta; corrígela antes de validar.', [])
    } else restrictions.push({ ...restriction, start, end })
  }
  const needIds = new Set()
  const needKeys = new Set()
  for (const need of programacion) {
    const section = sections.get(need.id_seccion), subject = subjects.get(need.id_asignatura)
    const rule = academicRule(turns.get(need.id_seccion)?.turno)
    const key = `${need.id_periodo}:${need.id_seccion}:${need.id_asignatura}`
    if (needKeys.has(key)) issue('NECESIDAD_DUPLICADA', 'Hay más de una necesidad para la misma asignatura del grupo.', [], { tipo: 'programación', id: need.id_programacion })
    needKeys.add(key)
    if (!Number.isSafeInteger(need.id_programacion) || needIds.has(need.id_programacion) || !section || !subject || section.id_periodo !== need.id_periodo || !section.asignaturas?.includes(need.id_asignatura) || !assignedTeacherIds(need)?.every(id => teachers.get(id)?.estado === 'activo') || subject.estado !== 'activo' ||
      !Number.isSafeInteger(need.sesiones_semanales) || need.sesiones_semanales < 1 || !Number.isSafeInteger(need.duracion_bloques) || need.duracion_bloques < 1 ||
      !rule || need.duracion_bloques * rule.minutos_bloque !== rule.minutos_sesion || (rule.sesiones_semanales !== null && need.sesiones_semanales !== rule.sesiones_semanales) ||
      typeof need.requisito_laboratorio !== 'boolean' || !Array.isArray(need.recursos_requeridos) || need.recursos_requeridos.some(id => !resourceIds.has(id))) {
      issue('NECESIDAD_INCOMPLETA', 'Corrige las referencias, la carga y los recursos de la necesidad antes de validar una propuesta.', [], { tipo: 'programación', id: need.id_programacion })
    }
    needIds.add(need.id_programacion)
  }
  for (const section of secciones) for (const subject of section.asignaturas || []) {
    if (!programacion.some(p => p.id_periodo === section.id_periodo && p.id_seccion === section.id_seccion && p.id_asignatura === subject)) issue('PROGRAMACION_FALTANTE', 'Hay una asignatura de la sección sin necesidad registrada.', [], { tipo: 'sección', id: section.id_seccion })
  }
  for (const row of clases) {
    const id = row.id_horario
    if (id === undefined || id === null || id === '' || seen.has(id)) {
      issue('IDENTIDAD_INVALIDA', 'Cada clase de la propuesta necesita un identificador único.', [id ?? null]); continue
    }
    seen.add(id)
    const section = sections.get(row.id_seccion), subject = subjects.get(row.id_asignatura)
    const needs = programacion.filter(p => p.id_periodo === section?.id_periodo && p.id_seccion === row.id_seccion && p.id_asignatura === row.id_asignatura)
    const need = needs.length === 1 ? needs[0] : null
    const assigned = assignedTeacherIds(need)
    const declared = assignedTeacherIds(row)
    // La programación de coordinación reserva a todos, aunque una fila antigua
    // solo conserve el docente singular. Una lista explícita no puede omitirlos.
    const teacherIds = row.id_docentes === undefined && assigned?.includes(row.id_docente) ? assigned : declared
    const room = rooms.get(row.id_aula)
    if (!section || !subject || !teacherIds || teacherIds.some(id => !teachers.has(id)) || !room) {
      issue('REFERENCIA_INVALIDA', 'La clase referencia una sección, asignatura, docente o aula inexistente.', [id]); continue
    }
    if (subject.estado !== 'activo' || teacherIds.some(id => teachers.get(id).estado !== 'activo') || room.estado !== 'activo') issue('RECURSO_INACTIVO', 'La asignatura, el docente y el aula deben estar activos.', [id])
    if (!section.asignaturas?.includes(row.id_asignatura) || subject.id_carrera !== section.id_carrera || subject.ano_estudio !== section.ano_estudio) issue('MALLA_INCOMPATIBLE', 'La asignatura no pertenece a la sección.', [id])
    if (!Number.isSafeInteger(section.cantidad_estudiantes) || section.cantidad_estudiantes < 1 || !Number.isSafeInteger(room.capacidad) || room.capacidad < section.cantidad_estudiantes) issue('CAPACIDAD', 'El aula no tiene capacidad suficiente para la sección.', [id], { tipo: 'aula', id: row.id_aula })
    if (!need || !assigned || assigned.length !== teacherIds.length || !assigned.every(id => teacherIds.includes(id))) issue('PROGRAMACION_INVALIDA', 'La clase debe corresponder a una necesidad única y a todos sus docentes asignados.', [id])
    else {
      counts.set(need.id_programacion, (counts.get(need.id_programacion) || 0) + 1)
      if (!Array.isArray(need.recursos_requeridos)) issue('RECURSOS_SIN_DECLARAR', 'La necesidad no declara sus recursos obligatorios.', [id])
      else for (const resource of need.recursos_requeridos) {
        if (!resourceIds.has(resource) || !room.recursos?.includes(resource)) issue('RECURSO_FALTANTE', 'El aula no dispone de un recurso obligatorio válido.', [id], { tipo: 'recurso', id: resource })
      }
      if (need.requisito_laboratorio && room.tipo !== 'laboratorio') issue('LABORATORIO', 'La necesidad requiere un laboratorio.', [id], { tipo: 'aula', id: row.id_aula })

    }
    const ids = row.id_bloques ?? [row.id_bloque]
    if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length || ids.some(b => !slots.has(b))) {
      issue('BLOQUE_INVALIDO', 'Selecciona bloques existentes y sin repetir.', [id]); continue
    }
    const selected = ids.map(b => slots.get(b)).map(b => ({ ...b, start: seconds(b.hora_inicio), end: seconds(b.hora_fin) })).sort((a, b) => a.start - b.start)
    if (selected.some(b => b.start === null || b.end === null || b.start >= b.end || b.id_periodo !== section.id_periodo || b.dia !== selected[0].dia)) {
      issue('INTERVALO_INVALIDO', 'Todos los bloques deben ser válidos y pertenecer al mismo día y período de la sección.', [id]); continue
    }
    if (selected.some(b => b.es_receso)) issue('RECESO', 'No se permiten clases durante un receso.', [id])
    const turn = turns.get(row.id_seccion), rule = academicRule(turn?.turno)
    if (rule && selected.some(b => b.end - b.start !== rule.minutos_bloque * 60)) issue('DURACION_BLOQUE', 'La duración de los bloques no corresponde al turno del grupo.', [id])
    const grid = cuadriculas.find(g => g.id_cuadricula === turn?.id_cuadricula)
    if (!grid || selected.some(b => !grid.bloques.some(slot => slot.dia === b.dia && !slot.es_receso && seconds(slot.hora_inicio) === b.start && seconds(slot.hora_fin) === b.end))) {
      issue('BLOQUE_FUERA_TURNO', 'La clase utiliza bloques ajenos a la configuración del grupo.', [id])
    }
    if (rule && selected.reduce((total,b) => total + b.end-b.start,0) !== rule.minutos_sesion*60) issue('DURACION_SESION', 'La sesión no tiene la duración acordada para el turno.', [id])
    if (selected.some((b, n) => n && b.start !== selected[n - 1].end)) issue('BLOQUES_NO_CONSECUTIVOS', 'Los bloques de una sesión deben ser consecutivos, sin huecos ni solapes.', [id])
    if (need && selected.length !== need.duracion_bloques) issue('DURACION_SESION', 'La duración de la sesión no coincide con la necesidad.', [id])
    const interval = { id, row, teacherIds, period: section.id_periodo, day: selected[0].dia, start: selected[0].start, end: selected.at(-1).end }
    for (const teacherId of teacherIds) {
      if (restrictions.some(r => r.id_docente === teacherId && r.id_periodo === interval.period && r.dia === interval.day && overlap(r, interval))) {
        issue('RESTRICCION_DOCENTE', 'La sesión coincide con una restricción comunicada del docente.', [id], { tipo: 'docente', id: teacherId })
      }
    }
    intervals.push(interval)
  }
  for (let i = 0; i < intervals.length; i++) for (let j = i + 1; j < intervals.length; j++) {
    const a = intervals[i], b = intervals[j]
    if (a.period !== b.period || a.day !== b.day || !overlap(a, b)) continue
    for (const teacherId of a.teacherIds.filter(id => b.teacherIds.includes(id))) {
      issue('TRASLAPE', 'Las clases se superponen para el mismo recurso: docente.', [a.id, b.id], { tipo: 'docente', id: teacherId })
    }
    for (const [field, type] of [['id_aula', 'aula'], ['id_seccion', 'sección']]) {
      if (a.row[field] === b.row[field]) issue('TRASLAPE', `Las clases se superponen para el mismo recurso: ${type}.`, [a.id, b.id], { tipo: type, id: a.row[field] })
    }
  }
  const pending = []
  for (const need of programacion) {
    const scheduled = counts.get(need.id_programacion) || 0
    if (scheduled > need.sesiones_semanales) issue('SESIONES_EXCEDIDAS', 'Hay más sesiones que las requeridas.', clases.filter(c => c.id_seccion === need.id_seccion && c.id_asignatura === need.id_asignatura && sections.get(c.id_seccion)?.id_periodo === need.id_periodo).map(c => c.id_horario))
    if (scheduled < need.sesiones_semanales) pending.push({ id_programacion: need.id_programacion, sesiones_pendientes: need.sesiones_semanales - scheduled })
  }
  const gaps = studentGaps({ clases, secciones, bloques, cuadriculas, gruposTurnos })
  for (const gap of gaps) issue('HUECO_ESTUDIANTIL', 'Hay un hueco entre sesiones del grupo, descontando únicamente los recesos de su turno.', gap.clases, { tipo: 'sección', id: gap.id_seccion })
  return { valido: conflicts.length === 0, completo: conflicts.length === 0 && pending.length === 0 && programacion.length > 0,
    aprobado: false, conflictos: conflicts, pendientes: pending }
}
