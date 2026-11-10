import assert from 'node:assert/strict'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { createServer } from '../frontend/node_modules/vite/dist/node/index.js'
import { createApp } from '../backend/src/app.js'

const backend = createApp()
backend.listen(0, '127.0.0.1')
await once(backend, 'listening')
let frontend
try {
  frontend = await createServer({
    root: fileURLToPath(new URL('../frontend', import.meta.url)),
    server: {
      port: 0,
      host: '127.0.0.1',
      proxy: { '/api': `http://127.0.0.1:${backend.address().port}` },
    },
  })
  await frontend.listen()
  const base = `http://127.0.0.1:${frontend.httpServer.address().port}`
  const html = await fetch(base).then(r => r.text())
  assert.ok(html.includes('AcaPlan | Planificación académica'))
  const app = await fetch(base + '/src/App.jsx')
  assert.equal(app.status, 200)
  assert.ok((await app.text()).includes('AuthProvider'))
  const health = await fetch(base + '/api/health')
  assert.equal(health.status, 200)
  assert.deepEqual(await health.json(), { status: 'ok', service: 'acaplan-api' })
  console.log('OK: HTML, React transformado y conexión frontend → proxy → backend.')
} finally {
  if (frontend) await frontend.close()
  backend.closeAllConnections()
  await new Promise(resolve => backend.close(resolve))
}
