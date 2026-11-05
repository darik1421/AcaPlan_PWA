import { parentPort, workerData } from 'node:worker_threads'
import { generateProposal } from './generation.js'
try {
  parentPort.postMessage({ result: generateProposal(workerData.context, workerData.options) })
} catch (error) {
  parentPort.postMessage({ error: error.message, status: error.status || 503 })
}
