// Acuerdos confirmados por el equipo. La carga contractual no determina sesiones.
export function academicRule(turno) {
  if (turno === 'matutino' || turno === 'vespertino') {
    return { minutos_bloque: 45, minutos_sesion: 90, sesiones_semanales: 2, minutos_semanales: 180, admite_recesos: true }
  }
  if (turno === 'encuentros') return { minutos_bloque: 60, minutos_sesion: 60, sesiones_semanales: null, minutos_semanales: null, admite_recesos: true }
  if (turno === 'nocturno') return { minutos_bloque: 60, minutos_sesion: 60, sesiones_semanales: null, minutos_semanales: null, admite_recesos: false }
  return null
}

// Hasta completar la migración conjunta, los controles heredados son parciales.
// No basta una respuesta sin cruces para declarar válido el nuevo flujo.
export const FLOW_ADAPTATION_PENDING = 'Pendiente adaptar las cuadrículas por turno, la carga semanal y las restricciones comunicadas. Esta comprobación parcial no valida el horario con el flujo acordado.'
