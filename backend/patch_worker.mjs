import fs from 'fs';

let code = fs.readFileSync('src/generation-service.js', 'utf8');

const target = `    const finish = (error, result) => {
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
    } catch { finish(new AccessError(503, 'No se pudo iniciar el cálculo.')) }`;

const replacement = `    const finish = (error, result) => {
      console.log('[DEBUG WORKER finish] error:', error?.message, 'result type:', typeof result);
      if (finished) return;
      finished = true; running--; clearTimeout(timer); worker?.terminate();
      if (error) reject(error); else resolve(result);
    };
    try {
      worker = new Worker(new URL('./generation-worker.js', import.meta.url), { workerData: {context,options}, resourceLimits: { maxOldGenerationSizeMb: 128 } });
      worker.once('message', message => {
        console.log('[DEBUG WORKER message]', 'hasError:', Boolean(message?.error), 'errorMsg:', message?.error, 'hasResult:', Boolean(message?.result));
        finish(message.error ? new AccessError(message.status, message.error) : null, message.result);
      });
      worker.once('error', err => {
        console.log('[DEBUG WORKER error event]:', err);
        finish(new AccessError(503, 'El cálculo no pudo completarse. La propuesta anterior no se modificó.'));
      });
      worker.once('exit', code => {
        console.log('[DEBUG WORKER exit event] code:', code, 'finished:', finished);
        if (!finished) finish(new AccessError(503, 'El cálculo se interrumpió; no se guardó ninguna clase.'));
      });
      timer = setTimeout(() => {
        console.log('[DEBUG WORKER timeout]');
        finish(new AccessError(503, 'El cálculo superó el tiempo disponible; no se guardó ninguna clase.'));
      }, 12000);
    } catch (e) {
      console.log('[DEBUG WORKER try/catch]:', e);
      finish(new AccessError(503, 'No se pudo iniciar el cálculo.'));
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/generation-service.js', code, 'utf8');
console.log('Patched generation-service.js with worker logging.');
