import assert from 'node:assert/strict'
import test from 'node:test'
import { authenticate } from '../src/auth.js'

const request = { headers: { authorization: 'Bearer test-token' } }
const base = { url: 'https://project.supabase.co', key: 'public-key' }
const active = { id_usuario: 1, nombre: 'Cuenta de prueba', correo: 'persona@example.test', rol: 'administrador', estado: 'activo' }
function mockResponses(userStatus = 200, profiles = [active], profileStatus = 200) {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return calls.length === 1
      ? new Response(JSON.stringify({ id: 'auth-id', email: active.correo }), { status: userStatus })
      : new Response(JSON.stringify(profiles), { status: profileStatus })
  }
  return { fetchImpl, calls }
}

test('Rechaza solicitudes sin Bearer antes de contactar Supabase', async () => {
  let called = false
  for (const authorization of [undefined, 'Basic test', 'Bearer ', 'Bearer a b']) {
    await assert.rejects(authenticate({ headers: { authorization } }, {
      ...base, fetchImpl: () => { called = true },
    }), error => error.status === 401)
  }
  assert.equal(called, false)
})

test('Sin configuración del servidor no permite acceso', async () => {
  await assert.rejects(authenticate(request, { url: '', key: '' }), error => error.status === 503)
})

test('Token inválido no consulta perfiles', async () => {
  const mock = mockResponses(401)
  await assert.rejects(authenticate(request, { ...base, ...mock }), error => error.status === 401)
  assert.equal(mock.calls.length, 1)
})

test('Verifica el token con Auth, usa RLS y devuelve únicamente campos permitidos', async () => {
  const mock = mockResponses(200, [{ ...active, contrasena: 'NUNCA DEVOLVER', cedula: 'PRIVADO' }])
  assert.deepEqual(await authenticate(request, { ...base, ...mock }), active)
  assert.equal(mock.calls[0].url, base.url + '/auth/v1/user')
  assert.equal(mock.calls[1].options.headers.Authorization, 'Bearer test-token')
  const query = new URL(mock.calls[1].url).searchParams
  assert.equal(query.get('correo'), 'eq.' + active.correo)
  assert.equal(query.get('select').includes('contrasena'), false)
  assert.equal(mock.calls[1].options.headers.apikey, base.key)
})

for (const [name, profiles] of [
  ['perfil ausente', []],
  ['cuenta inactiva', [{ ...active, estado: 'inactivo' }]],
  ['rol desconocido', [{ ...active, rol: 'superadmin' }]],
  ['perfil ambiguo', [active, active]],
]) {
  test('Deniega ' + name, async () => {
    await assert.rejects(authenticate(request, { ...base, ...mockResponses(200, profiles) }), error => error.status === 403)
  })
}

test('Reconoce un perfil docente sin convertirlo en administrador', async () => {
  const profile = { ...active, rol: 'docente' }
  assert.deepEqual(await authenticate(request, { ...base, ...mockResponses(200, [profile]) }), profile)
})

test('No expone errores internos de conexión o de RLS', async () => {
  await assert.rejects(authenticate(request, { ...base, fetchImpl: () => { throw new Error('secret') } }), error => error.status === 503 && !error.message.includes('secret'))
  await assert.rejects(authenticate(request, { ...base, ...mockResponses(200, [], 403) }), error => error.status === 503)
})
