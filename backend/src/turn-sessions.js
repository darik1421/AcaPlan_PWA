import { academicRule } from './academic-rules.js'
import { gridInput } from './grid-input.js'

const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

// Posiciones temporales posibles, no clases asignadas ni una solución del horario.
// No combina bloques separados por recesos ni de días distintos.
export function turnSessions(configuration) {
  const grid = gridInput(configuration)
  const rule = academicRule(grid.turno)
  const size = rule.minutos_sesion / rule.minutos_bloque
  const candidates = []
  let capacity = 0
  for (const day of days) {
    const blocks = grid.bloques.filter(b => b.dia === day)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    let lastEnd = ''
    for (let start = 0; start <= blocks.length - size; start++) {
      const session = blocks.slice(start, start + size)
      if (session.some((block, index) => block.es_receso || (index > 0 && session[index - 1].hora_fin !== block.hora_inicio))) continue
      const candidate = { dia: day, hora_inicio: session[0].hora_inicio, hora_fin: session.at(-1).hora_fin }
      candidates.push(candidate)
      // Todas las sesiones del turno tienen igual duración. Contar únicamente
      // intervalos disjuntos evita sumar dos alternativas que usan el mismo bloque.
      if (candidate.hora_inicio >= lastEnd) { capacity++; lastEnd = candidate.hora_fin }
    }
  }
  return { turno: grid.turno, nombre: grid.nombre, minutos_sesion: rule.minutos_sesion,
    sesiones_semanales_regla_general: rule.sesiones_semanales,
    minutos_semanales_regla_general: rule.minutos_semanales,
    candidatos: candidates, capacidad_sesiones_sin_solapar: capacity }
}

export function groupTurn(section, configurations, links) {
  const matches = links.filter(link => link.id_seccion === section?.id_seccion)
  if (!matches.length) return { estado: 'sin_asignar', mensaje: 'Falta asignar los bloques del turno al grupo.' }
  if (matches.length !== 1) return { estado: 'incompatible', mensaje: 'El grupo tiene más de una configuración asignada. Revisa sus datos.' }
  const link = matches[0]
  const grids = configurations.filter(grid => grid.id_cuadricula === link.id_cuadricula)
  const grid = grids[0]
  if (grids.length !== 1 || grid.id_periodo !== section?.id_periodo || link.id_periodo !== section?.id_periodo) {
    return { estado: 'incompatible', mensaje: 'Los bloques asignados no corresponden al semestre del grupo.' }
  }
  try {
    const sessions = turnSessions(grid)
    return { estado: sessions.capacidad_sesiones_sin_solapar ? 'configurado' : 'sin_sesiones',
      id_cuadricula: grid.id_cuadricula, version: grid.version, ...sessions,
      mensaje: sessions.capacidad_sesiones_sin_solapar ? null : 'Los bloques del turno no forman ninguna sesión completa.' }
  } catch {
    return { estado: 'incompatible', mensaje: 'La configuración contiene bloques incompatibles con las reglas del turno.' }
  }
}
