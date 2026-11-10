import { Worker } from 'node:worker_threads'
import { AccessError } from './auth.js'
let activeWorkers = 0
export async function parseImport(data) {
  if (typeof data.archivo !== 'string' || !data.archivo.toLowerCase().endsWith('.xlsx') || data.archivo.length > 120) throw new AccessError(400, 'Selecciona un archivo .xlsx con un nombre de hasta 120 caracteres.')
  if (typeof data.base64 !== 'string' || data.base64.length > 2800000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data.base64)) throw new AccessError(400, 'El archivo no es válido o supera 2 MB.')
  if (activeWorkers >= 2) throw new AccessError(429, 'Hay otras importaciones en lectura. Intenta de nuevo en unos segundos.')
  activeWorkers++
  try {
    return await new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./import-worker.js', import.meta.url), { workerData: Buffer.from(data.base64, 'base64'), resourceLimits: { maxOldGenerationSizeMb: 128 } })
      const timer = setTimeout(() => { worker.terminate(); reject(new AccessError(400, 'El archivo tardó demasiado en procesarse. Reduce su tamaño.')) }, 15000)
      worker.once('message', message => { clearTimeout(timer); worker.terminate(); resolve(message.result || { filas: [], errores: [{ hoja: 'Programacion', fila: 1, campo: 'archivo', motivo: 'No se pudo leer el XLSX. Usa la plantilla, sin macros ni vínculos externos, hasta 2 MB y 500 filas.' }] }) })
      worker.once('error', () => { clearTimeout(timer); reject(new AccessError(400, 'No se pudo procesar el archivo. Reduce su tamaño y utiliza la plantilla.')) })
      worker.once('exit', code => { clearTimeout(timer); if (code !== 0) reject(new AccessError(400, 'No se pudo procesar el archivo.')) })
    })
  } finally { activeWorkers-- }
}
