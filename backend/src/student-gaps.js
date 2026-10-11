// Solo excluye recesos de la configuración asignada al grupo, semestre y día.
// No infiere descansos a partir de espacios vacíos en el horario.
export function studentGaps({ clases, bloques, secciones, cuadriculas = [], gruposTurnos = [] }) {
  const minutes = value => {
    if (typeof value !== 'string' || !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return NaN
    const [h, m, s = 0] = value.split(':').map(Number)
    return h < 24 && m < 60 && s < 60 ? h * 60 + m + s / 60 : NaN
  }
  const interval = block => ({ start: minutes(block.hora_inicio), end: minutes(block.hora_fin) })
  const valid = item => Number.isFinite(item.start) && Number.isFinite(item.end) && item.start < item.end
  const slots = new Map(bloques.map(b => [b.id_bloque, b]))
  const sections = new Map(secciones.map(s => [s.id_seccion, s]))
  const groups = new Map()
  for (const row of clases.flatMap(c => Array.isArray(c.id_bloques) ? c.id_bloques.map(id_bloque => ({ ...c, id_bloque })) : [c])) {
    const slot = slots.get(row.id_bloque), section = sections.get(row.id_seccion)
    if (!slot || !section || slot.es_receso || slot.id_periodo !== section.id_periodo) continue
    const time = interval(slot)
    if (!valid(time)) continue
    const key = JSON.stringify([section.id_periodo, row.id_seccion, slot.dia])
    if (!groups.has(key)) groups.set(key, { id_periodo: section.id_periodo, id_seccion: row.id_seccion, dia: slot.dia, times: [] })
    groups.get(key).times.push({ ...time, id: row.id_horario })
  }
  const gaps = []
  for (const group of groups.values()) {
    const links = gruposTurnos.filter(link => link.id_seccion === group.id_seccion && link.id_periodo === group.id_periodo)
    const grids = links.length === 1 ? cuadriculas.filter(grid => grid.id_cuadricula === links[0].id_cuadricula && grid.id_periodo === group.id_periodo) : []
    const breaks = (grids.length === 1 ? grids[0].bloques : []).filter(b => b.es_receso && b.dia === group.dia)
      .map(interval).filter(valid).sort((a, b) => a.start - b.start)
    group.times.sort((a, b) => a.start - b.start || a.end - b.end)
    let previous = group.times[0]
    for (const current of group.times.slice(1)) {
      if (current.start > previous.end) {
        let cursor = previous.end, free = 0
        for (const recess of breaks) {
          if (recess.end <= cursor || recess.start >= current.start) continue
          free += Math.max(0, recess.start - cursor)
          cursor = Math.max(cursor, Math.min(current.start, recess.end))
        }
        free += Math.max(0, current.start - cursor)
        if (free > 0) gaps.push({ id_periodo: group.id_periodo, id_seccion: group.id_seccion, dia: group.dia,
          minutos: free, clases: [previous.id, current.id] })
      }
      // Una clase contenida o duplicada no reduce el tramo ya ocupado.
      if (current.end > previous.end) previous = current
    }
  }
  return gaps
}
