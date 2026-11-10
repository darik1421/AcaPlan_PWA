import { parentPort, workerData } from 'node:worker_threads'
import { generateProposal } from './generation.js'
try {
  parentPort.postMessage({ type: 'acaplan:generation-result', result: generateProposal(workerData.context, workerData.options) })
} catch (error) {
  parentPort.postMessage({ type: 'acaplan:generation-result', error: error?.message || 'El cálculo no devolvió un resultado.', status: error?.status || 503 })
}
