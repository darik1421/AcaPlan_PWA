import { parentPort, workerData } from 'node:worker_threads'
import { generateProposal } from './generation.js'
try {
  console.log('[DEBUG WORKER THREAD] starting generateProposal...');
  const res = generateProposal(workerData.context, workerData.options);
  console.log('[DEBUG WORKER THREAD] generateProposal returned type:', typeof res, 'is undefined?', res === undefined);
  parentPort.postMessage({ result: res });
  console.log('[DEBUG WORKER THREAD] postMessage sent.');
} catch (error) {
  console.error('[DEBUG WORKER THREAD] caught error:', error.status, error.message);
  parentPort.postMessage({ error: error.message, status: error.status || 503 });
}
