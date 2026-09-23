import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import { createApp } from '../src/app.js'

test('Salud, métodos no admitidos y rutas inexistentes', async () => {
  const app = createApp()
  app.listen(0, '127.0.0.1')
  await once(app, 'listening')
  const base = `http://127.0.0.1:${app.address().port}`
  try {
    const health = await fetch(base + '/api/health')
    assert.equal(health.status, 200)
    assert.equal(health.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await health.json(), { status: 'ok', service: 'acaplan-api' })
    const head = await fetch(base + '/api/health', { method: 'HEAD' })
    assert.equal(head.status, 200)
    assert.equal(await head.text(), '')
    const write = await fetch(base + '/api/health', { method: 'POST' })
    assert.equal(write.status, 405)
    assert.equal(write.headers.get('allow'), 'GET, HEAD')
    assert.equal((await fetch(base + '/api/usuarios')).status, 404)
  } finally {
    app.closeAllConnections()
    await new Promise((resolve, reject) => app.close(error => error ? reject(error) : resolve()))
  }
})
