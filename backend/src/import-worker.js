import { parentPort, workerData } from 'node:worker_threads'
import { readImportWorkbook } from './import-workbook.js'
try { parentPort.postMessage({ result: await readImportWorkbook(Buffer.from(workerData)) }) }
catch (error) { parentPort.postMessage({ error: error.message }) }
