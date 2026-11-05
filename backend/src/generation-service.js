import { Worker } from 'node:worker_threads'
import { AccessError } from './auth.js'
import { generationInput, generationVersion } from './generation.js'
import { reviewDraft } from './draft-review.js'
let running = 0

export function runGeneration(context, options) {
  if (running >= 2) throw new AccessError(503, 'Hay otras propuestas en cálculo. Intenta nuevamente en unos momentos.')
  running++
  return new Promise((resolve, reject) => {
    let worker, timer, finished = false
    const finish = (error, result) => {
      if (finished) return
      finished = true; running--; clearTimeout(timer); worker?.terminate()
      if (error) reject(error); else resolve(result)
    }
    try {
      worker = new Worker(new URL('./generation-worker.js', import.meta.url), { workerData: {context,options}, resourceLimits: { maxOldGenerationSizeMb: 128 } })
      worker.once('message', message => finish(message.error ? new AccessError(message.status, message.error) : null, message.result))
      worker.once('error', () => finish(new AccessError(503, 'El cálculo no pudo completarse. La propuesta anterior no se modificó.')))
      worker.once('exit', () => { if (!finished) finish(new AccessError(503, 'El cálculo se interrumpió; no se guardó ninguna clase.')) })
      timer = setTimeout(() => finish(new AccessError(503, 'El cálculo superó el tiempo disponible; no se guardó ninguna clase.')), 12000)
    } catch { finish(new AccessError(503, 'No se pudo iniciar el cálculo.')) }
  })
}

export async function proposeGeneration({data, load, solve = runGeneration}) {
  const options = generationInput(data), context = await load(options.id)
  const result = await solve(context, options)
  const current = await load(options.id)
  if (generationVersion(current) !== generationVersion(context)) throw new AccessError(409, 'Los datos o las reservas cambiaron durante el cálculo. Consulta y genera nuevamente.')
  return result
}

export async function saveGeneration({data, actor, load, confirm}) {
  const { id } = generationInput(data)
  if (typeof data.huella !== 'string' || !/^[a-f0-9]{64}$/.test(data.huella) || !Array.isArray(data.clases) || !data.clases.length || data.clases.length > 2000) throw new AccessError(400, 'Genera y revisa una propuesta antes de guardarla.')
  const context = await load(id)
  if (!context.cycle?.canPlan) throw new AccessError(403, 'No puedes preparar horarios.')
  if (!context.snapshot?.semestre_activo || context.cycle.estado !== 'borrador' || !context.snapshot.borrador.id_departamento) throw new AccessError(409, 'El borrador ya no admite esta corrección.')
  if (generationVersion(context) !== data.huella) throw new AccessError(409, 'La propuesta está desactualizada. Genera nuevamente antes de guardar.')
  const classes = data.clases.map(c => {
    if (!c || !Number.isSafeInteger(c.id) || !c.id || !Number.isSafeInteger(c.id_asignacion) || c.id_asignacion < 1 || !Number.isInteger(c.id_aula) || c.id_aula < 1 || !['general','teoria','practica'].includes(c.componente) || !['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'].includes(c.dia) || ![c.hora_inicio,c.hora_fin].every(t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) throw new AccessError(400, 'La propuesta contiene una clase inválida.')
    return Object.fromEntries(['id','id_asignacion','componente','id_aula','dia','hora_inicio','hora_fin'].map(k => [k,c[k]]))
  })
  if (new Set(classes.map(c => c.id)).size !== classes.length) throw new AccessError(400, 'La propuesta contiene identificadores repetidos.')
  for (const original of context.snapshot.clases.filter(c => c.fijada)) {
    const match = classes.find(c => c.id === original.id)
    if (!match || ['id_asignacion','componente','id_aula','dia'].some(k => match[k] !== original[k]) || match.hora_inicio !== original.hora_inicio.slice(0,5) || match.hora_fin !== original.hora_fin.slice(0,5)) throw new AccessError(409, 'Una clase fijada no puede moverse ni retirarse desde el generador. Solicita su autorización en Borradores.')
  }
  const review = reviewDraft({...context.snapshot,clases:classes})
  if (!review.completo) throw new AccessError(409, `La propuesta no está completa: ${review.conflictos.length} conflictos y ${review.pendientes.length} pendientes. No se guardó.`)
  return confirm({id,actor,huella_sql:context.huella_sql,version_reglas:context.version_reglas,clases:classes})
}
