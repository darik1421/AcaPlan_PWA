/**
 * Motor Generador de Horarios con IA (AcaPlan - UNAN-Managua, CUR-Chontales)
 * Algoritmo de Búsqueda con Retroceso (Constrained Backtracking)
 * con poda de dominios MRV, balanceo de carga y optimización de huecos estudiantiles.
 */

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [h = '0', m = '0'] = timeStr.split(':')
  return parseInt(h, 10) * 60 + parseInt(m, 10)
}

export function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA
}

export function solveScheduleAI({
  sections = [],
  subjects = [],
  teachers = [],
  rooms = [],
  blocks = [],
  restrictions = [],
  needs = [],
  fixedClasses = [],
  lockedDays = [],
  considerarAulas = false,
  previousUnfixedPlacements = [],
  maxNodos = 12000,
  maxTimeMs = 6000,
  acceptCandidate = () => true,
  acceptPlacement = () => true,
  acceptSolution = () => true,
  allowSameDay = () => false,
}) {
  const startTime = Date.now()
  const lockedDaysSet = new Set(lockedDays)

  // Mapa para penalizar franjas previas al regenerar y forzar exploración
  const previousBlockMap = new Map()
  for (const p of previousUnfixedPlacements) {
    const key = `${p.id_seccion}:${p.id_asignatura}:${p.sessionNumber}`
    previousBlockMap.set(key, p.id_bloque)
  }

  // Mapeos rápidos
  const sectionsMap = new Map(sections.map(s => [s.id_seccion, s]))
  const subjectsMap = new Map(subjects.map(s => [s.id_asignatura, s]))
  const teachersMap = new Map(teachers.map(t => [t.id_docente, t]))
  const activeBlocks = blocks.filter(b => !b.es_receso)

  // Filtro de aulas activas
  const activeRooms = considerarAulas
    ? rooms.filter(r => r.estado === 'activo')
    : []

  // Validación previa
  if (!sections.length || !needs.length || !activeBlocks.length) {
    return {
      estado: 'datos_incompletos',
      mensaje: 'Faltan datos requeridos (grupos/secciones, necesidades académicas o bloques horarios).',
      clases: [],
      estadisticas: {
        totalSesiones: 0,
        sesionesColocadas: 0,
        sesionesFijadasPreservadas: 0,
        pasosExplorados: 0,
        huecosEstudiantilesEvitados: 0,
        tiempoCalculoMs: Date.now() - startTime,
        optimoDemostrado: false,
      },
      pendientes: [],
    }
  }

  // 1. Procesar clases ya fijadas y días bloqueados
  const placed = []
  const fixedCountBySectionSubject = new Map()

  for (const fc of fixedClasses) {
    const isDayLocked = lockedDaysSet.has(fc.dia)
    const isPinned = fc.es_fijada

    if (isDayLocked || isPinned) {
      const section = sectionsMap.get(fc.id_seccion) || {
        id_seccion: fc.id_seccion,
        codigo: fc.seccion_codigo || `SEC-${fc.id_seccion}`,
        id_carrera: 0,
        ano_estudio: 1,
        cantidad_estudiantes: 30,
        modalidad: 'regular',
        turno: 'matutino',
      }
      const subject = subjectsMap.get(fc.id_asignatura) || {
        id_asignatura: fc.id_asignatura,
        codigo: '',
        nombre: fc.asignatura_nombre || `Asig-${fc.id_asignatura}`,
      }
      const teacher = teachersMap.get(fc.id_docente) || {
        id_docente: fc.id_docente,
        nombre: fc.docente_nombre || `Doc-${fc.id_docente}`,
      }
      const block = blocks.find(b => b.id_bloque === fc.id_bloque) || {
        id_bloque: fc.id_bloque,
        dia: fc.dia,
        modalidad: 'regular',
        turno: 'matutino',
        hora_inicio: fc.hora_inicio,
        hora_fin: fc.hora_fin,
        es_receso: false,
      }
      const room = fc.id_aula ? rooms.find(r => r.id_aula === fc.id_aula) || null : null

      const fakeNeed = {
        id_componente: 0,
        id_seccion: fc.id_seccion,
        id_asignatura: fc.id_asignatura,
        id_docente: fc.id_docente,
        sesiones_semana: 2,
        duracion_minutos: 90,
      }

      const key = `${fc.id_seccion}:${fc.id_asignatura}`
      fixedCountBySectionSubject.set(key, (fixedCountBySectionSubject.get(key) || 0) + 1)

      placed.push({
        task: {
          need: fakeNeed,
          section,
          subject,
          teacher,
          sessionNumber: fc.numero_sesion || 1,
          candidates: [],
        },
        candidate: {
          block,
          room,
          startMin: timeToMinutes(fc.hora_inicio),
          endMin: timeToMinutes(fc.hora_fin),
        },
        isFixed: true,
      })
    }
  }

  const sesionesFijadasPreservadas = placed.length

  // 2. Construir tareas para sesiones pendientes
  const tasks = []

  for (const need of needs) {
    const section = sectionsMap.get(need.id_seccion)
    const subject = subjectsMap.get(need.id_asignatura)
    const teacher = teachersMap.get(need.id_docente)

    if (!section || !subject || !teacher) continue

    const key = `${need.id_seccion}:${need.id_asignatura}`
    const alreadyFixedCount = fixedCountBySectionSubject.get(key) || 0

    // Regla institucional: máximo 2 sesiones semanales por asignatura regular
    const targetSessions = Math.min(2, need.sesiones_semana || 2)
    const sessionsToSchedule = Math.max(0, targetSessions - alreadyFixedCount)

    if (sessionsToSchedule <= 0) continue

    // Bloques compatibles con el turno y modalidad del grupo
    const compatibleBlocks = activeBlocks.filter(
      b =>
        (b.turno === section.turno || section.turno === 'todos' || !b.turno) &&
        (b.modalidad === section.modalidad || section.modalidad === 'regular' || !b.modalidad) &&
        !lockedDaysSet.has(b.dia)
    )

    // Restricciones de docentes (aplica principalmente a docentes horarios o con restricciones expresas)
    const teacherRestrictions = restrictions.filter(r => r.id_docente === teacher.id_docente)

    const validBlocks = compatibleBlocks.filter(b => {
      const bStart = timeToMinutes(b.hora_inicio)
      const bEnd = timeToMinutes(b.hora_fin)
      return !teacherRestrictions.some(r => {
        if (r.dia !== b.dia) return false
        const rStart = timeToMinutes(r.hora_inicio)
        const rEnd = timeToMinutes(r.hora_fin)
        return intervalsOverlap(bStart, bEnd, rStart, rEnd)
      })
    })

    // Aulas elegibles (si considerarAulas está activo, de lo contrario [null])
    const eligibleRoomsList = considerarAulas
      ? activeRooms.filter(r => {
          if (r.capacidad && section.cantidad_estudiantes && r.capacidad < section.cantidad_estudiantes) {
            return false
          }
          if (need.requiere_espacio_especializado && need.observacion_espacio) {
            if (!r.tipo?.toLowerCase().includes(need.observacion_espacio.toLowerCase())) {
              return false
            }
          }
          return true
        })
      : [null]

    // Producto cartesiano de bloques válidos y aulas
    const candidates = []
    for (const block of validBlocks) {
      for (const room of eligibleRoomsList) {
        const candidate = {
          block,
          room,
          startMin: timeToMinutes(block.hora_inicio),
          endMin: timeToMinutes(block.hora_fin),
        }
        if (acceptCandidate({ need, section, subject, teacher }, candidate)) candidates.push(candidate)
      }
    }

    // Agregar sesiones requeridas a la cola de tareas
    for (let s = alreadyFixedCount + 1; s <= targetSessions; s++) {
      tasks.push({
        need,
        section,
        subject,
        teacher,
        sessionNumber: s,
        candidates,
      })
    }
  }

  const totalSesiones = placed.length + tasks.length
  let nodosExplorados = 0
  let tiempoAgotado = false

  // Detectar tareas imposibles de inmediato (dominio vacío)
  const impossible = tasks.filter(t => t.candidates.length === 0)
  if (impossible.length > 0 && tasks.length === impossible.length && placed.length === 0) {
    return {
      estado: 'sin_solucion',
      mensaje: `No hay franjas horarias disponibles para ${impossible.length} sesión(es). Revisa la disponibilidad de los docentes o días bloqueados.`,
      clases: [],
      estadisticas: {
        totalSesiones,
        sesionesColocadas: 0,
        sesionesFijadasPreservadas: 0,
        pasosExplorados: 0,
        huecosEstudiantilesEvitados: 0,
        tiempoCalculoMs: Date.now() - startTime,
        optimoDemostrado: false,
      },
      pendientes: impossible.map(t => ({
        seccion: t.section.codigo,
        asignatura: t.subject.nombre,
        sesion: t.sessionNumber,
        motivo: 'Sin bloques compatibles con restricciones docentes y días habilitados.',
      })),
    }
  }

  // Ordenar tareas mediante heurística MRV (Minimum Remaining Values: las más restringidas primero)
  tasks.sort((a, b) => a.candidates.length - b.candidates.length)

  let bestSolution = [...placed]
  let maxPlacedCount = placed.length

  function hasConflict(task, cand, currentPlaced) {
    if (!acceptPlacement(task, cand, currentPlaced)) return true
    // Restricción dura: no colocar en días bloqueados
    if (lockedDaysSet.has(cand.block.dia)) return true

    for (const p of currentPlaced) {
      if (p.candidate.block.dia !== cand.block.dia) continue
      if (!intervalsOverlap(cand.startMin, cand.endMin, p.candidate.startMin, p.candidate.endMin)) {
        continue
      }

      // Conflicto de docente (un profesor no puede estar en dos clases simultáneas)
      if (p.task.teacher.id_docente === task.teacher.id_docente) return true

      // Conflicto de grupo (los estudiantes no pueden recibir dos materias a la vez)
      if (p.task.section.id_seccion === task.section.id_seccion) return true

      // Conflicto de aula física (si se consideran aulas)
      if (considerarAulas && cand.room && p.candidate.room && cand.room.id_aula === p.candidate.room.id_aula) {
        return true
      }
    }

    // Regla dura: máximo 2 sesiones semanales por asignatura para esa sección
    let countForSubject = 0
    for (const p of currentPlaced) {
      if (
        p.task.section.id_seccion === task.section.id_seccion &&
        p.task.subject.id_asignatura === task.subject.id_asignatura
      ) {
        countForSubject++
        if (countForSubject >= 2) return true
      }
    }

    // Regla pedagógica: un grupo no puede tener la misma asignatura dos veces en el MISMO día
    for (const p of currentPlaced) {
      if (
        p.task.section.id_seccion === task.section.id_seccion &&
        p.task.subject.id_asignatura === task.subject.id_asignatura &&
        p.candidate.block.dia === cand.block.dia && !allowSameDay(task, p.task)
      ) {
        return true
      }
    }

    return false
  }

  // Calcular métrica de continuidad estudiantil (menos huecos)
  function calculateGaps(assignments) {
    let gapsAvoided = 0
    const bySectionDay = new Map()
    for (const a of assignments) {
      const key = `${a.task.section.id_seccion}:${a.candidate.block.dia}`
      const list = bySectionDay.get(key) || []
      list.push({ start: a.candidate.startMin, end: a.candidate.endMin })
      bySectionDay.set(key, list)
    }

    for (const list of bySectionDay.values()) {
      if (list.length > 1) {
        list.sort((a, b) => a.start - b.start)
        let continuous = true
        for (let i = 1; i < list.length; i++) {
          if (list[i].start > list[i - 1].end) {
            continuous = false
          }
        }
        if (continuous) gapsAvoided++
      }
    }
    return gapsAvoided
  }

  // Algoritmo de backtracking recursivo
  function backtrack(taskIndex) {
    if (nodosExplorados >= maxNodos || Date.now() - startTime >= maxTimeMs) {
      tiempoAgotado = true
      return false
    }

    nodosExplorados++

    if (taskIndex >= tasks.length) {
      if (!acceptSolution(placed)) return false
      bestSolution = [...placed]
      return true
    }

    const currentTask = tasks[taskIndex]

    // Revisar si ya hay una sesión previa de esta misma materia
    const sibling = placed.find(
      p =>
        p.task.section.id_seccion === currentTask.section.id_seccion &&
        p.task.subject.id_asignatura === currentTask.subject.id_asignatura
    )

    // Contar carga actual por día para balancear
    const sectionDayCount = {
      Lunes: 0,
      Martes: 0,
      Miercoles: 0,
      Jueves: 0,
      Viernes: 0,
      Sabado: 0,
      Domingo: 0,
    }
    for (const p of placed) {
      if (p.task.section.id_seccion === currentTask.section.id_seccion) {
        sectionDayCount[p.candidate.block.dia] = (sectionDayCount[p.candidate.block.dia] || 0) + 1
      }
    }

    // Heurística de ordenamiento de candidatos: pares de días alternos universitarios
    const sortedCandidates = [...currentTask.candidates].sort((a, b) => {
      let scoreA = 0
      let scoreB = 0

      if (sibling) {
        const siblingDay = sibling.candidate.block.dia
        const idealPair = {
          Lunes: 'Miercoles',
          Martes: 'Jueves',
          Miercoles: 'Lunes',
          Jueves: 'Martes',
        }
        if (idealPair[siblingDay] === a.block.dia) scoreA -= 200
        if (idealPair[siblingDay] === b.block.dia) scoreB -= 200

        // Penalizar levemente día consecutivo
        if (Math.abs(DAYS.indexOf(a.block.dia) - DAYS.indexOf(siblingDay)) === 1) scoreA += 50
        if (Math.abs(DAYS.indexOf(b.block.dia) - DAYS.indexOf(siblingDay)) === 1) scoreB += 50
      } else {
        // Primera sesión: priorizar días con menor carga actual para el grupo
        scoreA += (sectionDayCount[a.block.dia] || 0) * 40
        scoreB += (sectionDayCount[b.block.dia] || 0) * 40
      }

      // Criterio 1: orden natural de días
      scoreA += DAYS.indexOf(a.block.dia) * 10
      scoreB += DAYS.indexOf(b.block.dia) * 10

      // Criterio 2: bloques tempranos primero
      scoreA += a.startMin / 100
      scoreB += b.startMin / 100

      // Penalización a asignaciones previas si se vuelve a generar sin fijar
      const taskKey = `${currentTask.section.id_seccion}:${currentTask.subject.id_asignatura}:${currentTask.sessionNumber}`
      const prevBlockId = previousBlockMap.get(taskKey)
      if (prevBlockId !== undefined) {
        if (a.block.id_bloque === prevBlockId) scoreA += 250
        if (b.block.id_bloque === prevBlockId) scoreB += 250
        scoreA += Math.random() * 20
        scoreB += Math.random() * 20
      }

      return scoreA - scoreB
    })

    for (const cand of sortedCandidates) {
      if (!hasConflict(currentTask, cand, placed)) {
        placed.push({ task: currentTask, candidate: cand, isFixed: false })

        if (placed.length > maxPlacedCount) {
          maxPlacedCount = placed.length
          bestSolution = [...placed]
        }

        const found = backtrack(taskIndex + 1)
        if (found) return true

        placed.pop()
        if (tiempoAgotado) return false
      }
    }

    return false
  }

  const completeSuccess = tasks.length === 0 ? true : backtrack(0)
  const finalPlaced = bestSolution
  const huecosEvitados = calculateGaps(finalPlaced)

  // Mapear solución final a clases propuestas
  const clasesPropuestas = finalPlaced.map((p, idx) => ({
    id_horario: p.isFixed ? `fijada-${idx + 1}` : `propuesta-${idx + 1}`,
    id_seccion: p.task.section.id_seccion,
    seccion_codigo: p.task.section.codigo,
    id_asignatura: p.task.subject.id_asignatura,
    asignatura_nombre: p.task.subject.nombre,
    id_docente: p.task.teacher.id_docente,
    docente_nombre: p.task.teacher.nombre,
    id_aula: p.candidate.room?.id_aula ?? null,
    aula_codigo: p.candidate.room?.codigo,
    id_bloque: p.candidate.block.id_bloque,
    dia: p.candidate.block.dia,
    hora_inicio: p.candidate.block.hora_inicio,
    hora_fin: p.candidate.block.hora_fin,
    numero_sesion: p.task.sessionNumber,
    es_fijada: p.isFixed ?? false,
  }))

  const placedKeys = new Set(
    finalPlaced.map(p => `${p.task.section.id_seccion}:${p.task.subject.id_asignatura}:${p.task.sessionNumber}`)
  )

  const pendientes = tasks
    .filter(t => !placedKeys.has(`${t.section.id_seccion}:${t.subject.id_asignatura}:${t.sessionNumber}`))
    .map(t => ({
      seccion: t.section.codigo,
      asignatura: t.subject.nombre,
      sesion: t.sessionNumber,
      motivo: 'Conflicto de horario con docente, grupo o disponibilidad de franjas.',
    }))

  const durationMs = Date.now() - startTime

  if (completeSuccess) {
    return {
      estado: 'propuesta',
      mensaje:
        sesionesFijadasPreservadas > 0
          ? `Propuesta generada exitosamente. Se preservaron ${sesionesFijadasPreservadas} clases fijadas y se colocaron ${tasks.length} sesiones restantes.`
          : `Propuesta completa generada exitosamente: ${clasesPropuestas.length} sesiones asignadas sin colisiones.`,
      clases: clasesPropuestas,
      estadisticas: {
        totalSesiones,
        sesionesColocadas: clasesPropuestas.length,
        sesionesFijadasPreservadas,
        pasosExplorados: nodosExplorados,
        huecosEstudiantilesEvitados: huecosEvitados,
        tiempoCalculoMs: durationMs,
        // Encontrar una solución no demuestra optimalidad global.
        optimoDemostrado: false,
      },
      pendientes: [],
    }
  }

  return {
    estado: tiempoAgotado ? 'busqueda_limitada' : 'parcial',
    mensaje: tiempoAgotado
      ? `Búsqueda acotada: Se asignaron ${clasesPropuestas.length} de ${totalSesiones} sesiones antes de alcanzar el tiempo límite.`
      : `Propuesta parcial: Se asignaron ${clasesPropuestas.length} de ${totalSesiones} sesiones (${sesionesFijadasPreservadas} fijadas). Quedan ${pendientes.length} pendientes.`,
    clases: clasesPropuestas,
    estadisticas: {
      totalSesiones,
      sesionesColocadas: clasesPropuestas.length,
      sesionesFijadasPreservadas,
      pasosExplorados: nodosExplorados,
      huecosEstudiantilesEvitados: huecosEvitados,
      tiempoCalculoMs: durationMs,
      optimoDemostrado: false,
    },
    pendientes,
  }
}

