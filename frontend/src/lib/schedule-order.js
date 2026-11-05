const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
const dayIndex = value => {
  const normalized = String(value ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')
  const index = days.indexOf(normalized)
  return index < 0 ? days.length : index
}
const start = row => {
  const match = String(row.inicio ?? row.hora_inicio ?? '').match(/^(\d{1,2}):(\d{2})/)
  return match ? Number(match[1]) * 60 + Number(match[2]) : 24 * 60
}
export function compareScheduleRows(a, b) {
  return dayIndex(a.dia) - dayIndex(b.dia) || start(a) - start(b) ||
    String(a.carrera ?? a.carrera_nombre ?? '').localeCompare(String(b.carrera ?? b.carrera_nombre ?? ''), 'es') ||
    String(a.asignatura ?? a.asignatura_nombre ?? '').localeCompare(String(b.asignatura ?? b.asignatura_nombre ?? ''), 'es')
}
export const orderedScheduleRows = rows => [...rows].sort(compareScheduleRows)
