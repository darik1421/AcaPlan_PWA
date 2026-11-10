import { validateSchedule } from './schedule-validation.js'
import { studentGaps } from './student-gaps.js'
import { FLOW_ADAPTATION_PENDING } from './academic-rules.js'

// Recibe sesiones explícitas (id_bloques), no intenta adivinar qué filas antiguas
// forman una sesión. No se conecta a publicación hasta migrar la persistencia.
export function planningDiagnostic(snapshot) {
  const checked = validateSchedule(snapshot)
  const gaps = studentGaps(snapshot)
  return { ...checked, valido: false, completo: false, adaptacion_pendiente: true,
    id_periodo: snapshot.id_periodo, minutos_huecos: gaps.reduce((sum, gap) => sum + gap.minutos, 0),
    comprobado: new Date().toISOString(), aviso: FLOW_ADAPTATION_PENDING }
}
