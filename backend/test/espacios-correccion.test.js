import assert from 'node:assert/strict'
import test from 'node:test'
import { aulaInput, pabellonInput } from '../src/validation.js'
import { createManagement } from '../src/management.js'

const room = { id: 1, codigo: 'B4', tipo: 'laboratorio', capacidad: 30, recursos: [2, 3], estado: 'activo' }

test('Corregir un aula conserva tipo obligatorio y excluye equipamiento del contrato', () => {
  for (const recursos of [undefined, null, '2', {}, [2, 3]]) assert.equal(Object.hasOwn(aulaInput({ ...room, recursos }), 'recursos'), false)
  for (const tipo of [undefined, null, '']) assert.throws(() => aulaInput({ ...room, tipo }), { status: 400 })
  assert.equal(aulaInput(room).recursos, undefined)
  assert.equal(aulaInput({ ...room, recursos: [] }).recursos, undefined)
  assert.equal(aulaInput(room).tipo, 'laboratorio')
})

test('Validación de pabellón exige nombre no vacío e id positivo para actualización', () => {
  assert.deepEqual(pabellonInput({ id: 1, nombre: 'Pabellón Central' }), { id: 1, nombre: 'Pabellón Central' })
  assert.deepEqual(pabellonInput({ id_pabellon: 2, nombre: 'Edificio B' }), { id: 2, nombre: 'Edificio B' })
  assert.throws(() => pabellonInput({ id: 1, nombre: '' }), { status: 400 })
  assert.throws(() => pabellonInput({ id: -1, nombre: 'A' }), { status: 400 })
  assert.throws(() => pabellonInput({ nombre: 'A' }), { status: 400 })
})

test('Actualizar y eliminar pabellón ejecutan con permisos y mapean restricciones de aulas', async () => {
  const req = { headers: { authorization: 'Bearer test-token' } }
  const calls = []
  const management = createManagement({
    url: 'https://example.test',
    key: 'anon-key',
    serviceKey: 'service-key',
    fetchImpl: async (url, options) => {
      calls.push({ url, ...options })
      if (options.method === 'PATCH') {
        return new Response(JSON.stringify([{ id_pabellon: 1, nombre: 'Pabellón Renovado' }]), { status: 200 })
      }
      if (options.method === 'DELETE') {
        if (url.includes('eq.99')) {
          return new Response(JSON.stringify({ code: '23503', message: 'foreign key violation' }), { status: 409 })
        }
        return new Response(null, { status: 204 })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
  })

  // Actualizar pabellón como admin
  const resUpdate = await management.execute(req, { rol: 'administrador' }, 'pabellones.update', { id: 1, nombre: 'Pabellón Renovado' })
  assert.equal(resUpdate.ok, true)
  assert.equal(resUpdate.pabellon.nombre, 'Pabellón Renovado')
  assert.ok(calls[0].url.includes('/rest/v1/pabellones?id_pabellon=eq.1'))
  assert.equal(calls[0].method, 'PATCH')

  // Eliminar pabellón sin aulas asociadas
  const resDel = await management.execute(req, { rol: 'administrador' }, 'pabellones.delete', { id: 1 })
  assert.equal(resDel.ok, true)

  // Eliminar pabellón con aulas asociadas comunica conflicto 409
  await assert.rejects(
    management.execute(req, { rol: 'administrador' }, 'pabellones.delete', { id: 99 }),
    err => err.status === 409 && err.message.includes('tiene aulas registradas')
  )

  // Sin rol ni función de planificador se deniega 403
  await assert.rejects(
    management.execute(req, { rol: 'docente' }, 'pabellones.update', { id: 1, nombre: 'Nuevo' }),
    err => err.status === 403
  )
})
