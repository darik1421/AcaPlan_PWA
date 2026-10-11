import { assignedTeacherIds } from './assigned-teachers.js'
import { groupTurn } from './turn-sessions.js'
// Diagnóstico de captura, no aprobación ni certificado de viabilidad del horario.
// No se deduce la duración de una hora académica a partir de la duración de un bloque.
export function programacionReport({ periodos, carreras, secciones, asignaturas, docentes, programacion, recursos, cuadriculas = [], gruposTurnos = [] }) {
  const periods = new Map(periodos.map(p => [p.id_periodo, p]))
  const careers = new Map(carreras.map(c => [c.id_carrera, c]))
  const subjects = new Map(asignaturas.map(a => [a.id_asignatura, a]))
  const teachers = new Map(docentes.map(d => [d.id_docente, d]))
  const sections = new Map(secciones.map(s => [s.id_seccion, s]))
  const resourceIds = new Set(recursos.map(r => r.id_recurso))
  const needs = new Map()
  for (const p of programacion) {
    const key = `${p.id_periodo}:${p.id_seccion}:${p.id_asignatura}`
    needs.set(key, [...(needs.get(key) || []), p])
  }
  const details = []
  const seen = new Set()
  function append(section, subjectId, records) {
    const subject = subjects.get(subjectId)
    const periodId = records[0]?.id_periodo ?? section?.id_periodo
    const career = careers.get(section?.id_carrera)
    const common = []
    const turn = groupTurn(section, cuadriculas, gruposTurnos)
    if (!section) common.push('La sección ya no existe.')
    if (!periods.has(periodId) || section?.id_periodo !== periodId) common.push('El semestre no coincide con la sección.')
    if (career?.estado !== 'activo') common.push('La carrera no está activa.')
    if (!subject || subject.estado !== 'activo') common.push('La asignatura no está activa.')
    if (!section?.asignaturas?.includes(subjectId) || subject?.id_carrera !== section?.id_carrera || subject?.ano_estudio !== section?.ano_estudio) common.push('La asignatura no pertenece a la malla de esta sección.')
    if (records.length > 1) common.push('Hay más de una programación para esta asignatura y sección.')
    for (const record of records.length ? records : [null]) {
      const pendientes = [...common]
      if (!record) pendientes.push('Falta registrar la programación y asignar docente.')
      else {
        seen.add(record)
        if (!assignedTeacherIds(record)?.every(id => teachers.get(id)?.estado === 'activo')) pendientes.push('El docente no está habilitado.')
        if (!Number.isSafeInteger(record.sesiones_semanales) || record.sesiones_semanales < 1) pendientes.push('Indica una cantidad válida de sesiones semanales.')
        if (!Number.isSafeInteger(record.duracion_bloques) || record.duracion_bloques < 1) pendientes.push('Indica la duración en bloques de cada sesión.')
        if (typeof record.requisito_laboratorio !== 'boolean') pendientes.push('Indica si la necesidad requiere laboratorio.')
        if (!Array.isArray(record.recursos_requeridos)) pendientes.push('Falta declarar los recursos obligatorios de la necesidad.')
        else if (record.recursos_requeridos.some(id => !resourceIds.has(id))) pendientes.push('Un recurso obligatorio ya no existe en el catálogo.')
        if (turn.mensaje) pendientes.push(turn.mensaje)
        else {
          if (turn.sesiones_semanales_regla_general && turn.capacidad_sesiones_sin_solapar < turn.sesiones_semanales_regla_general) pendientes.push('Los bloques configurados no alcanzan para las dos sesiones de 90 minutos de la regla general.')
          pendientes.push('El turno está asignado. Falta adaptar la programación anterior antes de comprobar su duración; no se convierte automáticamente.')
        }
      }
      details.push({
        id_programacion: record?.id_programacion ?? null,
        id_periodo: periodId, periodo_nombre: periods.get(periodId)?.nombre || 'Semestre no encontrado',
        id_carrera: section?.id_carrera ?? null, carrera_nombre: career?.nombre || 'Carrera no encontrada',
        id_seccion: section?.id_seccion ?? record?.id_seccion ?? null, seccion_codigo: section?.codigo || 'Sección no encontrada',
        id_asignatura: subjectId, asignatura_nombre: subject?.nombre || 'Asignatura no encontrada',
        docente_nombre: record ? (assignedTeacherIds(record)?.map(id => [teachers.get(id)?.nombres, teachers.get(id)?.apellidos].filter(Boolean).join(' ') || 'Docente no encontrado').join(', ') || 'Asignación docente no válida') : '',
        horas_carga: subject ? subject.horas_teoricas + subject.horas_practicas : null,
        sesiones_semanales: record?.sesiones_semanales ?? null,
        bloques_semanales: record ? record.sesiones_semanales * record.duracion_bloques : null,
        minutos_semanales: null,
        turno_configurado: turn,
        estado: !record ? 'sin_registrar' : pendientes.length ? 'por_verificar' : 'captura_completa', pendientes,
      })
    }
  }
  for (const section of secciones) {
    for (const subjectId of new Set(section.asignaturas || [])) {
      append(section, subjectId, needs.get(`${section.id_periodo}:${section.id_seccion}:${subjectId}`) || [])
    }
  }
  // No ocultar registros huérfanos o desvinculados detrás de un JOIN o un filtro de malla.
  for (const p of programacion) if (!seen.has(p)) append(sections.get(p.id_seccion), p.id_asignatura, [p])
  return {
    periodos: periodos.map(p => ({ id_periodo: p.id_periodo, nombre: p.nombre })),
    carreras: carreras.map(c => ({ id_carrera: c.id_carrera, nombre: c.nombre })),
    detalles: details,
    secciones_sin_asignaturas: secciones.filter(s => !s.asignaturas?.length).map(s => ({
      id_seccion: s.id_seccion, codigo: s.codigo, id_periodo: s.id_periodo, id_carrera: s.id_carrera,
    })),
    // H13-H15 y el envío a generación/aprobación aún no están conectados.
    habilita_generacion: false,
  }
}
